import { query } from '../db'

/**
 * The Photos tab's data layer.
 *
 * Library and Events are two readings of one shelf, not two features: Library
 * is every frame the user can see in one unbroken contact sheet, Events is the
 * same frames grouped by the occasion they came from. Both read the same rows,
 * so they live in one service.
 *
 * Visibility rule, applied identically to both: a user can see a photo when
 * they host its event, or when they are a guest of that event and the photo is
 * either shared with guests or their own upload. Rejected and pending photos
 * are never in the library.
 */

const VISIBLE_TO_USER = `
  p.status = 'approved'
  AND (
    e.host_id = $1
    OR p.uploader_id = $1
    OR (
      p.is_shared = TRUE
      AND EXISTS (
        SELECT 1 FROM public.event_guests eg
        WHERE eg.event_id = e.id AND eg.user_id = $1
      )
    )
  )
`

export interface LibraryPhoto {
  id: string
  event_id: string
  event_title: string
  url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  taken_at: string | null
  location: string | null
  uploader_id: string
  uploader_name: string | null
}

export const libraryService = {
  /**
   * The contact sheet: every visible frame, newest capture first.
   *
   * Ordered by when the photo was *taken* where EXIF gave us that, falling
   * back to upload time — a contact sheet sorted by upload order would
   * scramble a day that several guests uploaded at different times.
   */
  async getLibrary(
    userId: string,
    { limit = 120, offset = 0 }: { limit?: number; offset?: number } = {}
  ): Promise<{ total: number; photos: LibraryPhoto[] }> {
    const safeLimit = Math.min(Math.max(Number(limit) || 120, 1), 500)
    const safeOffset = Math.max(Number(offset) || 0, 0)

    const countRes = await query(
      `SELECT COUNT(*)::int AS total
         FROM public.photos p
         JOIN public.events e ON p.event_id = e.id
        WHERE ${VISIBLE_TO_USER}`,
      [userId]
    )

    const photosRes = await query(
      `SELECT p.id,
              p.event_id,
              e.title              AS event_title,
              COALESCE(p.thumbnail_url, p.blob_url) AS url,
              p.thumbnail_url,
              p.width,
              p.height,
              p.taken_at,
              p.location,
              p.uploader_id,
              up.full_name         AS uploader_name
         FROM public.photos p
         JOIN public.events e   ON p.event_id = e.id
         LEFT JOIN public.profiles up ON p.uploader_id = up.id
        WHERE ${VISIBLE_TO_USER}
        ORDER BY COALESCE(p.taken_at, p.created_at) DESC
        LIMIT $2 OFFSET $3`,
      [userId, safeLimit, safeOffset]
    )

    return {
      total: countRes.rows[0]?.total ?? 0,
      photos: photosRes.rows as LibraryPhoto[],
    }
  },

  /**
   * The darkroom shelf: frames the caller saved out of the Photo Studio.
   *
   * A graded print is stored as an ordinary photo — the negative stays in the
   * library alongside it — so what marks one is where it was written:
   * `albums/studio/<user>/…`. Matching on the path keeps prints separable
   * without a column and a migration for a single boolean.
   *
   * Unlike the contact sheet this does not require approval: a print the
   * caller made is theirs to find, even where the event it came from holds
   * guest uploads for review.
   */
  async getStudioPrints(
    userId: string,
    { limit = 60 }: { limit?: number } = {}
  ): Promise<{ total: number; photos: LibraryPhoto[] }> {
    const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), 200)

    const countRes = await query(
      `SELECT COUNT(*)::int AS total
         FROM public.photos p
        WHERE p.uploader_id = $1
          AND p.status <> 'rejected'
          AND p.blob_pathname LIKE 'albums/studio/%'`,
      [userId]
    )

    const photosRes = await query(
      `SELECT p.id,
              p.event_id,
              e.title              AS event_title,
              COALESCE(p.thumbnail_url, p.blob_url) AS url,
              p.thumbnail_url,
              p.width,
              p.height,
              p.taken_at,
              p.created_at,
              p.location,
              p.uploader_id,
              up.full_name         AS uploader_name
         FROM public.photos p
         LEFT JOIN public.events e   ON p.event_id = e.id
         LEFT JOIN public.profiles up ON p.uploader_id = up.id
        WHERE p.uploader_id = $1
          AND p.status <> 'rejected'
          AND p.blob_pathname LIKE 'albums/studio/%'
        ORDER BY p.created_at DESC
        LIMIT $2`,
      [userId, safeLimit]
    )

    return {
      total: countRes.rows[0]?.total ?? 0,
      photos: photosRes.rows as LibraryPhoto[],
    }
  },

  /**
   * Events, each with the handful of recent frames and the contributor
   * initials the Photos tab stamps on them.
   *
   * `contributors` is who actually uploaded, not who was invited — the design
   * stamps initials on shared frames to show provenance, so an invited guest
   * who never uploaded should not appear.
   */
  async getEventsOverview(
    userId: string,
    { limit = 12, photosPerEvent = 12 }: { limit?: number; photosPerEvent?: number } = {}
  ): Promise<any[]> {
    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 24)
    const safePhotos = Math.min(Math.max(Number(photosPerEvent) || 12, 1), 40)

    const eventsRes = await query(
      `SELECT e.id,
              e.title,
              e.event_date,
              e.status,
              e.cover_image_url,
              e.host_id,
              (e.host_id = $1) AS is_host,
              (SELECT COUNT(*)::int FROM public.photos p
                WHERE p.event_id = e.id AND p.status = 'approved') AS photos_count,
              (SELECT COUNT(*)::int FROM public.event_guests eg
                WHERE eg.event_id = e.id) AS guests_count,
              (SELECT p.location FROM public.photos p
                WHERE p.event_id = e.id AND p.location IS NOT NULL
                ORDER BY p.created_at DESC LIMIT 1) AS location
         FROM public.events e
        WHERE e.host_id = $1
           OR EXISTS (
                SELECT 1 FROM public.event_guests eg
                 WHERE eg.event_id = e.id AND eg.user_id = $1
              )
        ORDER BY COALESCE(e.event_date, e.created_at) DESC
        LIMIT $2`,
      [userId, safeLimit]
    )

    const events = eventsRes.rows
    if (events.length === 0) return []

    const eventIds = events.map((e: any) => e.id)

    // One round trip for the frames of every event, sliced per event by a
    // window function rather than a query per row.
    const photosRes = await query(
      `SELECT * FROM (
         SELECT p.id,
                p.event_id,
                COALESCE(p.thumbnail_url, p.blob_url) AS url,
                p.width,
                p.height,
                p.taken_at,
                p.created_at,
                p.uploader_id,
                ROW_NUMBER() OVER (
                  PARTITION BY p.event_id
                  ORDER BY COALESCE(p.taken_at, p.created_at) DESC
                ) AS rn
           FROM public.photos p
           JOIN public.events e ON p.event_id = e.id
          WHERE p.event_id = ANY($2::uuid[])
            AND ${VISIBLE_TO_USER}
       ) ranked
       WHERE rn <= $3`,
      [userId, eventIds, safePhotos]
    )

    const contributorsRes = await query(
      `SELECT DISTINCT p.event_id, p.uploader_id AS id, pr.full_name AS name
         FROM public.photos p
         JOIN public.events e   ON p.event_id = e.id
         LEFT JOIN public.profiles pr ON p.uploader_id = pr.id
        WHERE p.event_id = ANY($2::uuid[])
          AND ${VISIBLE_TO_USER}`,
      [userId, eventIds]
    )

    const photosByEvent = new Map<string, any[]>()
    for (const row of photosRes.rows) {
      const list = photosByEvent.get(row.event_id) ?? []
      list.push(row)
      photosByEvent.set(row.event_id, list)
    }

    const contributorsByEvent = new Map<string, any[]>()
    for (const row of contributorsRes.rows) {
      const list = contributorsByEvent.get(row.event_id) ?? []
      list.push({ id: row.id, name: row.name })
      contributorsByEvent.set(row.event_id, list)
    }

    return events.map((event: any) => ({
      ...event,
      // Shared vs personal is a property, not a type: a space you host alone is
      // yours, and it becomes an Event the moment someone else is in it. That
      // keeps one underlying model instead of two parallel features, and means
      // inviting a guest needs no migration of the collection itself.
      kind:
        event.is_host && Number(event.guests_count) === 0 ? 'space' : 'event',
      photos: photosByEvent.get(event.id) ?? [],
      contributors: contributorsByEvent.get(event.id) ?? [],
    }))
  },
}
