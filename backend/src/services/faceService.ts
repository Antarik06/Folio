import { query } from '../db'
import { eventService } from './eventService'
import { HttpError } from '../utils/httpError'

/** Length of a face-api / FaceNet embedding. */
const DESCRIPTOR_LENGTH = 128

/**
 * Euclidean distance below which two embeddings are considered the same person.
 * 0.6 is the classic FaceNet threshold; event galleries are the wrong place to
 * be permissive (a false positive shows a guest someone else's photos), so this
 * sits deliberately tighter.
 */
export const MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.5)

/** Cap per photo so one pathological detection payload cannot flood the table. */
const MAX_FACES_PER_PHOTO = 50

export interface DetectedFace {
  descriptor: number[]
  box?: { x: number; y: number; width: number; height: number }
  score?: number
}

/**
 * Validates an embedding coming off the wire. Descriptors are computed in the
 * browser, so nothing about their shape can be assumed.
 */
export function normalizeDescriptor(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== DESCRIPTOR_LENGTH) {
    return null
  }
  const out: number[] = new Array(DESCRIPTOR_LENGTH)
  for (let i = 0; i < DESCRIPTOR_LENGTH; i++) {
    const n = Number(value[i])
    // A descriptor component outside this range is not something the model can
    // produce; reject rather than store a value that would poison distances.
    if (!Number.isFinite(n) || n < -10 || n > 10) return null
    out[i] = n
  }
  return out
}

/** Squared euclidean distance — avoids a sqrt in the inner matching loop. */
function squaredDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < DESCRIPTOR_LENGTH; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return sum
}

export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(squaredDistance(a, b))
}

/**
 * Postgres returns DOUBLE PRECISION[] as a JS array already, but a row written
 * before this migration (or by hand) may hold anything.
 */
function readStoredDescriptor(value: unknown): number[] | null {
  if (Array.isArray(value)) return normalizeDescriptor(value)
  if (typeof value === 'string') {
    try {
      return normalizeDescriptor(JSON.parse(value.replace(/^{/, '[').replace(/}$/, ']')))
    } catch {
      return null
    }
  }
  return null
}

/**
 * Replaces this user's matches for the given photo ids with freshly computed
 * ones. Written as delete-then-insert inside a single statement pair so a
 * re-scan cannot leave stale matches behind.
 */
async function writeMatches(
  eventId: string,
  rows: Array<{ photoId: string; userId: string; distance: number }>,
  scope: { photoIds?: string[]; userId?: string }
): Promise<void> {
  if (scope.photoIds && scope.photoIds.length > 0) {
    if (scope.userId) {
      await query(
        'DELETE FROM public.photo_face_matches WHERE photo_id = ANY($1::uuid[]) AND user_id = $2',
        [scope.photoIds, scope.userId]
      )
    } else {
      await query('DELETE FROM public.photo_face_matches WHERE photo_id = ANY($1::uuid[])', [
        scope.photoIds
      ])
    }
  } else if (scope.userId) {
    await query('DELETE FROM public.photo_face_matches WHERE event_id = $1 AND user_id = $2', [
      eventId,
      scope.userId
    ])
  }

  if (rows.length === 0) return

  // One multi-row INSERT rather than a query per match: a busy event can
  // produce thousands of pairs and a round-trip each would dominate the cost.
  const values: any[] = []
  const tuples = rows.map((row, i) => {
    const base = i * 4
    values.push(row.photoId, row.userId, eventId, row.distance)
    return `($${base + 1}::uuid, $${base + 2}::uuid, $${base + 3}::uuid, $${base + 4})`
  })

  await query(
    `INSERT INTO public.photo_face_matches (photo_id, user_id, event_id, distance)
     VALUES ${tuples.join(', ')}
     ON CONFLICT (photo_id, user_id) DO UPDATE SET distance = EXCLUDED.distance`,
    values
  )
}

