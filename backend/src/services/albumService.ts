import { query } from '../db'
import { eventService } from './eventService'

export const albumService = {
  /**
   * Fetch an album by ID and verify read access (owner or event manager)
   */
  async getAlbum(albumId: string, userId: string): Promise<any> {
    const albumRes = await query('SELECT * FROM public.albums WHERE id = $1', [albumId])
    const album = albumRes.rows[0]
    if (!album) {
      throw new Error('Album not found.')
    }

    // Resolve cover photo URL if cover_photo_id is present
    if (album.cover_photo_id) {
      const photoRes = await query('SELECT thumbnail_url, blob_url FROM public.photos WHERE id = $1', [album.cover_photo_id])
      const photo = photoRes.rows[0]
      if (photo) {
        album.cover_photo_url = photo.thumbnail_url || photo.blob_url || null
      }
    }

    // Resolve event title if event_id is present
    if (album.event_id) {
      const eventRes = await query('SELECT title FROM public.events WHERE id = $1', [album.event_id])
      const event = eventRes.rows[0]
      if (event) {
        album.event_title = event.title
      }
    }

    if (album.owner_id === userId || album.is_published) {
      return album
    }

    const isManager = await eventService.assertManager(album.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized to view this album.')
    }

    return album
  },

  /**
   * Asserts if the user can modify the album (owner or event manager)
   */
  async assertManageableAlbum(albumId: string, userId: string): Promise<any> {
    const albumRes = await query('SELECT * FROM public.albums WHERE id = $1', [albumId])
    const album = albumRes.rows[0]
    if (!album) {
      throw new Error('Album not found.')
    }

    if (album.owner_id === userId) {
      return album
    }

    const isManager = await eventService.assertManager(album.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized to modify this album.')
    }

    return album
  },

  /**
   * Creates a new album (e.g. from a template)
   */
  async createAlbum(input: {
    eventId: string
    title: string
    templateId?: string
    layoutData?: any
    styleData?: any
  }, userId: string): Promise<any> {
    // Check if user is guest or manager in event
    const roleInfo = await eventService.getUserEventRole(input.eventId, userId)
    if (!roleInfo.role && !roleInfo.isOwner) {
      throw new Error('Not a participant of this event.')
    }

    const insertRes = await query(
      `INSERT INTO public.albums (event_id, owner_id, title, template_id, layout_data, style_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.eventId,
        userId,
        input.title,
        input.templateId || null,
        JSON.stringify(input.layoutData || {}),
        JSON.stringify(input.styleData || {})
      ]
    )

    return insertRes.rows[0]
  },

  /**
   * Updates the layout structure of an album (debounced autosave endpoint)
   */
  async updateAlbumLayout(albumId: string, layout: any, field: 'layout_data' | 'theme_config', userId: string): Promise<any> {
    const album = await this.assertManageableAlbum(albumId, userId)

    // Supports both 'layout_data' and 'theme_config' columns for backward compatibility
    const updateColumn = field === 'theme_config' ? 'theme_config' : 'layout_data'

    // First try update column
    try {
      const updateRes = await query(
        `UPDATE public.albums SET ${updateColumn} = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(layout), albumId]
      )
      return updateRes.rows[0]
    } catch (e: any) {
      // Fallback to alternate column if schema lacks one
      const fallbackColumn = updateColumn === 'layout_data' ? 'style_data' : 'layout_data' // standard fallback
      console.warn(`Failed layout save on ${updateColumn}, trying fallback.`, e.message)
      const updateRes = await query(
        `UPDATE public.albums SET ${fallbackColumn} = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(layout), albumId]
      )
      return updateRes.rows[0]
    }
  },

  /**
   * Renames an album
   */
  async renameAlbum(albumId: string, title: string, userId: string): Promise<any> {
    const album = await this.assertManageableAlbum(albumId, userId)
    const nextTitle = title.trim()
    if (!nextTitle) {
      throw new Error('Album name cannot be empty.')
    }

    const updateRes = await query(
      'UPDATE public.albums SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, cover_photo_id, updated_at',
      [nextTitle, albumId]
    )
    return updateRes.rows[0]
  },

  /**
   * Updates cover photo ID of an album
   */
  async updateAlbumCoverPhoto(albumId: string, coverPhotoId: string | null, userId: string): Promise<any> {
    const album = await this.assertManageableAlbum(albumId, userId)

    if (coverPhotoId) {
      const photoRes = await query('SELECT event_id FROM public.photos WHERE id = $1', [coverPhotoId])
      const photo = photoRes.rows[0]
      if (!photo || photo.event_id !== album.event_id) {
        throw new Error('Selected photo is not part of this event.')
      }
    }

    const updateRes = await query(
      'UPDATE public.albums SET cover_photo_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, cover_photo_id, updated_at',
      [coverPhotoId, albumId]
    )
    return updateRes.rows[0]
  },

  /**
   * Deletes an album
   */
  async deleteAlbum(albumId: string, userId: string): Promise<void> {
    await this.assertManageableAlbum(albumId, userId)
    await query('DELETE FROM public.albums WHERE id = $1', [albumId])
  },

  async listAlbums(userId: string): Promise<any[]> {
    const res = await query(
      'SELECT id, title, cover_image_url, created_at FROM public.albums WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return res.rows
  },

  /**
   * Decodes, verifies and fetches album details for public share access
   */
  async getSharedAlbumByToken(token: string): Promise<any> {
    const { verifyAlbumShareToken } = require('../utils/shareToken')
    const payload = verifyAlbumShareToken(token)
    if (!payload) {
      throw new Error('Invalid or expired share link.')
    }

    const albumRes = await query('SELECT * FROM public.albums WHERE id = $1', [payload.albumId])
    const album = albumRes.rows[0]
    if (!album) {
      throw new Error('Album not found.')
    }

    return {
      album,
      protections: payload.protections
    }
  },

  /**
   * Update album delivery instructions (managers only)
   */
  async updateDeliveryInstructions(albumId: string, instructions: string | null, userId: string): Promise<any> {
    const album = await this.assertManageableAlbum(albumId, userId)
    const updateRes = await query(
      'UPDATE public.albums SET delivery_instructions = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, delivery_instructions, updated_at',
      [instructions || null, albumId]
    )
    return updateRes.rows[0]
  },

  async updatePublishStatus(albumId: string, isPublished: boolean, userId: string): Promise<any> {
    const album = await this.assertManageableAlbum(albumId, userId)
    const updateRes = await query(
      'UPDATE public.albums SET is_published = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isPublished, albumId]
    )
    return updateRes.rows[0]
  },

  async listPublishedAlbums(): Promise<any[]> {
    const res = await query(
      `SELECT a.id, a.title, a.description, a.cover_photo_id, a.template_id, a.layout_data, a.style_data, a.is_published, a.created_at,
              p.thumbnail_url as cover_photo_url
       FROM public.albums a
       LEFT JOIN public.photos p ON a.cover_photo_id = p.id
       WHERE a.is_published = true
       ORDER BY a.created_at DESC`
    )
    return res.rows
  }
}
