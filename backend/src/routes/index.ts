import { Router } from 'express'
import eventRoutes from './eventRoutes'
import photoRoutes from './photoRoutes'
import albumRoutes from './albumRoutes'
import orderRoutes from './orderRoutes'
import aiRoutes from './aiRoutes'
import profileRoutes from './profileRoutes'
import adminRoutes from './adminRoutes'
import { settingsController } from '../controllers/settingsController'

const router = Router()

router.use('/events', eventRoutes)
router.use('/photos', photoRoutes)
router.use('/albums', albumRoutes)
router.use('/orders', orderRoutes)
router.use('/profile', profileRoutes)
router.use('/admin', adminRoutes)

// Public System Settings & Promo Codes Validation
router.get('/settings', settingsController.getPublicSettings)
router.get('/promo-codes/validate', settingsController.validatePromoCode)

// Map AI sub routes
router.use('/ai', aiRoutes)

// Map /api/elements/search directly for client compat
router.use('/', aiRoutes)

export default router
