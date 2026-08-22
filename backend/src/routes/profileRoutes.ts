import { Router, Request, Response } from 'express'
import authMiddleware, { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { profileService } from '../services/profileService'
import { sendError } from '../utils/httpError'
import { query } from '../db'

const router = Router()

/**
 * Public page lookup by handle. Deliberately unauthenticated and mounted
 * before the auth middleware — a shared profile link has to open for someone
 * who has never signed in.
 */
router.get('/page/:handle', async (req: Request, res: Response) => {
  try {
    const page = await profileService.getPublicPage(req.params.handle)
    if (!page) {
      return res.status(404).json({ error: 'Page not found.' })
    }
    res.json(page)
  } catch (error: any) {
    sendError(res, error)
  }
})

router.use(authMiddleware)

/** The raw profile row. Callers rely on this for role resolution. */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })

    const profileRes = await query('SELECT * FROM public.profiles WHERE id = $1', [userId])
    const profile = profileRes.rows[0]
    if (!profile) return res.status(404).json({ error: 'Profile not found.' })

    res.json(profile)
  } catch (error: any) {
    sendError(res, error)
  }
})

/** The signed-in user's own page, including what they could still promote. */
router.get('/page', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    res.json(await profileService.getOwnPage(userId))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.patch('/page', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    const { handle, bio, page_is_public } = req.body ?? {}
    res.json(await profileService.updatePage(userId, { handle, bio, page_is_public }))
  } catch (error: any) {
    sendError(res, error)
  }
})

router.patch('/albums/:albumId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
    const onProfile = req.body?.on_profile === true
    res.json(await profileService.setAlbumOnProfile(userId, req.params.albumId, onProfile))
  } catch (error: any) {
    sendError(res, error)
  }
})

/**
 * Cards themselves live at /api/cards — see routes/cardRoutes.ts. The profile
 * page still carries them in its payload, because the page is where they are
 * shown, but creating and editing one is the card engine's business.
 */

export default router
