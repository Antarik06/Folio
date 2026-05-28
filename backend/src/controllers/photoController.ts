import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { photoService } from '../services/photoService'

export const photoController = {
  /**
   * GET /api/events/:eventId/photos
   */
  async getPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.eventId
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const photos = await photoService.getEventPhotos(eventId, userId)
      res.json(photos)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/photos
   */
  async registerPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const {
        eventId,
        blobUrl,
        blobPathname,
        thumbnailUrl,
        originalFilename,
        fileSize,
        width,
        height,
        isHostPhoto,
        status,
        folderId
      } = req.body

      if (!eventId || !blobUrl) {
        return res.status(400).json({ error: 'Event ID and Blob URL are required.' })
      }

      const photo = await photoService.registerPhoto({
        eventId,
        uploaderId: userId,
        blobUrl,
        blobPathname,
        thumbnailUrl,
        originalFilename,
        fileSize,
        width,
        height,
        isHostPhoto,
        status,
        folderId
      })

      res.status(201).json({ success: true, photo })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/photos/:id/shared
   */
  async toggleShared(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const isShared = await photoService.togglePhotoShared(photoId, userId)
      res.json({ success: true, isShared })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/events/:eventId/share-all
   */
  async shareAll(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.eventId
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await photoService.shareAllPhotos(eventId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/photos/:id/approve
   */
  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await photoService.approvePhoto(photoId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/photos/:id/reject
   */
  async reject(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await photoService.rejectPhoto(photoId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * DELETE /api/photos/:id
   */
  async deletePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await photoService.deletePhoto(photoId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/photos/:id/move
   */
  async movePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const { folderId } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const photo = await photoService.movePhoto(photoId, folderId || null, userId)
      res.json({ success: true, photo })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/photos/:id/tags
   */
  async updateTags(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const { peopleTags } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }
      if (!Array.isArray(peopleTags)) {
        return res.status(400).json({ error: 'peopleTags must be an array of strings.' })
      }

      const photo = await photoService.updatePhotoTags(photoId, peopleTags, userId)
      res.json({ success: true, photo })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/photos/:id/location
   */
  async updateLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const { location } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const photo = await photoService.updatePhotoLocation(photoId, location || null, userId)
      res.json({ success: true, photo })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
