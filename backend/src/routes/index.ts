import { Router } from 'express'
import eventRoutes from './eventRoutes'
import photoRoutes from './photoRoutes'
import albumRoutes from './albumRoutes'
import orderRoutes from './orderRoutes'
import aiRoutes from './aiRoutes'
import profileRoutes from './profileRoutes'

const router = Router()

router.use('/events', eventRoutes)
router.use('/photos', photoRoutes)
router.use('/albums', albumRoutes)
router.use('/orders', orderRoutes)
router.use('/profile', profileRoutes)

// Map AI sub routes
router.use('/ai', aiRoutes)

// Map /api/elements/search directly for client compat
router.use('/', aiRoutes)

export default router
