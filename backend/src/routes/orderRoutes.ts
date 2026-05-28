import { Router } from 'express'
import { orderController } from '../controllers/orderController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// All order endpoints require authorization
router.use(authMiddleware)

router.post('/', orderController.create)
router.get('/album/:albumId', orderController.getAlbumOrder)

export default router
