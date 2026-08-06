import { Router } from 'express'
import { eventController } from '../controllers/eventController'
import { faceController } from '../controllers/faceController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// Public lookup route (no JWT check required to load simple invite properties)
router.get('/lookup', eventController.lookup)

// Protected routes (JWT verification required)
router.get('/dashboard', authMiddleware, eventController.getDashboard)
// Face indexing status + backlog for the host dashboard.
router.get('/:eventId/face-scan-queue', authMiddleware, faceController.getScanQueue)
router.get('/:eventId/face-stats', authMiddleware, faceController.getStats)
router.get('/', authMiddleware, eventController.getMyEvents)
router.post('/', authMiddleware, eventController.create)
router.post('/join', authMiddleware, eventController.join)
router.get('/:id/role', authMiddleware, eventController.getRole)
router.get('/:id', authMiddleware, eventController.getDetails)
router.put('/:id/settings', authMiddleware, eventController.updateSettings)
router.post('/:id/collaborator-code', authMiddleware, eventController.generateCollabCode)
router.patch('/:id/guests/:guestId/role', authMiddleware, eventController.updateGuestRole)
router.get('/:id/folders', authMiddleware, eventController.getFolders)
router.post('/:id/folders', authMiddleware, eventController.createFolder)
router.delete('/:id/folders/:folderId', authMiddleware, eventController.deleteFolder)
router.delete('/:id/guests/:guestId', authMiddleware, eventController.removeGuest)
router.delete('/:id', authMiddleware, eventController.deleteEvent)

export default router
