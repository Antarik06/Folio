import { Response } from 'express'
import { sendError } from '../utils/httpError'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { faceService, DetectedFace, normalizeDescriptor } from '../services/faceService'

/**
 * Embeddings are extracted in the browser (face-api.js / WebGL) and posted here.
 * Everything arriving in a request body is therefore untrusted input and is
 * shape-checked before it reaches the matcher.
 */
export const faceController = {
  /**
   * POST /api/photos/:id/faces
   * Body: { faces: [{ descriptor: number[128], box?, score? }] }
   */
  async registerPhotoFaces(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const rawFaces = req.body?.faces
      if (!Array.isArray(rawFaces)) {
        return res.status(400).json({ error: 'faces must be an array.' })
      }

      const faces: DetectedFace[] = []
      for (const raw of rawFaces) {
        const descriptor = normalizeDescriptor(raw?.descriptor)
        if (!descriptor) {
          return res.status(400).json({ error: 'Each face needs a 128-number descriptor.' })
        }
        faces.push({
          descriptor,
          box: raw?.box && typeof raw.box === 'object' ? raw.box : undefined,
          score: typeof raw?.score === 'number' ? raw.score : undefined
        })
      }

      const result = await faceService.registerPhotoFaces(photoId, userId, faces)
      res.json({ success: true, ...result })
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * POST /api/photos/:id/faces/failed
   * The browser could not decode this image; stop offering it in the queue.
   */
  async markScanFailed(req: AuthenticatedRequest, res: Response) {
    try {
      const photoId = req.params.id
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const reason = req.body?.reason === 'unsupported' ? 'unsupported' : 'failed'
      await faceService.markScanFailed(photoId, userId, reason)
      res.json({ success: true })
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/events/:eventId/face-scan-queue?limit=25
   */
  async getScanQueue(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.eventId
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const limit = Number(req.query.limit) || 25
      const result = await faceService.getScanQueue(eventId, userId, limit)
      res.json(result)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/events/:eventId/face-stats
   */
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.eventId
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const stats = await faceService.getEventFaceStats(eventId, userId)
      res.json(stats)
    } catch (error: any) {
      sendError(res, error)
    }
  }
}
