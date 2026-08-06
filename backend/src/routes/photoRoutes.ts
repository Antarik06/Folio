import { Router } from 'express'
import { photoController } from '../controllers/photoController'
import { faceController } from '../controllers/faceController'
import authMiddleware from '../middlewares/authMiddleware'

const router = Router()

// All photo operations require active authenticated session
router.use(authMiddleware)

router.get('/event/:eventId', photoController.getPhotos)
router.get('/proxy-google-drive', photoController.proxyGoogleDrive)
router.post('/', photoController.registerPhoto)
router.patch('/:id/shared', photoController.toggleShared)
router.post('/event/:eventId/share-all', photoController.shareAll)
router.patch('/:id/approve', photoController.approve)
router.post('/:id/reject', photoController.reject)
router.patch('/:id/move', photoController.movePhoto)
router.patch('/:id/tags', photoController.updateTags)
router.patch('/:id/location', photoController.updateLocation)
router.delete('/:id', photoController.deletePhoto)

// Face indexing. Descriptors are computed client-side and posted back here.
router.post('/:id/faces', faceController.registerPhotoFaces)
router.post('/:id/faces/failed', faceController.markScanFailed)

export default router
