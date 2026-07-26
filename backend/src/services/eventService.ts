import { randomBytes } from 'node:crypto'
import { query } from '../db'
import { deleteStorageObjects } from '../utils/storage'

export interface getUserEventRoleResult {
  role: 'owner' | 'collaborator' | 'guest' | 'contributor' | 'admin' | null
  isOwner: boolean
  isCollaborator: boolean
  isGuest: boolean
  faceEnrolled: boolean
  faceReferenceUrl?: string | null
  id?: string | null
}

/**
 * Explicit column list for gallery reads. `SELECT *` also pulled the
 * ai_analysis, exif_data and face_embeddings JSON blobs, which the gallery never
 * displays but which dominate the payload size.
 */
export const PHOTO_COLUMNS = `
  id, event_id, uploader_id, blob_url, blob_pathname, thumbnail_url,
  original_filename, file_size, width, height, taken_at, is_host_photo,
  is_shared, processing_status, status, uploaded_by_role, folder_id,
  people_tags, location, created_at
`

/** Upper bound on photos returned in one event-detail payload. */
export const EVENT_PHOTO_LIMIT = Number(process.env.EVENT_PHOTO_LIMIT || 500)

/** Unambiguous alphabet: no O/0 or I/1, so codes survive being read aloud. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return out
}

/**
 * Generates an invite code that is not already taken. Math.random() gave both a
 * predictable code and a real collision chance against a UNIQUE column, which
 * surfaced as an opaque insert failure.
 */
