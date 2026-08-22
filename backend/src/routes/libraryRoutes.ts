import { Router } from 'express'
import { libraryController } from '../controllers/libraryController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

router.use(authMiddleware)

router.get('/photos', libraryController.getLibrary)
router.get('/events', libraryController.getEventsOverview)
router.get('/prints', libraryController.getPrints)

export default router
