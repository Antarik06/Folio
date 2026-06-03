import { Router } from 'express'
import { albumController } from '../controllers/albumController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// Public route to view shared album info without auth
router.get('/share/info/:token', albumController.getSharedAlbum)
router.get('/published', albumController.listPublished)

// All subsequent album operations are protected by auth JWT
router.use(authMiddleware)

router.post('/', albumController.create)
router.get('/', albumController.list)
router.get('/:id', albumController.get)
router.patch('/:id/layout', albumController.updateLayout)
router.patch('/:id/rename', albumController.rename)
router.patch('/:id/cover', albumController.updateCover)
router.patch('/:id/publish', albumController.publish)
router.delete('/:id', albumController.delete)
router.post('/:id/share-link', albumController.shareLink)
router.patch('/:id/delivery-instructions', albumController.updateDeliveryInstructions)

export default router
