import { Response } from 'express'
import { sendError } from '../utils/httpError'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { libraryService } from '../services/libraryService'

export const libraryController = {
  /**
   * GET /api/library/photos
   *
   * The contact sheet behind the Photos tab: every frame the caller can see,
   * across every event they host or joined.
   */
  async getLibrary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const offset = req.query.offset ? Number(req.query.offset) : undefined

      const result = await libraryService.getLibrary(userId, { limit, offset })
      res.json(result)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/library/events
   *
   * The same frames grouped by occasion, with contributor provenance.
   */
  async getEventsOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const photosPerEvent = req.query.photosPerEvent
        ? Number(req.query.photosPerEvent)
        : undefined

      const events = await libraryService.getEventsOverview(userId, {
        limit,
        photosPerEvent,
      })
      res.json(events)
    } catch (error: any) {
      sendError(res, error)
    }
  },
}
