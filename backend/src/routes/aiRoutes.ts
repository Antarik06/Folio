import { Router } from 'express'
import { aiController } from '../controllers/aiController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// Public search route for stocks assets
router.get('/elements/search', aiController.searchGraphics)

// Public/proxied Gemini assistant (open, but can be protected if desired)
router.post('/assistant', aiController.geminiAssistant)

// Private face enroll (requires active JWT)
router.post('/events/:eventId/enroll-face', authMiddleware, aiController.enrollFace)

export default router
