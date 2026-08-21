import { Router, Response } from 'express'
import authMiddleware, { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { artistRequestService } from '../services/artistRequestService'
import { sendError } from '../utils/httpError'

/**
 * Ask an Artist (formerly Premium Concierge).
 *
 * Wiring only — every rule lives in services/artistRequestService. The path
 * stays /api/premium because renaming a live endpoint would break clients
 * mid-flight; the product name is what changed.
 */
const router = Router()

router.use(authMiddleware)

router.get('/packages', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await artistRequestService.listPackages())
  } catch (error: any) {
    sendError(res, error)
  }
})

router.get('/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(await artistRequestService.listProjects(userId, req.user?.role ?? 'user'))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.get('/projects/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(
      await artistRequestService.getProject(req.params.id, userId, req.user?.role ?? 'user')
    )
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    const { packageId, briefJson, photoUploads } = req.body ?? {}
    const project = await artistRequestService.createProject(userId, {
      packageId,
      briefJson,
      photoUploads,
    })
    res.status(201).json(project)
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects/:id/deposit-pay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(await artistRequestService.payDeposit(req.params.id, userId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects/:id/balance-pay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(await artistRequestService.payBalance(req.params.id, userId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects/:id/message', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(
      await artistRequestService.postMessage(
        req.params.id,
        userId,
        req.user?.role ?? 'user',
        req.body?.text
      )
    )
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects/:id/proof', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    const { proofUrl, notes } = req.body ?? {}
    res.json(
      await artistRequestService.addProof(req.params.id, userId, req.user?.role ?? 'user', {
        proofUrl,
        notes,
      })
    )
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/projects/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(await artistRequestService.approveProof(req.params.id, userId))
  } catch (error: any) {
    sendError(res, error)
  }
})

export default router