async function generateUniqueCode(
  column: 'invite_code' | 'collaborator_invite_code',
  prefix = ''
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${prefix}${randomCode(8 - Math.min(prefix.length, 4))}`
    const existing = await query(
      `SELECT 1 FROM public.events WHERE ${column} = $1 LIMIT 1`,
      [code]
    )
    if (existing.rowCount === 0) {
      return code
    }
  }
  throw new Error('Could not allocate a unique invite code. Please try again.')
}

export const eventService = {
  /**
   * Resolves the user's role for a specific event
   */
  async getUserEventRole(eventId: string, userId: string): Promise<getUserEventRoleResult> {
    // Resolve host status and guest membership in one round-trip. This runs on
    // essentially every authenticated event request (often several times per
    // request via assertManager), so the previous two sequential queries doubled
    // the latency floor of the whole API.
    const res = await query(
      `SELECT e.host_id,
              eg.id   AS guest_id,
              eg.role AS guest_role,
              eg.face_enrolled,
              eg.face_reference_url
       FROM public.events e
       LEFT JOIN public.event_guests eg
              ON eg.event_id = e.id AND eg.user_id = $2
       WHERE e.id = $1`,
      [eventId, userId]
    )

    const row = res.rows[0]

    if (row && row.host_id === userId) {
      return { role: 'owner', isOwner: true, isCollaborator: false, isGuest: false, faceEnrolled: false, faceReferenceUrl: null, id: null }
    }

    const role = row?.guest_role ?? null
    return {
      role: role,
      isOwner: false,
      isCollaborator: role === 'collaborator',
      isGuest: role === 'guest',
      faceEnrolled: row?.face_enrolled ?? false,
      faceReferenceUrl: row?.face_reference_url ?? null,
      id: row?.guest_id ?? null
    }
  },

  /**
   * Asserts if user is owner or collaborator
   */
  async assertManager(eventId: string, userId: string): Promise<boolean> {
    const roleInfo = await this.getUserEventRole(eventId, userId)
    return roleInfo.isOwner || roleInfo.isCollaborator
  },

  /**
   * Asserts if user is strictly the owner (host)
   */
  async assertOwner(eventId: string, userId: string): Promise<boolean> {
    const roleInfo = await this.getUserEventRole(eventId, userId)
    return roleInfo.isOwner
  },

  /**
   * Updates settings of an event
   */
  async updateEventSettings(eventId: string, userId: string, input: any): Promise<any> {
    const isManager = await this.assertManager(eventId, userId)
    if (!isManager) {
      throw new Error('Not authorized to update event settings.')
    }

    // Fetch current settings
    const eventRes = await query('SELECT settings, cover_image_url FROM public.events WHERE id = $1', [eventId])
    const event = eventRes.rows[0]
    if (!event) {
      throw new Error('Event not found.')
    }

    const currentSettings = event.settings && typeof event.settings === 'object' ? event.settings : {}
    // Merge, skipping keys the caller omitted. Assigning `undefined` used to
    // drop the key on JSON.stringify, silently erasing existing settings on any
    // partial update.
    const nextSettings: Record<string, any> = { ...currentSettings }
    const assignIfDefined = (key: string, value: any) => {
      if (value !== undefined) nextSettings[key] = value
    }
    assignIfDefined('location', input.location)
    assignIfDefined('allow_guest_uploads', input.allowGuestUploads)
    assignIfDefined('auto_approve_guest_uploads', input.autoApproveGuestUploads)
    assignIfDefined('require_guest_face_enrollment', input.requireGuestFaceEnrollment)

    let nextCoverImageUrl = event.cover_image_url
    if (input.coverPhotoId) {
      const photoRes = await query(
        'SELECT thumbnail_url, blob_url FROM public.photos WHERE id = $1 AND event_id = $2',
        [input.coverPhotoId, eventId]
      )
      const coverPhoto = photoRes.rows[0]
      if (!coverPhoto) {
        throw new Error('Selected event art photo was not found.')
      }
      nextCoverImageUrl = coverPhoto.thumbnail_url || coverPhoto.blob_url || null
    }

    // COALESCE keeps the stored value when a field is omitted from the payload,
    // rather than nulling out the title/date of an existing event.
    const updateRes = await query(
      `UPDATE public.events
       SET title = COALESCE($1, title),
           description = $2,
           event_date = $3,
           status = COALESCE($4, status),
           cover_image_url = $5,
           settings = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, title, description, event_date, status, cover_image_url, settings, updated_at`,
      [
        input.title ?? null,
        input.description ?? null,
        input.eventDate || null,
        input.status ?? null,
        nextCoverImageUrl,
        JSON.stringify(nextSettings),
        eventId
      ]
    )

    return updateRes.rows[0]
  },

  /**
   * Guest joins an event using invite_code or collaborator_invite_code
   */
  async joinEvent(inviteCode: string, userId: string): Promise<any> {
    const normalizedCode = inviteCode.toUpperCase().trim()

    // 1. Try guest invite code
    let eventRes = await query(
      'SELECT id, title, host_id, status FROM public.events WHERE invite_code = $1',
      [normalizedCode]
    )
    let event = eventRes.rows[0]
    let role: 'guest' | 'collaborator' = 'guest'

    // 2. Try collaborator invite code
    if (!event) {
      eventRes = await query(
        'SELECT id, title, host_id, status FROM public.events WHERE collaborator_invite_code = $1',
        [normalizedCode]
      )
      event = eventRes.rows[0]

      if (!event) {
        // Fallback: settings check
        eventRes = await query(
          "SELECT id, title, host_id, status FROM public.events WHERE settings->>'collaborator_invite_code' = $1",
          [normalizedCode]
        )
        event = eventRes.rows[0]
      }
      role = 'collaborator'
    }

    if (!event) {
      throw new Error('Invalid invite code. Please check and try again.')
    }

    // Cannot join your own event
    if (event.host_id === userId) {
      return { alreadyHost: true, eventId: event.id }
    }

    // Check if already a guest
    const guestRes = await query(
      'SELECT id, role, face_enrolled FROM public.event_guests WHERE event_id = $1 AND user_id = $2',
      [event.id, userId]
    )
    const existingGuest = guestRes.rows[0]

    if (existingGuest) {
      if (existingGuest.role === 'guest' && role === 'collaborator') {
        await query(
          "UPDATE public.event_guests SET role = 'collaborator' WHERE id = $1",
          [existingGuest.id]
        )
        return {
          eventId: event.id,
          guestId: existingGuest.id,
          alreadyJoined: false,
          faceEnrolled: existingGuest.face_enrolled ?? false,
          role: 'collaborator'
        }
      }
      return {
        eventId: event.id,
        guestId: existingGuest.id,
        alreadyJoined: true,
        faceEnrolled: existingGuest.face_enrolled ?? false,
        role: existingGuest.role
      }
    }

    // Join. ON CONFLICT closes the read-then-insert race: two concurrent joins
    // (a double-tapped invite link) previously raced past the existence check
    // and the second one failed on the unique constraint.
    const insertRes = await query(
      `INSERT INTO public.event_guests (event_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET role = event_guests.role
       RETURNING id`,
      [event.id, userId, role]
    )
    const newGuest = insertRes.rows[0]

    return {
      eventId: event.id,
      guestId: newGuest.id,
      alreadyJoined: false,
      faceEnrolled: false,
      role
    }
  },

  /**
   * Public lookup by invite code
   */
  async getEventByInviteCode(code: string): Promise<any> {
    const normalizedCode = code.toUpperCase().trim()

    let eventRes = await query(
      `SELECT e.id, e.host_id, e.title, e.description, e.event_date, e.cover_image_url, e.settings, e.status, e.invite_code, e.collaborator_invite_code,
              p.full_name as host_name, p.avatar_url as host_avatar,
              (SELECT COALESCE(ph.thumbnail_url, ph.blob_url) FROM public.photos ph WHERE ph.event_id = e.id ORDER BY ph.created_at DESC LIMIT 1) as latest_photo_url
       FROM public.events e
       LEFT JOIN public.profiles p ON e.host_id = p.id
       WHERE e.invite_code = $1`,
      [normalizedCode]
    )
    let event = eventRes.rows[0]
    let codeType: 'guest' | 'collaborator' = 'guest'

    if (!event) {
      eventRes = await query(
        `SELECT e.id, e.host_id, e.title, e.description, e.event_date, e.cover_image_url, e.settings, e.status, e.invite_code, e.collaborator_invite_code,
                p.full_name as host_name, p.avatar_url as host_avatar,
                (SELECT COALESCE(ph.thumbnail_url, ph.blob_url) FROM public.photos ph WHERE ph.event_id = e.id ORDER BY ph.created_at DESC LIMIT 1) as latest_photo_url
         FROM public.events e
         LEFT JOIN public.profiles p ON e.host_id = p.id
         WHERE e.collaborator_invite_code = $1`,
        [normalizedCode]
      )
      event = eventRes.rows[0]

      if (!event) {
        eventRes = await query(
          `SELECT e.id, e.host_id, e.title, e.description, e.event_date, e.cover_image_url, e.settings, e.status, e.invite_code, e.collaborator_invite_code,
                  p.full_name as host_name, p.avatar_url as host_avatar,
                  (SELECT COALESCE(ph.thumbnail_url, ph.blob_url) FROM public.photos ph WHERE ph.event_id = e.id ORDER BY ph.created_at DESC LIMIT 1) as latest_photo_url
           FROM public.events e
           LEFT JOIN public.profiles p ON e.host_id = p.id
           WHERE e.settings->>'collaborator_invite_code' = $1`,
          [normalizedCode]
        )
        event = eventRes.rows[0]
      }
      codeType = 'collaborator'
    }

    if (!event) return null
    return { ...event, codeType }
  },

  /**
   * Generates or regenerates a collaborator invite code. Owner only.
   */
  async generateCollaboratorCode(eventId: string, userId: string): Promise<string> {
    const isOwner = await this.assertOwner(eventId, userId)
    if (!isOwner) {
      throw new Error('Only the event owner can generate a collaborator code.')
    }

    const code = await generateUniqueCode('collaborator_invite_code', 'COL-')

    // Fetch current settings
    const eventRes = await query('SELECT settings FROM public.events WHERE id = $1', [eventId])
    const currentEvent = eventRes.rows[0]
    const settingsObj = currentEvent?.settings && typeof currentEvent.settings === 'object' ? currentEvent.settings : {}
    settingsObj.collaborator_invite_code = code

    await query(
      'UPDATE public.events SET collaborator_invite_code = $1, settings = $2, updated_at = NOW() WHERE id = $3',
      [code, JSON.stringify(settingsObj), eventId]
    )

    return code
  },

  /**
   * Removes a guest or collaborator from an event
   */
  async removeGuest(guestId: string, eventId: string, userId: string): Promise<void> {
    const isOwner = await this.assertOwner(eventId, userId)

    // Fetch target guest info. Scoping by event_id matters: without it a
    // collaborator on one event could remove a guest row belonging to another.
    const guestRes = await query(
      'SELECT user_id, role, face_reference_url, face_enrolled FROM public.event_guests WHERE id = $1 AND event_id = $2',
      [guestId, eventId]
    )
    const targetGuest = guestRes.rows[0]

    if (!targetGuest) {
      throw new Error('Guest not found.')
    }

    if (!isOwner) {
      const callerRes = await query(
        'SELECT role FROM public.event_guests WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      )
      const caller = callerRes.rows[0]

      if (caller?.role !== 'collaborator') {
        throw new Error('Not authorized.')
      }

      if (targetGuest.role === 'collaborator') {
        throw new Error('Only the event owner can remove collaborators.')
      }
    }

    // Delete
    await query('DELETE FROM public.event_guests WHERE id = $1 AND event_id = $2', [guestId, eventId])

    // Remove the enrolled face reference from storage as well, so a removed
    // guest does not leave their selfie behind in the bucket.
    if (targetGuest.face_reference_url) {
      await deleteStorageObjects([targetGuest.face_reference_url])
    }
  },

  async getMyHostedEvents(userId: string): Promise<any[]> {
    const res = await query(
      'SELECT id, title, event_date, status, cover_image_url, invite_code FROM public.events WHERE host_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return res.rows
  },

  async getEventsList(userId: string): Promise<any> {
    const hostedRes = await query(
      `SELECT e.id, e.title, e.event_date, e.status, e.settings, e.cover_image_url, e.invite_code,
              (SELECT COUNT(*)::int FROM public.photos p WHERE p.event_id = e.id) as photos_count,
              (SELECT COUNT(*)::int FROM public.event_guests eg WHERE eg.event_id = e.id) as guests_count,
              (SELECT COUNT(*)::int FROM public.albums a WHERE a.event_id = e.id) as albums_count,
              (SELECT COALESCE(p.thumbnail_url, p.blob_url) FROM public.photos p WHERE p.event_id = e.id ORDER BY p.created_at DESC LIMIT 1) as latest_photo_url
       FROM public.events e
       WHERE e.host_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    )

    const guestRes = await query(
      `SELECT eg.id as guest_id, eg.role, eg.face_enrolled,
              e.id, e.title, e.event_date, e.status, e.settings, e.cover_image_url,
              p.full_name as host_name,
              (SELECT COUNT(*)::int FROM public.photos ph WHERE ph.event_id = e.id) as photos_count,
              (SELECT COUNT(*)::int FROM public.event_guests eg2 WHERE eg2.event_id = e.id) as guests_count,
              (SELECT COUNT(*)::int FROM public.albums a WHERE a.event_id = e.id) as albums_count,
              (SELECT COALESCE(ph2.thumbnail_url, ph2.blob_url) FROM public.photos ph2 WHERE ph2.event_id = e.id ORDER BY ph2.created_at DESC LIMIT 1) as latest_photo_url
       FROM public.event_guests eg
       JOIN public.events e ON eg.event_id = e.id
       JOIN public.profiles p ON e.host_id = p.id
       WHERE eg.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    )

    return {
      hostedEvents: hostedRes.rows,
      guestEvents: guestRes.rows
    }
  },

  async getEventDetails(eventId: string, userId: string): Promise<any> {
    const roleInfo = await this.getUserEventRole(eventId, userId)

    const eventRes = await query(
      `SELECT e.*, p.full_name as host_name, p.avatar_url as host_avatar
       FROM public.events e
       LEFT JOIN public.profiles p ON e.host_id = p.id
       WHERE e.id = $1`,
      [eventId]
    )
    const event = eventRes.rows[0]
    if (!event) {
      throw new Error('Event not found.')
    }

    const isOwner = event.host_id === userId
    const isManager = isOwner || roleInfo.isCollaborator

    if (!isOwner && !roleInfo.role) {
      throw new Error('Not authorized to view this event.')
    }

    // Auto-generate invite code if owner and it's missing
    if (isOwner && (!event.invite_code || event.invite_code.trim() === '')) {
      const generated = await generateUniqueCode('invite_code')
      await query('UPDATE public.events SET invite_code = $1 WHERE id = $2', [generated, eventId])
      event.invite_code = generated
    }

    // Fetch guests
    const guestsRes = await query(
      `SELECT eg.id, eg.user_id, eg.role, eg.joined_at, eg.face_enrolled, eg.face_reference_url,
              p.full_name, p.email
       FROM public.event_guests eg
       JOIN public.profiles p ON eg.user_id = p.id
       WHERE eg.event_id = $1
       ORDER BY eg.joined_at ASC`,
      [eventId]
    )

    const mappedGuests = guestsRes.rows.map((g: any) => ({
      id: g.id,
      user_id: g.user_id,
      role: g.role,
      joined_at: g.joined_at,
      face_enrolled: g.face_enrolled,
      face_reference_url: g.face_reference_url,
      profiles: {
        full_name: g.full_name,
        email: g.email
      }
    }))

    // Fetch photos, albums and folders concurrently — they are independent, and
    // running them in sequence made this endpoint pay three full round-trips.
    // Photos are capped: an event with thousands of uploads previously
    // serialised every row (including the ai_analysis and face_embeddings JSON)
    // into a single response.
    const photosQuery = isManager
      ? query(
          `SELECT ${PHOTO_COLUMNS} FROM public.photos
           WHERE event_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [eventId, EVENT_PHOTO_LIMIT]
        )
      : query(
          `SELECT ${PHOTO_COLUMNS} FROM public.photos
           WHERE event_id = $1 AND (uploader_id = $2 OR (status = 'approved' AND is_shared = true))
           ORDER BY created_at DESC
           LIMIT $3`,
          [eventId, userId, EVENT_PHOTO_LIMIT]
        )

    const albumsQuery = isManager
      ? query(
          'SELECT * FROM public.albums WHERE event_id = $1 ORDER BY updated_at DESC NULLS LAST',
          [eventId]
        )
      : query(
          'SELECT * FROM public.albums WHERE event_id = $1 AND owner_id = $2 ORDER BY updated_at DESC NULLS LAST',
          [eventId, userId]
        )

    const [photosRes, albumsRes, foldersRes, photoCountRes] = await Promise.all([
      photosQuery,
      albumsQuery,
      query('SELECT * FROM public.folders WHERE event_id = $1 ORDER BY created_at ASC', [eventId]),
      query('SELECT COUNT(*)::int AS count FROM public.photos WHERE event_id = $1', [eventId])
    ])

    const totalPhotos = photoCountRes.rows[0]?.count ?? photosRes.rows.length

    return {
      event,
      roleInfo,
      guests: mappedGuests,
      photos: photosRes.rows,
      totalPhotos,
      photosTruncated: photosRes.rows.length >= EVENT_PHOTO_LIMIT,
      albums: albumsRes.rows,
      folders: foldersRes.rows
    }
  },

  async createEvent(input: { title: string; description?: string; eventDate?: string; settings?: any }, userId: string): Promise<any> {
    const insertRes = await query(
      `INSERT INTO public.events (host_id, title, description, event_date, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        input.title,
        input.description || null,
        input.eventDate || null,
        JSON.stringify(input.settings || {})
      ]
    )
    return insertRes.rows[0]
  },

  async getDashboardData(userId: string): Promise<any> {
    // 1. Fetch hosted events with counts
    const eventsRes = await query(
      `SELECT e.id, e.title, e.event_date, e.status, e.settings, e.cover_image_url,
              (SELECT COUNT(*)::int FROM public.photos p WHERE p.event_id = e.id) as photos_count,
              (SELECT COUNT(*)::int FROM public.event_guests eg WHERE eg.event_id = e.id) as guests_count,
              (SELECT COUNT(*)::int FROM public.albums a WHERE a.event_id = e.id) as albums_count,
              (SELECT COALESCE(p.thumbnail_url, p.blob_url) FROM public.photos p WHERE p.event_id = e.id ORDER BY p.created_at DESC LIMIT 1) as latest_photo_url
       FROM public.events e
       WHERE e.host_id = $1
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [userId]
    )

    // 2. Fetch joined events
    const guestEntriesRes = await query(
      `SELECT eg.id, eg.role, eg.face_enrolled,
              e.id as event_id, e.title as event_title, e.event_date, e.cover_image_url, e.status,
              p.full_name as host_name,
              (SELECT COALESCE(ph.thumbnail_url, ph.blob_url) FROM public.photos ph WHERE ph.event_id = e.id ORDER BY ph.created_at DESC LIMIT 1) as latest_photo_url
       FROM public.event_guests eg
       JOIN public.events e ON eg.event_id = e.id
       JOIN public.profiles p ON e.host_id = p.id
       WHERE eg.user_id = $1
       ORDER BY eg.created_at DESC
       LIMIT 5`,
      [userId]
    )

    // 3. Fetch albums
    const albumsRes = await query(
      `SELECT a.id, a.title, a.status, a.is_published, a.updated_at,
              e.title as event_title
       FROM public.albums a
       LEFT JOIN public.events e ON a.event_id = e.id
       WHERE a.owner_id = $1
       ORDER BY a.updated_at DESC
       LIMIT 5`,
      [userId]
    )

    // 4. Fetch recent orders
    const ordersRes = await query(
      `SELECT o.*, a.title as album_title
       FROM public.orders o
       JOIN public.albums a ON o.album_id = a.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 3`,
      [userId]
    )

    return {
      events: eventsRes.rows,
      guestEntries: guestEntriesRes.rows,
      albums: albumsRes.rows,
      orders: ordersRes.rows
    }
  },

  /**
   * Deletes an entire event. Owner only.
   */
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const isOwner = await this.assertOwner(eventId, userId)
    if (!isOwner) {
      throw new Error('Only the event owner can delete this event.')
    }

    // Delete event (cascades will delete guest registries, photos, and albums in PostgreSQL)
    await query('DELETE FROM public.events WHERE id = $1', [eventId])
  },

  /**
   * Promotes or demotes guest roles (owner only)
   */
  async updateGuestRole(eventId: string, guestId: string, role: 'guest' | 'collaborator', userId: string): Promise<any> {
    const isOwner = await this.assertOwner(eventId, userId)
    if (!isOwner) {
      throw new Error('Only the event owner can modify guest roles.')
    }
    const updateRes = await query(
      'UPDATE public.event_guests SET role = $1 WHERE id = $2 AND event_id = $3 RETURNING *',
      [role, guestId, eventId]
    )
    if (updateRes.rowCount === 0) {
      throw new Error('Guest not found for this event.')
    }
    return updateRes.rows[0]
  },

  /**
   * Creates a folder in the event structure (managers only)
   */
  async createFolder(eventId: string, parentId: string | null, name: string, userId: string): Promise<any> {
    const isManager = await this.assertManager(eventId, userId)
    if (!isManager) {
      throw new Error('Not authorized to create folders in this event.')
    }
    const insertRes = await query(
      'INSERT INTO public.folders (event_id, parent_id, name) VALUES ($1, $2, $3) RETURNING *',
      [eventId, parentId || null, name]
    )
    return insertRes.rows[0]
  },

  /**
   * Lists folders in the event (all participants)
   */
  async getEventFolders(eventId: string, userId: string): Promise<any[]> {
    const roleInfo = await this.getUserEventRole(eventId, userId)
    if (!roleInfo.role && !roleInfo.isOwner) {
      throw new Error('Not authorized to view folders in this event.')
    }
    const res = await query(
      'SELECT * FROM public.folders WHERE event_id = $1 ORDER BY created_at ASC',
      [eventId]
    )
    return res.rows
  },

  /**
   * Deletes a folder (managers only)
   */
  async deleteFolder(folderId: string, eventId: string, userId: string): Promise<void> {
    const isManager = await this.assertManager(eventId, userId)
    if (!isManager) {
      throw new Error('Not authorized to delete folders in this event.')
    }
    await query('DELETE FROM public.folders WHERE id = $1 AND event_id = $2', [folderId, eventId])
  }
}
