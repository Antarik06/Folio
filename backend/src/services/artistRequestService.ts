import { query } from '../db'
import { v4 as uuidv4 } from 'uuid'
import { notificationService } from './notificationService'
import { HttpError } from '../utils/httpError'
import type { AppRole } from '../middlewares/authMiddleware'

/** The notification kinds this service emits, as declared by notificationService. */
type NotificationType = Parameters<typeof notificationService.sendNotification>[1]

/**
 * Ask an Artist — commissioning a photographer or designer to build an album.
 *
 * This was written inline in routes/premiumRoutes.ts, which is why the same
 * "can this person touch this project" check appeared five times with slightly
 * different wording. The rule lives in `assertAccess` now, and the route file
 * is back to wiring HTTP to service calls.
 *
 * The table is still `premium_projects` and the API path is still
 * /api/premium — renaming a live table and a live endpoint is a migration, not
 * a rename, so the user-facing name changed and the storage did not.
 */

export type CommissionStatus =
  | 'briefing-received'
  | 'editor-assigned'
  | 'first-draft'
  | 'revisions'
  | 'final-approval'
  | 'printing'
  | 'delivered'

async function loadProject(projectId: string) {
  const res = await query('SELECT * FROM public.premium_projects WHERE id = $1', [projectId])
  const project = res.rows[0]
  if (!project) {
    throw new HttpError(404, 'Project not found.')
  }
  return project
}

/**
 * Three parties may touch a commission: the person who commissioned it, the
 * artist assigned to it, and staff.
 */
function assertAccess(project: any, userId: string, role: AppRole) {
  if (role === 'admin') return
  if (project.user_id === userId) return
  if (project.editor_id === userId) return
  throw new HttpError(403, 'Access Denied.')
}

/** Notifications must never fail the request that triggered them. */
function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return notificationService
    .sendNotification(userId, type, title, message, data)
    .catch((err) => console.error('[artistRequest] notification failed:', err))
}

