import { Response } from 'express'
import { sendError } from '../utils/httpError'
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
      sendError(res, error)
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
        folderId
      } = req.body

      if (!eventId || !blobUrl) {
        return res.status(400).json({ error: 'Event ID and Blob URL are required.' })
      }

      // `status` and `isHostPhoto` are deliberately not read from the body:
      // moderation state is decided server-side from the uploader's role and
      // the event's auto-approval setting.
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
        folderId
      })

      res.status(201).json({ success: true, photo })
    } catch (error: any) {
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
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
      sendError(res, error)
    }
  },

  /**
   * GET /api/photos/proxy-google-drive
   */
  async proxyGoogleDrive(req: AuthenticatedRequest, res: Response) {
    try {
      const fileId = (req.query.fileId as string) || (req.body?.fileId as string)
      // Prefer the header: an OAuth token in the query string ends up in access
      // logs, browser history and any Referer sent onward. The query parameter
      // is still accepted so older clients keep working.
      const headerToken = req.headers['x-google-token']
      const token =
        (typeof headerToken === 'string' ? headerToken : undefined) ||
        (req.body?.token as string) ||
        (req.query.token as string)

      if (!fileId || !token) {
        return res.status(400).json({ error: 'fileId and a Google access token are required.' })
      }

      // Google Drive file ids are opaque but always URL-safe; reject anything
      // else so the id cannot alter the request path.
      if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) {
        return res.status(400).json({ error: 'Invalid Google Drive file id.' })
      }

      console.log(`[Proxy] Fetching Google Drive file: ${fileId}`)

      const googleResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text()
        console.error('[Proxy] Google Drive API error response:', googleResponse.status, errorText)
        return res.status(googleResponse.status).json({ error: `Google API returned status ${googleResponse.status}` })
      }

      const contentType = googleResponse.headers.get('content-type') || 'image/jpeg'
      res.setHeader('Content-Type', contentType)
      
      const arrayBuffer = await googleResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      res.send(buffer)
    } catch (error: any) {
      console.error('[Proxy] Google Drive proxy failed:', error)
      sendError(res, error)
    }
  }
}