export const faceService = {
  MATCH_THRESHOLD,

  /**
   * Stores a guest's selfie embedding and immediately matches it against every
   * face already indexed for the event, so the personal gallery is populated by
   * the time the redirect lands.
   */
  async enrollFace(
    eventId: string,
    userId: string,
    selfieUrl: string,
    descriptor: number[]
  ): Promise<{ matched: number; preview: { id: string; url: string }[] }> {
    const updateRes = await query(
      `UPDATE public.event_guests
       SET face_reference_url = $1,
           face_descriptor = $2::double precision[],
           face_enrolled = TRUE,
           face_enrolled_at = NOW()
       WHERE event_id = $3 AND user_id = $4`,
      [selfieUrl, descriptor, eventId, userId]
    )

    if (updateRes.rowCount === 0) {
      // Enrollment requires an existing membership (or being the host);
      // otherwise a user could enroll into — and read faces from — a private
      // event they were never invited to.
      const hostRes = await query('SELECT 1 FROM public.events WHERE id = $1 AND host_id = $2', [
        eventId,
        userId
      ])
      if (hostRes.rowCount === 0) {
        throw new HttpError(403, 'Join this event with an invite code before enrolling your face.')
      }
      return { matched: 0, preview: [] }
    }

    const photoIds = await this.matchGuestAgainstEvent(eventId, userId, descriptor)

    // The join flow reveals the first few frames straight away, so fetch their
    // URLs here rather than making the client round-trip for them.
    let preview: { id: string; url: string }[] = []
    if (photoIds.length > 0) {
      const previewRes = await query(
        `SELECT id, COALESCE(thumbnail_url, blob_url) AS url
           FROM public.photos
          WHERE id = ANY($1::uuid[])
          ORDER BY COALESCE(taken_at, created_at) DESC
          LIMIT 3`,
        [photoIds]
      )
      preview = previewRes.rows
    }

    return { matched: photoIds.length, preview }
  },

  /**
   * Scores one guest against every indexed face in the event.
   * Runs on enrollment and on re-enrollment.
   */
  async matchGuestAgainstEvent(
    eventId: string,
    userId: string,
    descriptor: number[]
  ): Promise<string[]> {
    const facesRes = await query(
      'SELECT photo_id, descriptor FROM public.photo_faces WHERE event_id = $1',
      [eventId]
    )

    // Best (smallest) distance per photo — a photo counts as a match once, no
    // matter how many faces in it resemble the guest.
    const best = new Map<string, number>()
    for (const row of facesRes.rows) {
      const stored = readStoredDescriptor(row.descriptor)
      if (!stored) continue
      const distance = euclideanDistance(descriptor, stored)
      if (distance > MATCH_THRESHOLD) continue
      const current = best.get(row.photo_id)
      if (current === undefined || distance < current) {
        best.set(row.photo_id, distance)
      }
    }

    // Closest first, so a preview shows the most confident matches.
    const ranked = Array.from(best.entries()).sort((a, b) => a[1] - b[1])
    const rows = ranked.map(([photoId, distance]) => ({ photoId, userId, distance }))

    await writeMatches(eventId, rows, { userId })
    return rows.map((row) => row.photoId)
  },

  /**
   * Persists the faces detected in one photo and matches them against every
   * enrolled guest of the event.
   */
  async registerPhotoFaces(
    photoId: string,
    userId: string,
    faces: DetectedFace[]
  ): Promise<{ faceCount: number; matched: number }> {
    const photoRes = await query(
      'SELECT id, event_id, uploader_id FROM public.photos WHERE id = $1',
      [photoId]
    )
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new HttpError(404, 'Photo not found.')
    }

    // Only the uploader or an event manager may attach embeddings; otherwise any
    // guest could inject descriptors and steer whose gallery a photo lands in.
    const isUploader = photo.uploader_id === userId
    const isManager = isUploader ? true : await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new HttpError(403, 'Not authorized to index this photo.')
    }

    const valid: DetectedFace[] = []
    for (const face of faces.slice(0, MAX_FACES_PER_PHOTO)) {
      const descriptor = normalizeDescriptor(face?.descriptor)
      if (!descriptor) continue
      valid.push({ descriptor, box: face.box, score: face.score })
    }

    await query('DELETE FROM public.photo_faces WHERE photo_id = $1', [photoId])

    if (valid.length > 0) {
      const values: any[] = []
      const tuples = valid.map((face, i) => {
        const base = i * 5
        values.push(
          photoId,
          photo.event_id,
          face.descriptor,
          face.box ? JSON.stringify(face.box) : null,
          typeof face.score === 'number' && Number.isFinite(face.score) ? face.score : null
        )
        return `($${base + 1}::uuid, $${base + 2}::uuid, $${base + 3}::double precision[], $${base + 4}::jsonb, $${base + 5})`
      })

      await query(
        `INSERT INTO public.photo_faces (photo_id, event_id, descriptor, box, detection_score)
         VALUES ${tuples.join(', ')}`,
        values
      )
    }

    await query(
      `UPDATE public.photos
       SET face_scan_status = 'done', face_count = $2, face_scanned_at = NOW()
       WHERE id = $1`,
      [photoId, valid.length]
    )

    const matched = await this.matchPhotoAgainstGuests(photo.event_id, photoId, valid)
    return { faceCount: valid.length, matched }
  },

  /**
   * Scores one photo's faces against every enrolled guest of the event.
   */
  async matchPhotoAgainstGuests(
    eventId: string,
    photoId: string,
    faces: DetectedFace[]
  ): Promise<number> {
    if (faces.length === 0) {
      await writeMatches(eventId, [], { photoIds: [photoId] })
      return 0
    }

    const guestsRes = await query(
      `SELECT user_id, face_descriptor
       FROM public.event_guests
       WHERE event_id = $1 AND face_enrolled = TRUE AND face_descriptor IS NOT NULL`,
      [eventId]
    )

    const best = new Map<string, number>()
    for (const guest of guestsRes.rows) {
      const stored = readStoredDescriptor(guest.face_descriptor)
      if (!stored) continue
      for (const face of faces) {
        const distance = euclideanDistance(face.descriptor, stored)
        if (distance > MATCH_THRESHOLD) continue
        const current = best.get(guest.user_id)
        if (current === undefined || distance < current) {
          best.set(guest.user_id, distance)
        }
      }
    }

    const rows = Array.from(best.entries()).map(([userId, distance]) => ({
      photoId,
      userId,
      distance
    }))

    await writeMatches(eventId, rows, { photoIds: [photoId] })
    return rows.length
  },

  /**
   * Marks a photo as impossible to index (decode failure, unsupported format)
   * so the host's remaining-work queue does not offer it forever.
   */
  async markScanFailed(photoId: string, userId: string, reason: 'failed' | 'unsupported'): Promise<void> {
    const photoRes = await query(
      'SELECT event_id, uploader_id FROM public.photos WHERE id = $1',
      [photoId]
    )
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new HttpError(404, 'Photo not found.')
    }

    const isUploader = photo.uploader_id === userId
    const isManager = isUploader ? true : await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new HttpError(403, 'Not authorized to index this photo.')
    }

    await query(
      'UPDATE public.photos SET face_scan_status = $2, face_scanned_at = NOW() WHERE id = $1',
      [photoId, reason]
    )
  },

  /**
   * Photos in an event that have never been face-indexed. Feeds the host's
   * "index remaining photos" action, which covers Google Drive imports and any
   * photo uploaded before this engine existed.
   */
  async getScanQueue(
    eventId: string,
    userId: string,
    limit = 25
  ): Promise<{ photos: any[]; pending: number; total: number }> {
    const isManager = await eventService.assertManager(eventId, userId)
    if (!isManager) {
      throw new HttpError(403, 'Only event hosts and collaborators can index photos.')
    }

    const safeLimit = Math.min(Math.max(1, limit), 100)

    const [pendingRes, countsRes] = await Promise.all([
      query(
        `SELECT id, blob_url, thumbnail_url, original_filename
         FROM public.photos
         WHERE event_id = $1 AND face_scan_status = 'pending'
         ORDER BY created_at ASC
         LIMIT $2`,
        [eventId, safeLimit]
      ),
      query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE face_scan_status = 'pending')::int AS pending
         FROM public.photos
         WHERE event_id = $1`,
        [eventId]
      )
    ])

    return {
      photos: pendingRes.rows,
      pending: countsRes.rows[0]?.pending ?? 0,
      total: countsRes.rows[0]?.total ?? 0
    }
  },

  /**
   * Face-matching summary for an event, shown on the host dashboard.
   */
  async getEventFaceStats(eventId: string, userId: string): Promise<any> {
    const isManager = await eventService.assertManager(eventId, userId)
    if (!isManager) {
      throw new HttpError(403, 'Not authorized to view indexing status for this event.')
    }

    const statsRes = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM public.photos WHERE event_id = $1) AS total_photos,
         (SELECT COUNT(*)::int FROM public.photos WHERE event_id = $1 AND face_scan_status = 'pending') AS pending_photos,
         (SELECT COUNT(*)::int FROM public.photos WHERE event_id = $1 AND face_scan_status = 'done') AS indexed_photos,
         (SELECT COALESCE(SUM(face_count), 0)::int FROM public.photos WHERE event_id = $1) AS total_faces,
         (SELECT COUNT(*)::int FROM public.event_guests WHERE event_id = $1 AND face_enrolled = TRUE) AS enrolled_guests,
         (SELECT COUNT(*)::int FROM public.photo_face_matches WHERE event_id = $1) AS total_matches`,
      [eventId]
    )

    return statsRes.rows[0]
  }
}
