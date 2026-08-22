import { Router, Request, Response } from 'express'
import authMiddleware, { requireRole, AuthenticatedRequest } from '../middlewares/authMiddleware'
import { cardService } from '../services/cardService'
import { sendError, HttpError } from '../utils/httpError'
import {
  createCardSchema,
  updateCardSchema,
  createVersionSchema,
  upsertStyleSchema,
  upsertTemplateSchema,
  describeZodError,
} from '../schema/cardSchema'

/**
 * Wiring only. Every decision — what a template permits, which version a card
 * is pinned to, whether a customisation is allowed — lives in cardService.
 *
 * Route order matters here: the literal paths are declared before `/:cardId`,
 * or `/catalog` would be read as a card id.
 */
const router = Router()

function userId(req: AuthenticatedRequest): string {
  if (!req.user?.id) throw new HttpError(401, 'Unauthenticated')
  return req.user.id
}

/* ── Public ───────────────────────────────────────────────────────────────── */

/** A shared card. Deliberately before the auth middleware. */
router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const card = await cardService.getPublicCard(req.params.slug)
    if (!card) return res.status(404).json({ error: 'Card not found.' })
    res.json(card)
  } catch (error: any) {
    sendError(res, error)
  }
})

router.use(authMiddleware)

/* ── Catalogue ────────────────────────────────────────────────────────────── */

router.get('/catalog', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.getCatalog())
  } catch (error: any) {
    sendError(res, error)
  }
})

/* ── The user's card profile ──────────────────────────────────────────────── */

router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.getProfile(userId(req)))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.saveProfile(userId(req), req.body))
  } catch (error: any) {
    sendError(res, error)
  }
})

/* ── Admin ────────────────────────────────────────────────────────────────── */

const admin = Router()
admin.use(requireRole('admin'))

admin.get('/catalog', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.adminListCatalog())
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.get('/templates/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.adminGetTemplate(req.params.templateId))
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = upsertTemplateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: describeZodError(parsed.error) })
    }
    res.status(201).json(await cardService.adminUpsertTemplate(parsed.data))
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.post('/templates/:templateId/versions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createVersionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: describeZodError(parsed.error) })
    }
    res
      .status(201)
      .json(await cardService.adminCreateVersion(req.params.templateId, userId(req), parsed.data))
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.patch('/templates/:templateId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, version } = req.body ?? {}
    if (status && !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Unknown status.' })
    }
    res.json(
      await cardService.adminSetStatus(req.params.templateId, {
        status,
        version: version === undefined ? undefined : Number(version),
      })
    )
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.post('/templates/:templateId/duplicate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newId = String(req.body?.id ?? '')
    if (!/^[a-z0-9_]{2,40}$/.test(newId)) {
      return res.status(400).json({ error: 'An id must be 2–40 lowercase letters, numbers or underscores.' })
    }
    res
      .status(201)
      .json(await cardService.adminDuplicateTemplate(req.params.templateId, newId, userId(req)))
  } catch (error: any) {
    sendError(res, error)
  }
})

admin.post('/styles', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = upsertStyleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: describeZodError(parsed.error) })
    }
    res.status(201).json(await cardService.adminUpsertStyle(parsed.data))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.use('/admin', admin)

/* ── Cards ────────────────────────────────────────────────────────────────── */

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.listCards(userId(req)))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createCardSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: describeZodError(parsed.error) })
    }
    res.status(201).json(await cardService.createCard(userId(req), parsed.data))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.get('/:cardId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.getCard(userId(req), req.params.cardId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.patch('/:cardId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateCardSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: describeZodError(parsed.error) })
    }
    res.json(await cardService.updateCard(userId(req), req.params.cardId, parsed.data))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/:cardId/regenerate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.regenerateCard(userId(req), req.params.cardId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.post('/:cardId/upgrade', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json(await cardService.upgradeCard(userId(req), req.params.cardId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.delete('/:cardId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await cardService.deleteCard(userId(req), req.params.cardId)
    res.status(204).end()
  } catch (error: any) {
    sendError(res, error)
  }
})

export default router
