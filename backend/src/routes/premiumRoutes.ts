import { Router, Response } from 'express'
import authMiddleware, { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { query } from '../db'
import { v4 as uuidv4 } from 'uuid'
import { notificationService } from '../services/notificationService'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/premium/packages
 */
router.get('/packages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const packagesRes = await query('SELECT * FROM public.premium_packages WHERE is_active = TRUE ORDER BY base_price ASC')
    res.json(packagesRes.rows)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/premium/projects
 */
router.get('/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const userRole = req.user?.role || 'user'

    let projectsRes
    if (userRole === 'admin') {
      projectsRes = await query(
        `SELECT p.*, u.full_name as user_name, u.email as user_email, pk.name as package_name
         FROM public.premium_projects p
         JOIN public.profiles u ON p.user_id = u.id
         LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
         ORDER BY p.created_at DESC`
      )
    } else if (userRole === 'artist') {
      projectsRes = await query(
        `SELECT p.*, u.full_name as user_name, u.email as user_email, pk.name as package_name
         FROM public.premium_projects p
         JOIN public.profiles u ON p.user_id = u.id
         LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
         WHERE p.editor_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      )
    } else {
      projectsRes = await query(
        `SELECT p.*, pk.name as package_name, pk.description as package_desc
         FROM public.premium_projects p
         LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      )
    }

    res.json(projectsRes.rows)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/premium/projects/:id
 */
router.get('/projects/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role || 'user'

    const projectRes = await query(
      `SELECT p.*, pk.name as package_name, pk.description as package_desc, pk.base_price, pk.advance_percentage,
              u.full_name as user_name, u.email as user_email
       FROM public.premium_projects p
       JOIN public.profiles u ON p.user_id = u.id
       LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
       WHERE p.id = $1`,
      [id]
    )

    const project = projectRes.rows[0]
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }

    // Access check
    if (userRole !== 'admin' && project.user_id !== userId && project.editor_id !== userId) {
      return res.status(403).json({ error: 'Access Denied.' })
    }

    res.json(project)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects
 */
router.post('/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { packageId, briefJson, photoUploads = [] } = req.body

    if (!packageId) {
      return res.status(400).json({ error: 'Package selection is required.' })
    }

    // Load package pricing
    const pkgRes = await query('SELECT * FROM public.premium_packages WHERE id = $1', [packageId])
    const pkg = pkgRes.rows[0]
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' })
    }

    const advancePaymentAmount = Math.round((pkg.base_price * (pkg.advance_percentage || 50)) / 100)
    const balanceAmount = pkg.base_price - advancePaymentAmount

    const insertRes = await query(
      `INSERT INTO public.premium_projects 
       (user_id, status, brief_json, package_id, advance_payment_amount, balance_amount, photo_uploads, proofs, messages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        'briefing-received',
        JSON.stringify(briefJson || {}),
        packageId,
        advancePaymentAmount,
        balanceAmount,
        JSON.stringify(photoUploads),
        JSON.stringify([]),
        JSON.stringify([])
      ]
    )

    const newProject = insertRes.rows[0]

    // Notify Admins
    const adminsRes = await query("SELECT id FROM public.profiles WHERE role = 'admin'")
    for (const admin of adminsRes.rows) {
      await notificationService.sendNotification(
        admin.id,
        'system',
        'New Concierge Project Created',
        `A new Concierge project has been started by user ${userId}.`
      ).catch(e => console.error(e))
    }

    res.status(201).json(newProject)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects/:id/deposit-pay (Dummy)
 */
router.post('/projects/:id/deposit-pay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const projectRes = await query('SELECT * FROM public.premium_projects WHERE id = $1', [id])
    const project = projectRes.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access Denied.' })
    }

    // Auto assign a round-robin artist if none is assigned yet
    let editorId = project.editor_id
    if (!editorId) {
      const artistRes = await query(
        `SELECT user_id FROM public.artists 
         WHERE is_available = TRUE 
         ORDER BY current_order_count ASC, id ASC LIMIT 1`
      )
      editorId = artistRes.rows[0]?.user_id || null
    }

    const updateRes = await query(
      `UPDATE public.premium_projects
       SET advance_paid_at = NOW(),
           editor_id = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, editorId, editorId ? 'editor-assigned' : 'briefing-received']
    )

    const updated = updateRes.rows[0]

    // Notify User
    await notificationService.sendNotification(
      userId!,
      'system',
      'Concierge Deposit Paid',
      `Your advance deposit for Concierge project #${id} was received. An artist will begin working shortly.`
    ).catch(e => console.error(e))

    // Notify Artist
    if (editorId) {
      await query('UPDATE public.artists SET current_order_count = current_order_count + 1 WHERE user_id = $1', [editorId])
      await notificationService.sendNotification(
        editorId,
        'artist_assigned',
        'Concierge Project Assigned',
        `You have been assigned to Concierge design project #${id}.`
      ).catch(e => console.error(e))
    }

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects/:id/balance-pay (Dummy)
 */
router.post('/projects/:id/balance-pay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const projectRes = await query('SELECT * FROM public.premium_projects WHERE id = $1', [id])
    const project = projectRes.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access Denied.' })
    }

    const updateRes = await query(
      `UPDATE public.premium_projects
       SET balance_paid_at = NOW(),
           status = 'printing',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    // Notify Admin/Artist for print output
    if (project.editor_id) {
      await notificationService.sendNotification(
        project.editor_id,
        'system',
        'Concierge Final Balance Paid',
        `The final balance for Concierge project #${id} has been paid. Preparing print package.`
      ).catch(e => console.error(e))
    }

    res.json(updateRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects/:id/message
 */
router.post('/projects/:id/message', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role || 'user'
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Message text cannot be empty.' })
    }

    const projectRes = await query('SELECT * FROM public.premium_projects WHERE id = $1', [id])
    const project = projectRes.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }

    // Access check
    if (userRole !== 'admin' && project.user_id !== userId && project.editor_id !== userId) {
      return res.status(403).json({ error: 'Access Denied.' })
    }

    // Append message to logs
    const currentMessages = Array.isArray(project.messages) ? project.messages : []
    const senderRes = await query('SELECT full_name FROM public.profiles WHERE id = $1', [userId])
    const senderName = senderRes.rows[0]?.full_name || 'User'

    const newMessage = {
      id: uuidv4(),
      senderId: userId,
      senderName,
      senderRole: userRole,
      text,
      sentAt: new Date().toISOString()
    }

    const updatedMessages = [...currentMessages, newMessage]

    const updateRes = await query(
      `UPDATE public.premium_projects
       SET messages = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(updatedMessages)]
    )

    // Notify recipient
    const recipientId = userId === project.user_id ? project.editor_id : project.user_id
    if (recipientId) {
      await notificationService.sendNotification(
        recipientId,
        'chat_message',
        'New Concierge Workspace Message',
        `${senderName} sent a message: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
        { projectId: id }
      ).catch(e => console.error(e))
    }

    res.json(updateRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects/:id/proof (Artist/Admin only)
 */
router.post('/projects/:id/proof', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role || 'user'
    const { proofUrl, notes } = req.body

    if (userRole !== 'admin' && userRole !== 'artist') {
      return res.status(403).json({ error: 'Only design artists or admins can upload proofs.' })
    }

    const projectRes = await query('SELECT * FROM public.premium_projects WHERE id = $1', [id])
    const project = projectRes.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }
    if (userRole === 'artist' && project.editor_id !== userId) {
      return res.status(403).json({ error: 'You are not assigned to this project.' })
    }

    const currentProofs = Array.isArray(project.proofs) ? project.proofs : []
    const newProof = {
      id: uuidv4(),
      proofUrl,
      notes: notes || '',
      uploadedAt: new Date().toISOString(),
      status: 'pending' // pending, approved, revisions-requested
    }

    const updatedProofs = [...currentProofs, newProof]

    const updateRes = await query(
      `UPDATE public.premium_projects
       SET proofs = $2, status = 'first-draft', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(updatedProofs)]
    )

    // Notify User
    await notificationService.sendNotification(
      project.user_id,
      'system',
      'New Layout Proof Uploaded',
      `Your design artist has uploaded a draft layout for your Concierge project review.`
    ).catch(e => console.error(e))

    res.json(updateRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/premium/projects/:id/approve (User only)
 */
router.post('/projects/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const projectRes = await query('SELECT * FROM public.premium_projects WHERE id = $1', [id])
    const project = projectRes.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' })
    }
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access Denied.' })
    }

    // Set last proof as approved and status to final-approval
    const proofs = Array.isArray(project.proofs) ? project.proofs : []
    if (proofs.length > 0) {
      proofs[proofs.length - 1].status = 'approved'
    }

    const updateRes = await query(
      `UPDATE public.premium_projects
       SET status = 'final-approval',
           proofs = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(proofs)]
    )

    // Notify Artist
    if (project.editor_id) {
      await notificationService.sendNotification(
        project.editor_id,
        'system',
        'Concierge Design Approved',
        `The user has approved the draft layout. The project is ready for final payment.`
      ).catch(e => console.error(e))
    }

    res.json(updateRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
