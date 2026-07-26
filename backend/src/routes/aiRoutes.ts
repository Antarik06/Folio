import { Router } from 'express'
import { aiController } from '../controllers/aiController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// These proxy calls to third-party APIs using this server's own keys, so they
// must not be open to the internet — an unauthenticated endpoint here is a
// direct billing and quota liability.
router.get('/elements/search', authMiddleware, aiController.searchGraphics)
router.post('/assistant', authMiddleware, aiController.geminiAssistant)

// Private face enroll (requires active JWT)
router.post('/events/:eventId/enroll-face', authMiddleware, aiController.enrollFace)

export default router
