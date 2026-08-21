import { query } from '../db'
import { HttpError } from '../utils/httpError'

/**
 * The Profile tab — the Share stage of the pipeline.
 *
 * Consent is the load-bearing idea here. Nothing reaches a public page by
 * default: the page itself is off until switched on, and each album is
 * promoted one at a time. A photo that a guest can merely *see* inside a
 * shared event never becomes public as a side effect of that sharing.
 */

const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/

export interface ProfilePage {
  id: string
  full_name: string | null
  handle: string | null
  bio: string | null
  avatar_url: string | null
  page_is_public: boolean
  member_since: string
  events_joined: number
  events_hosted: number
  albums: any[]
  cards: any[]
}

async function loadCounts(userId: string) {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM public.event_guests eg WHERE eg.user_id = $1) AS events_joined,
       (SELECT COUNT(*)::int FROM public.events e       WHERE e.host_id = $1) AS events_hosted`,
    [userId]
  )
  return {
    events_joined: res.rows[0]?.events_joined ?? 0,
    events_hosted: res.rows[0]?.events_hosted ?? 0,
  }
}

export const profileService = {
  /**
   * The signed-in user's own page, including unpromoted albums so they have
   * something to promote.
   */
  async getOwnPage(userId: string): Promise<ProfilePage & { draft_albums: any[] }> {
    const profileRes = await query(
      `SELECT id, email, full_name, handle, bio, avatar_url, role, page_is_public, created_at
         FROM public.profiles WHERE id = $1`,
      [userId]
    )
    const profile = profileRes.rows[0]
    if (!profile) {
      throw new HttpError(404, 'Profile not found.')
    }

    const albumsRes = await query(
      `SELECT a.id, a.title, a.on_profile, a.promoted_at, a.status, a.updated_at,
              e.title AS event_title,
              COALESCE(ph.thumbnail_url, ph.blob_url) AS cover_url
         FROM public.albums a
         LEFT JOIN public.events e  ON a.event_id = e.id
         LEFT JOIN public.photos ph ON a.cover_photo_id = ph.id
        WHERE a.owner_id = $1
        ORDER BY a.on_profile DESC, COALESCE(a.promoted_at, a.updated_at) DESC`,
      [userId]
    )

    const cardsRes = await query(
      `SELECT * FROM public.share_cards WHERE owner_id = $1 ORDER BY created_at DESC`,
      [userId]
    )

    const counts = await loadCounts(userId)
    const albums = albumsRes.rows

    return {
      id: profile.id,
      full_name: profile.full_name,
      handle: profile.handle,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      page_is_public: profile.page_is_public,
      member_since: profile.created_at,
      ...counts,
      albums: albums.filter((a: any) => a.on_profile),
      draft_albums: albums.filter((a: any) => !a.on_profile),
      cards: cardsRes.rows,
    }
  },

  /**
   * Someone else's page, by handle. Returns null rather than throwing when the
   * page is private or absent — a caller should not be able to tell those apart.
   */
  async getPublicPage(handle: string): Promise<ProfilePage | null> {
    if (!handle || !HANDLE_PATTERN.test(handle.toLowerCase())) return null

    const profileRes = await query(
      `SELECT id, full_name, handle, bio, avatar_url, page_is_public, created_at
         FROM public.profiles
        WHERE LOWER(handle) = LOWER($1) AND page_is_public = TRUE`,
      [handle]
    )
    const profile = profileRes.rows[0]
    if (!profile) return null

    const albumsRes = await query(
      `SELECT a.id, a.title, a.promoted_at,
              COALESCE(ph.thumbnail_url, ph.blob_url) AS cover_url
         FROM public.albums a
         LEFT JOIN public.photos ph ON a.cover_photo_id = ph.id
        WHERE a.owner_id = $1 AND a.on_profile = TRUE
        ORDER BY a.promoted_at DESC NULLS LAST
        LIMIT 24`,
      [profile.id]
    )

    const cardsRes = await query(
      `SELECT id, kind, headline, subline, occasion_date, photo_url, created_at
         FROM public.share_cards
        WHERE owner_id = $1 AND is_public = TRUE
        ORDER BY created_at DESC
        LIMIT 24`,
      [profile.id]
    )

    const counts = await loadCounts(profile.id)

    return {
      id: profile.id,
      full_name: profile.full_name,
      handle: profile.handle,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      page_is_public: profile.page_is_public,
      member_since: profile.created_at,
      ...counts,
      albums: albumsRes.rows,
      cards: cardsRes.rows,
    }
  },

  /**
   * Updates the page's own settings. Only these three fields — role, email and
   * ban status are not the owner's to change from here.
   */
  async updatePage(
    userId: string,
    input: { handle?: string | null; bio?: string | null; page_is_public?: boolean }
  ) {
    let handle: string | null | undefined = input.handle
    if (typeof handle === 'string') {
      handle = handle.trim().toLowerCase().replace(/^@/, '')
      if (handle === '') {
        handle = null
      } else if (!HANDLE_PATTERN.test(handle)) {
        throw new HttpError(
          400,
          'Handle must be 3–30 characters, lowercase letters, numbers or underscores.'
        )
      }
    }

    // A page cannot be published without an address people can reach it at.
    if (input.page_is_public === true) {
      const current = await query('SELECT handle FROM public.profiles WHERE id = $1', [userId])
      const effective = handle !== undefined ? handle : current.rows[0]?.handle
      if (!effective) {
        throw new HttpError(400, 'Pick a handle before making your page public.')
      }
    }

    try {
      const res = await query(
        `UPDATE public.profiles
            SET handle = COALESCE($2, CASE WHEN $3::boolean THEN NULL ELSE handle END),
                bio = COALESCE($4, bio),
                page_is_public = COALESCE($5, page_is_public),
                updated_at = NOW()
          WHERE id = $1
      RETURNING id, full_name, handle, bio, avatar_url, page_is_public`,
        [
          userId,
          handle ?? null,
          handle === null,
          input.bio ?? null,
          input.page_is_public ?? null,
        ]
      )
      if (res.rowCount === 0) throw new HttpError(404, 'Profile not found.')
      return res.rows[0]
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new HttpError(409, 'That handle is already taken.')
      }
      throw err
    }
  },

  /**
   * Promotes or withdraws one album from the public page. Owner only — this is
   * the per-item consent step, so it is deliberately not a bulk operation.
   */
  async setAlbumOnProfile(userId: string, albumId: string, onProfile: boolean) {
    const res = await query(
      `UPDATE public.albums
          SET on_profile = $3,
              promoted_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
              updated_at = NOW()
        WHERE id = $2 AND owner_id = $1
    RETURNING id, title, on_profile, promoted_at`,
      [userId, albumId, onProfile]
    )
    if (res.rowCount === 0) {
      throw new HttpError(404, 'Album not found, or you do not own it.')
    }
    return res.rows[0]
  },

  /* ── Cards ──────────────────────────────────────────────────────────────── */

  async listCards(userId: string) {
    const res = await query(
      'SELECT * FROM public.share_cards WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return res.rows
  },

  async createCard(
    userId: string,
    input: {
      kind?: 'occasion' | 'profile'
      headline: string
      subline?: string | null
      occasion_date?: string | null
      photo_id?: string | null
      photo_url?: string | null
      album_id?: string | null
      is_public?: boolean
    }
  ) {
    const headline = (input.headline ?? '').trim()
    if (!headline) {
      throw new HttpError(400, 'A card needs a headline.')
    }
    if (headline.length > 60) {
      throw new HttpError(400, 'Headline must be 60 characters or fewer.')
    }

    // A card may only centre a photo the owner can actually see.
    if (input.photo_id) {
      const allowed = await query(
        `SELECT 1
           FROM public.photos p
           JOIN public.events e ON p.event_id = e.id
          WHERE p.id = $2
            AND p.status = 'approved'
            AND (
              e.host_id = $1
              OR p.uploader_id = $1
              OR (p.is_shared = TRUE AND EXISTS (
                    SELECT 1 FROM public.event_guests eg
                     WHERE eg.event_id = e.id AND eg.user_id = $1))
            )`,
        [userId, input.photo_id]
      )
      if (allowed.rowCount === 0) {
        throw new HttpError(403, 'That photo is not yours to put on a card.')
      }
    }

    const res = await query(
      `INSERT INTO public.share_cards
         (owner_id, kind, headline, subline, occasion_date, photo_id, photo_url, album_id, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
      [
        userId,
        input.kind ?? 'occasion',
        headline,
        input.subline ?? null,
        input.occasion_date ?? null,
        input.photo_id ?? null,
        input.photo_url ?? null,
        input.album_id ?? null,
        input.is_public ?? false,
      ]
    )
    return res.rows[0]
  },

  async updateCard(
    userId: string,
    cardId: string,
    input: { headline?: string; subline?: string | null; is_public?: boolean }
  ) {
    if (typeof input.headline === 'string' && input.headline.trim().length === 0) {
      throw new HttpError(400, 'A card needs a headline.')
    }

    const res = await query(
      `UPDATE public.share_cards
          SET headline = COALESCE($3, headline),
              subline = COALESCE($4, subline),
              is_public = COALESCE($5, is_public),
              updated_at = NOW()
        WHERE id = $2 AND owner_id = $1
    RETURNING *`,
      [userId, cardId, input.headline?.trim() ?? null, input.subline ?? null, input.is_public ?? null]
    )
    if (res.rowCount === 0) {
      throw new HttpError(404, 'Card not found.')
    }
    return res.rows[0]
  },

  async deleteCard(userId: string, cardId: string) {
    const res = await query(
      'DELETE FROM public.share_cards WHERE id = $2 AND owner_id = $1',
      [userId, cardId]
    )
    if (res.rowCount === 0) {
      throw new HttpError(404, 'Card not found.')
    }
  },
}
