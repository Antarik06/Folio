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
      // Look in public.templates instead
      const templateRes = await query('SELECT * FROM public.templates WHERE id = $1', [albumId])
      const template = templateRes.rows[0]
      if (!template) {
        throw new Error('Album not found.')
      }

      // Convert pages-format to spreads if no spreads exist
      let spreads = template.layout_schema?.spreads || []
      if (spreads.length === 0 && Array.isArray(template.layout_schema?.pages)) {
        spreads = helperConvertPagesToSpreads(template.layout_schema, template.page_previews_urls)
      }

      return {
        id: template.id,
        title: template.name,
        description: template.description,
        is_published: template.status === 'published',
        layout_data: {
          spreads: spreads,
          layout_schema: template.layout_schema || null,
          page_previews_urls: template.page_previews_urls || []
        },
        cover_photo_url: template.thumbnail_url,
        category: template.category,
        thumbnail_url: template.thumbnail_url,
        background_pdf_path: template.background_pdf_path,
        page_count: template.page_count,
        page_previews_urls: template.page_previews_urls || []
      }
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

    // Resolve template's page_previews_urls if linked to a template
    if (album.template_id) {
      const templateRes = await query('SELECT page_previews_urls FROM public.templates WHERE id = $1', [album.template_id])
      const template = templateRes.rows[0]
      if (template) {
        album.page_previews_urls = template.page_previews_urls || []
        if (album.layout_data && typeof album.layout_data === 'object') {
          album.layout_data.page_previews_urls = template.page_previews_urls || []
        }
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
    // Check if albumId is a template instead
    const templateRes = await query('SELECT * FROM public.templates WHERE id = $1', [albumId])
    const template = templateRes.rows[0]
    if (template) {
      if (template.artist_id !== userId) {
        throw new Error('Not authorized to modify this template.')
      }
      const updateRes = await query(
        `UPDATE public.templates SET layout_schema = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(layout), albumId]
      )
      return {
        ...updateRes.rows[0],
        layout_data: updateRes.rows[0].layout_schema
      }
    }

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
    const albumsRes = await query(
      `SELECT a.id, a.title, a.description, a.cover_photo_id, a.template_id, a.layout_data, a.style_data, a.is_published, a.created_at,
              p.thumbnail_url as cover_photo_url
       FROM public.albums a
       LEFT JOIN public.photos p ON a.cover_photo_id = p.id
       WHERE a.is_published = true
       ORDER BY a.created_at DESC`
    )

    const templatesRes = await query(
      `SELECT id, name as title, description, NULL as cover_photo_id, NULL as template_id, layout_schema as layout_data, '{}'::jsonb as style_data, TRUE as is_published, created_at,
              thumbnail_url as cover_photo_url, category, background_pdf_path, page_count, page_previews_urls
       FROM public.templates
       WHERE status = 'published'
       ORDER BY created_at DESC`
    )

    const mappedTemplates = templatesRes.rows.map((template: any) => {
      const layoutSchema = template.layout_data || {}
      let spreads = layoutSchema.spreads || []
      if (spreads.length === 0 && Array.isArray(layoutSchema.pages)) {
        spreads = helperConvertPagesToSpreads(layoutSchema, template.page_previews_urls)
      }
      return {
        ...template,
        layout_data: {
          spreads,
          layout_schema: layoutSchema,
          page_previews_urls: template.page_previews_urls || []
        }
      }
    })

    return [...albumsRes.rows, ...mappedTemplates]
  }
}

function helperConvertPagesToSpreads(layoutSchema: any, pagePreviewsUrls: any = []): any[] {
  const spreads: any[] = []
  if (!layoutSchema || !Array.isArray(layoutSchema.pages)) {
    return spreads
  }

  const pages = layoutSchema.pages
  const pageWidthMm = layoutSchema?.page_size?.width_mm || 210
  const pageHeightMm = layoutSchema?.page_size?.height_mm || 297
  const SPREAD_HEIGHT = 1000
  const aspectRatio = pageWidthMm / pageHeightMm
  const SPREAD_WIDTH = Math.round(SPREAD_HEIGHT * aspectRatio)
  const parsedPreviews = Array.isArray(pagePreviewsUrls) ? pagePreviewsUrls : []

  const mapSlotsToElements = (slots: any[] = [], pageNum: number) => {
    return slots.map((slot: any) => {
      const isText = slot.type === 'text'
      const slotWidthPx = (slot.width_mm / pageWidthMm) * SPREAD_WIDTH
      const slotHeightPx = (slot.height_mm / pageHeightMm) * SPREAD_HEIGHT
      const slotXPx = (slot.x_mm / pageWidthMm) * SPREAD_WIDTH
      const slotYPx = (slot.y_mm / pageHeightMm) * SPREAD_HEIGHT

      const baseElement: any = {
        id: slot.slot_id || `slot_${pageNum}_${Math.random().toString(36).substring(2, 7)}`,
        x: Math.round(slotXPx),
        y: Math.round(slotYPx),
        width: Math.round(slotWidthPx),
        height: Math.round(slotHeightPx),
        rotation: 0,
        zIndex: slot.z_index || 1,
        locked: !slot.editable_by_user
      }

      if (isText) {
        return {
          ...baseElement,
          type: 'text',
          name: slot.slot_id,
          text: slot.placeholder_text || 'Enter text...',
          fontSize: Math.round((slot.font_size_pt || 14) * 1.5),
          fontFamily: slot.font_family || 'serif',
          fontWeight: 'normal',
          textAlign: 'left',
          fill: '#1c1814'
        }
      } else {
        return {
          ...baseElement,
          type: 'image',
          name: slot.slot_id,
          src: '',
          fitMode: 'fill',
          crop: { x: 0, y: 0, width: 1, height: 1 }
        }
      }
    })
  }

  // Build cover spread from page 1
  const coverPage = pages.find((p: any) => p.page_number === 1) || { slots: [] }
  const coverElements = mapSlotsToElements(coverPage.slots, 1)

  if (parsedPreviews[0]) {
    coverElements.unshift({
      id: 'bg-image-1',
      type: 'image',
      name: 'Page Background',
      src: parsedPreviews[0],
      x: 0,
      y: 0,
      width: SPREAD_WIDTH,
      height: SPREAD_HEIGHT,
      zIndex: 0,
      rotation: 0,
      fitMode: 'fill',
      locked: true
    })
  }

  spreads.push({
    id: 'spread-cover',
    isCover: true,
    background: '#FAF9F6',
    elements: coverElements,
    front: { background: '#FAF9F6', elements: coverElements },
    back: { background: '#FFFFFF', elements: [] }
  })

  // Build inner spreads (pages 2-3, 4-5, etc.)
  let innerPageNum = 2
  while (innerPageNum <= pages.length) {
    const pageL = pages.find((p: any) => p.page_number === innerPageNum)
    const pageR = pages.find((p: any) => p.page_number === innerPageNum + 1)
    const elL = pageL ? mapSlotsToElements(pageL.slots, innerPageNum) : []
    const elR = pageR ? mapSlotsToElements(pageR.slots, innerPageNum + 1) : []

    const previewL = parsedPreviews[innerPageNum - 1]
    if (previewL) {
      elL.unshift({
        id: `bg-image-${innerPageNum}`,
        type: 'image',
        name: 'Page Background',
        src: previewL,
        x: 0,
        y: 0,
        width: SPREAD_WIDTH,
        height: SPREAD_HEIGHT,
        zIndex: 0,
        rotation: 0,
        fitMode: 'fill',
        locked: true
      })
    }

    const previewR = parsedPreviews[innerPageNum]
    if (previewR) {
      elR.unshift({
        id: `bg-image-${innerPageNum + 1}`,
        type: 'image',
        name: 'Page Background',
        src: previewR,
        x: 0,
        y: 0,
        width: SPREAD_WIDTH,
        height: SPREAD_HEIGHT,
        zIndex: 0,
        rotation: 0,
        fitMode: 'fill',
        locked: true
      })
    }

    spreads.push({
      id: `spread-${Math.floor(innerPageNum / 2)}`,
      isCover: false,
      background: '#FFFFFF',
      elements: elL,
      front: { background: '#FFFFFF', elements: elL },
      back: { background: '#FFFFFF', elements: elR }
    })
    innerPageNum += 2
  }

  return spreads
}
