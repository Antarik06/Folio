import { Router, Response } from 'express'
import authMiddleware, { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { query } from '../db'

const router = Router()

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    const profileRes = await query('SELECT * FROM public.profiles WHERE id = $1', [userId])
    const profile = profileRes.rows[0]
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' })
    }

    res.json(profile)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
