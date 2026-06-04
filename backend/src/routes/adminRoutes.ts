import { Router } from 'express'
import { adminController } from '../controllers/adminController'
import { settingsController } from '../controllers/settingsController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// Require auth middleware for all admin routes
router.use(authMiddleware)

router.get('/users', adminController.getAllUsers)
router.patch('/users/:userId/status', adminController.toggleUserBan)
router.get('/users/:userId/events', adminController.getUserEvents)
router.get('/events/:eventId/photos', adminController.getEventPhotos)
router.get('/events/:eventId/albums', adminController.getEventAlbums)
router.get('/orders', adminController.getAllOrders)
router.patch('/orders/:orderId/status', adminController.updateOrderStatus)
router.get('/artists', adminController.listArtists)
router.patch('/orders/:orderId/assign-artist', adminController.assignArtistToOrder)
router.patch('/premium/projects/:projectId/assign-artist', adminController.assignArtistToPremiumProject)

// Dynamic Settings and Promo code management
router.get('/settings', settingsController.getAdminSettings)
router.put('/settings', settingsController.updateAdminSettings)
router.get('/promo-codes', settingsController.getPromoCodes)
router.post('/promo-codes', settingsController.createPromoCode)
router.delete('/promo-codes/:code', settingsController.deletePromoCode)

export default router
