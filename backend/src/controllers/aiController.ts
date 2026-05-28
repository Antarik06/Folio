import { Response, Request } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { aiService } from '../services/aiService'

export const aiController = {
  /**
   * POST /api/ai/assistant
   */
  async geminiAssistant(req: Request, res: Response) {
    try {
      const { prompt, image, task } = req.body

      if (!prompt && !image) {
        return res.status(400).json({ error: 'Prompt or image is required.' })
      }

      const result = await aiService.askGemini(prompt, image, task)
      res.json({ result })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gemini API process failed' })
    }
  },

  /**
   * GET /api/elements/search
   */
  async searchGraphics(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || ''
      const page = Number(req.query.page) || 1
      const perPage = Number(req.query.perPage) || 24
      const category = (req.query.category as string) || 'all'
      const source = (req.query.source as 'pixabay' | 'pexels') || 'pixabay'

      const result = await aiService.searchGraphics(q, source, page, perPage, category)
      res.json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Stock elements lookup failed' })
    }
  },

  /**
   * POST /api/events/:eventId/enroll-face
   */
  async enrollFace(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.eventId
      const userId = req.user?.id
      const { selfieUrl } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      if (!selfieUrl) {
        return res.status(400).json({ error: 'Selfie URL is required.' })
      }

      await aiService.enrollFace(eventId, selfieUrl, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Face enrollment database update failed' })
    }
  }
}
