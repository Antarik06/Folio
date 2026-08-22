import { query } from '../db'
import { HttpError } from '../utils/httpError'
import { cardService } from './cardService'

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
  photos: any[]
  cards: any[]
  card_templates: Record<string, any>
  card_styles: Record<string, any>
}

/** One frame the owner promoted, or could. */
export interface ProfilePhoto {
  id: string
  url: string
  event_title: string | null
  taken_at: string | null
  on_profile: boolean
}

/**
 * What the first-run questionnaire collects.
 *
 * Every field is optional and every one maps onto `card_profiles.data`, which
 * is what the card engine renders from — so answering three questions and
 * skipping the rest still produces a card, just a quieter one.
 */
export interface OnboardingAnswers {
  name?: string
  handle?: string
  tagline?: string
  occupation?: string
  location?: string
  bio?: string
  quote?: string
  interests?: string[]
  photoUrl?: string
  templateId?: string
  styleId?: string
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
  async getOwnPage(
    userId: string
  ): Promise<ProfilePage & { draft_albums: any[]; onboarded_at: string | null }> {
    const profileRes = await query(
      `SELECT id, email, full_name, handle, bio, avatar_url, role, page_is_public,
              onboarded_at, created_at
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

    const photosRes = await query(
      `SELECT p.id,
              COALESCE(p.thumbnail_url, p.blob_url) AS url,
              p.taken_at,
              p.on_profile,
              e.title AS event_title
         FROM public.photos p
         LEFT JOIN public.events e ON p.event_id = e.id
        WHERE p.uploader_id = $1 AND p.on_profile = TRUE
        ORDER BY p.profile_promoted_at DESC`,
      [userId]
    )

    const cardBundle = await cardService.listCards(userId)

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
      onboarded_at: profile.onboarded_at,
      albums: albums.filter((a: any) => a.on_profile),
      draft_albums: albums.filter((a: any) => !a.on_profile),
      photos: photosRes.rows,
      cards: cardBundle.cards,
      card_templates: cardBundle.templates,
      card_styles: cardBundle.styles,
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
        LIMIT 48`,
      [profile.id]
    )

    const photosRes = await query(
      `SELECT p.id,
              COALESCE(p.thumbnail_url, p.blob_url) AS url,
              p.taken_at,
              e.title AS event_title
         FROM public.photos p
         LEFT JOIN public.events e ON p.event_id = e.id
        WHERE p.uploader_id = $1 AND p.on_profile = TRUE
        ORDER BY p.profile_promoted_at DESC
        LIMIT 60`,
      [profile.id]
    )

    const cardBundle = await cardService.listPublicCards(profile.id, 12)

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
      cards: cardBundle.cards,
      card_templates: cardBundle.templates,
      card_styles: cardBundle.styles,
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

}
