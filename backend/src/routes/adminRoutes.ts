import { Router } from 'express'
import { adminController } from '../controllers/adminController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// Require auth middleware for all admin routes
router.use(authMiddleware)

router.get('/users', adminController.getAllUsers)
router.get('/users/:userId/events', adminController.getUserEvents)
router.get('/events/:eventId/photos', adminController.getEventPhotos)
router.get('/events/:eventId/albums', adminController.getEventAlbums)
router.get('/orders', adminController.getAllOrders)
router.patch('/orders/:orderId/status', adminController.updateOrderStatus)

export default router
