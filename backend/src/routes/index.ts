import { Router } from 'express'
import eventRoutes from './eventRoutes'
import photoRoutes from './photoRoutes'
import albumRoutes from './albumRoutes'
import orderRoutes from './orderRoutes'
import aiRoutes from './aiRoutes'
import profileRoutes from './profileRoutes'
import adminRoutes from './adminRoutes'
import artistRoutes from './artistRoutes'
import premiumRoutes from './premiumRoutes'
import { settingsController } from '../controllers/settingsController'
import { aiController } from '../controllers/aiController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

router.use('/events', eventRoutes)
router.use('/photos', photoRoutes)
router.use('/albums', albumRoutes)
router.use('/orders', orderRoutes)
router.use('/profile', profileRoutes)
router.use('/admin', adminRoutes)
router.use('/artists', artistRoutes)
router.use('/premium', premiumRoutes)

// Public System Settings & Promo Codes Validation
router.get('/settings', settingsController.getPublicSettings)
router.get('/promo-codes/validate', settingsController.validatePromoCode)

// Map AI sub routes
router.use('/ai', aiRoutes)

// Legacy alias kept for older clients that call /api/elements/search directly.
// Mounting the whole aiRoutes router at '/' made every unmatched API request
// walk its stack, and exposed /api/assistant as a second, undocumented path.
router.get('/elements/search', authMiddleware, aiController.searchGraphics)

export default router
