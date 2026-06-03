import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { albumService } from '../services/albumService'
import { createAlbumShareToken } from '../utils/shareToken'
import { renameAlbumSchema, updateAlbumCoverSchema } from '../schema/zod'

const DEFAULT_EXPIRY_HOURS = 24 * 7

export const albumController = {
  /**
   * GET /api/albums
   */
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const albums = await albumService.listAlbums(userId)
      res.json(albums)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/albums/:id
   */
  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const album = await albumService.getAlbum(albumId, userId)
      res.json(album)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/albums
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const { eventId, title, templateId, layoutData, styleData } = req.body

      if (!eventId || !title) {
        return res.status(400).json({ error: 'Event ID and Title are required.' })
      }

      const album = await albumService.createAlbum({
        eventId,
        title,
        templateId,
        layoutData,
        styleData
      }, userId)

      res.status(201).json(album)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/albums/:id/layout
   */
  async updateLayout(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id
      const { layout, field } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      if (!layout) {
        return res.status(400).json({ error: 'Layout data is required.' })
      }

      const album = await albumService.updateAlbumLayout(albumId, layout, field || 'layout_data', userId)
      res.json({ success: true, album })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/albums/:id/rename
   */
  async rename(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const parsed = renameAlbumSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message })
      }

      const album = await albumService.renameAlbum(albumId, parsed.data.title, userId)
      res.json({ success: true, album })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/albums/:id/cover
   */
  async updateCover(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const parsed = updateAlbumCoverSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message })
      }

      const album = await albumService.updateAlbumCoverPhoto(albumId, parsed.data.coverPhotoId, userId)
      res.json({ success: true, album })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * DELETE /api/albums/:id
   */
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await albumService.deleteAlbum(albumId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/albums/:id/share-link
   */
  async shareLink(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id
      const { protections } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const album = await albumService.getAlbum(albumId, userId) // Asserts read access

      const tokenPayload = {
        albumId: album.id,
        exp: Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000,
        protections: {
          watermark: protections?.watermark ?? true,
          noRightClick: protections?.noRightClick ?? true,
          noDownload: protections?.noDownload ?? true,
        }
      }

      const token = createAlbumShareToken(tokenPayload)
      const path = `/album/share/${token}`
      const origin = req.headers.origin || 'http://localhost:3000'
      const shareUrl = `${origin}${path}`

      res.json({ shareUrl, expiresInHours: DEFAULT_EXPIRY_HOURS })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/albums/share/info/:token
   */
  async getSharedAlbum(req: any, res: Response) {
    try {
      const { token } = req.params
      const sharedData = await albumService.getSharedAlbumByToken(token)
      res.json(sharedData)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/albums/:id/delivery-instructions
   */
  async updateDeliveryInstructions(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const { deliveryInstructions } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const album = await albumService.updateDeliveryInstructions(albumId, deliveryInstructions || null, userId)
      res.json({ success: true, album })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/albums/:id/publish
   */
  async publish(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.id
      const userId = req.user?.id
      const { isPublished } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const album = await albumService.updatePublishStatus(albumId, !!isPublished, userId)
      res.json({ success: true, album })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/albums/published
   */
  async listPublished(req: any, res: Response) {
    try {
      const albums = await albumService.listPublishedAlbums()
      res.json(albums)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