export const artistRequestService = {
  async listPackages() {
    const res = await query(
      'SELECT * FROM public.premium_packages WHERE is_active = TRUE ORDER BY base_price ASC'
    )
    return res.rows
  },

  /**
   * Commissions visible to the caller: staff see everything, an artist sees
   * what they were assigned, everyone else sees their own.
   */
  async listProjects(userId: string, role: AppRole) {
    if (role === 'admin') {
      const res = await query(
        `SELECT p.*, u.full_name AS user_name, u.email AS user_email, pk.name AS package_name
           FROM public.premium_projects p
           JOIN public.profiles u ON p.user_id = u.id
           LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
          ORDER BY p.created_at DESC`
      )
      return res.rows
    }

    if (role === 'artist') {
      const res = await query(
        `SELECT p.*, u.full_name AS user_name, u.email AS user_email, pk.name AS package_name
           FROM public.premium_projects p
           JOIN public.profiles u ON p.user_id = u.id
           LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
          WHERE p.editor_id = $1
          ORDER BY p.created_at DESC`,
        [userId]
      )
      return res.rows
    }

    const res = await query(
      `SELECT p.*, pk.name AS package_name, pk.description AS package_desc
         FROM public.premium_projects p
         LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC`,
      [userId]
    )
    return res.rows
  },

  async getProject(projectId: string, userId: string, role: AppRole) {
    const res = await query(
      `SELECT p.*, pk.name AS package_name, pk.description AS package_desc,
              pk.base_price, pk.advance_percentage,
              u.full_name AS user_name, u.email AS user_email
         FROM public.premium_projects p
         JOIN public.profiles u ON p.user_id = u.id
         LEFT JOIN public.premium_packages pk ON p.package_id = pk.id
        WHERE p.id = $1`,
      [projectId]
    )

    const project = res.rows[0]
    if (!project) {
      throw new HttpError(404, 'Project not found.')
    }

    assertAccess(project, userId, role)
    return project
  },

  async createProject(
    userId: string,
    input: { packageId?: string; briefJson?: unknown; photoUploads?: unknown[] }
  ) {
    if (!input.packageId) {
      throw new HttpError(400, 'Package selection is required.')
    }

    const pkgRes = await query('SELECT * FROM public.premium_packages WHERE id = $1', [
      input.packageId,
    ])
    const pkg = pkgRes.rows[0]
    if (!pkg) {
      throw new HttpError(404, 'Package not found.')
    }

    const advance = Math.round((pkg.base_price * (pkg.advance_percentage || 50)) / 100)
    const balance = pkg.base_price - advance

    const insertRes = await query(
      `INSERT INTO public.premium_projects
         (user_id, status, brief_json, package_id, advance_payment_amount, balance_amount,
          photo_uploads, proofs, messages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
      [
        userId,
        'briefing-received',
        JSON.stringify(input.briefJson || {}),
        input.packageId,
        advance,
        balance,
        JSON.stringify(input.photoUploads ?? []),
        JSON.stringify([]),
        JSON.stringify([]),
      ]
    )

    const project = insertRes.rows[0]

    const adminsRes = await query("SELECT id FROM public.profiles WHERE role = 'admin'")
    await Promise.all(
      adminsRes.rows.map((admin: any) =>
        notify(
          admin.id,
          'system',
          'New commission',
          `A new commission was opened (project ${project.id.substring(0, 8)}).`
        )
      )
    )

    return project
  },

  /**
   * Deposit payment. Assigns the least-loaded available artist if none has
   * been assigned yet.
   */
  async payDeposit(projectId: string, userId: string) {
    const project = await loadProject(projectId)
    if (project.user_id !== userId) {
      throw new HttpError(403, 'Access Denied.')
    }

    let editorId = project.editor_id
    if (!editorId) {
      const artistRes = await query(
        `SELECT user_id FROM public.artists
          WHERE is_available = TRUE
          ORDER BY current_order_count ASC, id ASC
          LIMIT 1`
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
      [projectId, editorId, editorId ? 'editor-assigned' : 'briefing-received']
    )

    await notify(
      userId,
      'system',
      'Deposit received',
      'Your deposit was received. An artist will start shortly.'
    )

    if (editorId) {
      await query(
        'UPDATE public.artists SET current_order_count = current_order_count + 1 WHERE user_id = $1',
        [editorId]
      )
      await notify(
        editorId,
        'artist_assigned',
        'Commission assigned',
        `You have been assigned commission ${projectId.substring(0, 8)}.`
      )
    }

    return updateRes.rows[0]
  },

  async payBalance(projectId: string, userId: string) {
    const project = await loadProject(projectId)
    if (project.user_id !== userId) {
      throw new HttpError(403, 'Access Denied.')
    }

    const updateRes = await query(
      `UPDATE public.premium_projects
          SET balance_paid_at = NOW(),
              status = 'printing',
              updated_at = NOW()
        WHERE id = $1
    RETURNING *`,
      [projectId]
    )

    if (project.editor_id) {
      await notify(
        project.editor_id,
        'system',
        'Balance paid',
        `Final balance paid on commission ${projectId.substring(0, 8)}. Preparing the print package.`
      )
    }

    return updateRes.rows[0]
  },

  async postMessage(projectId: string, userId: string, role: AppRole, text: string) {
    const trimmed = (text ?? '').trim()
    if (!trimmed) {
      throw new HttpError(400, 'Message text cannot be empty.')
    }

    const project = await loadProject(projectId)
    assertAccess(project, userId, role)

    const senderRes = await query('SELECT full_name FROM public.profiles WHERE id = $1', [userId])
    const senderName = senderRes.rows[0]?.full_name || 'User'

    const messages = Array.isArray(project.messages) ? project.messages : []
    messages.push({
      id: uuidv4(),
      senderId: userId,
      senderName,
      senderRole: role,
      text: trimmed,
      sentAt: new Date().toISOString(),
    })

    const updateRes = await query(
      `UPDATE public.premium_projects
          SET messages = $2, updated_at = NOW()
        WHERE id = $1
    RETURNING *`,
      [projectId, JSON.stringify(messages)]
    )

    const recipientId = userId === project.user_id ? project.editor_id : project.user_id
    if (recipientId) {
      const excerpt = trimmed.length > 40 ? `${trimmed.substring(0, 40)}…` : trimmed
      await notify(
        recipientId,
        'chat_message',
        'New workspace message',
        `${senderName}: "${excerpt}"`,
        { projectId }
      )
    }

    return updateRes.rows[0]
  },

  /** Uploading a proof. Artists and staff only. */
  async addProof(
    projectId: string,
    userId: string,
    role: AppRole,
    input: { proofUrl?: string; notes?: string }
  ) {
    if (role !== 'admin' && role !== 'artist') {
      throw new HttpError(403, 'Only artists or admins can upload proofs.')
    }
    if (!input.proofUrl) {
      throw new HttpError(400, 'A proof URL is required.')
    }

    const project = await loadProject(projectId)
    if (role === 'artist' && project.editor_id !== userId) {
      throw new HttpError(403, 'You are not assigned to this project.')
    }

    const proofs = Array.isArray(project.proofs) ? project.proofs : []
    proofs.push({
      id: uuidv4(),
      proofUrl: input.proofUrl,
      notes: input.notes || '',
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    })

    const updateRes = await query(
      `UPDATE public.premium_projects
          SET proofs = $2, status = 'first-draft', updated_at = NOW()
        WHERE id = $1
    RETURNING *`,
      [projectId, JSON.stringify(proofs)]
    )

    await notify(
      project.user_id,
      'system',
      'New proof to review',
      'Your artist uploaded a draft layout for review.'
    )

    return updateRes.rows[0]
  },

  /** Approving the latest proof. The commissioner only. */
  async approveProof(projectId: string, userId: string) {
    const project = await loadProject(projectId)
    if (project.user_id !== userId) {
      throw new HttpError(403, 'Access Denied.')
    }

    const proofs = Array.isArray(project.proofs) ? project.proofs : []
    if (proofs.length === 0) {
      throw new HttpError(400, 'There is no proof to approve yet.')
    }
    proofs[proofs.length - 1].status = 'approved'

    const updateRes = await query(
      `UPDATE public.premium_projects
          SET status = 'final-approval',
              proofs = $2,
              approved_at = NOW(),
              updated_at = NOW()
        WHERE id = $1
    RETURNING *`,
      [projectId, JSON.stringify(proofs)]
    )

    if (project.editor_id) {
      await notify(
        project.editor_id,
        'system',
        'Design approved',
        'The commissioner approved the draft. Ready for final payment.'
      )
    }

    return updateRes.rows[0]
  },
}
