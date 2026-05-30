import { Router } from 'express'
import { orderController } from '../controllers/orderController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// All order endpoints require authorization
router.use(authMiddleware)

router.post('/', orderController.create)
router.post('/verify', orderController.verifyPayment)
router.get('/album/:albumId', orderController.getAlbumOrder)
router.get('/', orderController.getUserOrders)

export default router
