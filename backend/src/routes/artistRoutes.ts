import { Router, Response } from 'express'
import authMiddleware, { AuthenticatedRequest, requireRole } from '../middlewares/authMiddleware'
import { query } from '../db'
import { parseIDML } from '../utils/idmlParser'
import { getSignedUrl } from '../utils/storage'
import { assertSafeExternalUrl, fetchWithLimits } from '../utils/safeFetch'
import { notificationService } from '../services/notificationService'

const router = Router()

router.use(authMiddleware)
// req.user.role is resolved from profiles.role by authMiddleware, so no extra
// per-request profile lookup is needed here.
router.use(requireRole('artist'))

/**
 * GET /api/artists/stats
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const artistId = req.user?.id
    
    // Total templates
    const templatesCount = await query('SELECT COUNT(*)::int as count FROM public.templates WHERE artist_id = $1', [artistId])
    
    // Fulfillments
    const ordersCount = await query("SELECT COUNT(*)::int as count FROM public.orders WHERE artist_id = $1 AND status = 'completed'", [artistId])
    
    // Average review time
    const reviewTimeRes = await query(
      "SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600)::float as avg_hours FROM public.orders WHERE artist_id = $1 AND reviewed_at IS NOT NULL",
      [artistId]
    )

    res.json({
      templatesPublished: templatesCount.rows[0]?.count || 0,
      ordersFulfilled: ordersCount.rows[0]?.count || 0,
      avgReviewHours: Math.round((reviewTimeRes.rows[0]?.avg_hours || 0) * 10) / 10
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/artists/templates
 */
router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const artistId = req.user?.id
    const templatesRes = await query(
      'SELECT * FROM public.templates WHERE artist_id = $1 ORDER BY created_at DESC',
      [artistId]
    )
    res.json(templatesRes.rows)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/artists/templates
 */
router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const artistId = req.user?.id
    const {
      name,
      description,
      category,
      tags = [],
      status = 'draft',
      page_count = 2,
      total_photo_slots = 0,
      background_pdf_path,
      thumbnail_url,
      page_previews_urls = [],
      price_tier = 'free',
      available_sizes = [],
      paper_options = [],
      cover_options = [],
      layout_schema = {},
      style_schema = {}
    } = req.body

    const insertRes = await query(
      `INSERT INTO public.templates 
       (artist_id, name, description, category, tags, status, page_count, total_photo_slots, background_pdf_path, thumbnail_url, page_previews_urls, price_tier, available_sizes, paper_options, cover_options, layout_schema, style_schema)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        artistId,
        name,
        description,
        category,
        JSON.stringify(tags),
        status,
        page_count,
        total_photo_slots,
        background_pdf_path,
        thumbnail_url,
        JSON.stringify(page_previews_urls),
        price_tier,
        JSON.stringify(available_sizes),
        JSON.stringify(paper_options),
        JSON.stringify(cover_options),
        JSON.stringify(layout_schema),
        JSON.stringify(style_schema)
      ]
    )

    res.status(201).json(insertRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/artists/templates/parse-idml
 * Parses an uploaded IDML file on the fly and returns the template schema.json
 */
router.post('/templates/parse-idml', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { base64Data, templateId } = req.body
    if (!base64Data) {
      return res.status(400).json({ error: 'Base64 data is required' })
    }

    const buffer = Buffer.from(base64Data, 'base64')
    const parsedSchema = await parseIDML(buffer, templateId || 'parsed_idml')
    res.json(parsedSchema)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

/**
 * GET /api/artists/templates/proxy-pdf
 * Proxies a remote PDF URL to bypass browser CORS restrictions.
 */
router.get('/templates/proxy-pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url } = req.query
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required.' })
    }

    // Reject loopback/private targets before issuing any server-side request.
    const parsedUrl = await assertSafeExternalUrl(url)
    const targetUrl = parsedUrl.toString()

    console.log(`[PDF Proxy] Fetching external PDF: ${targetUrl}`)
    let { response, buffer: responseBuffer } = await fetchWithLimits(targetUrl)

    // Check if this is a Google Drive URL and we got an HTML warning/login page
    const isGoogleDrive = parsedUrl.hostname.endsWith('drive.google.com') || parsedUrl.hostname.endsWith('docs.google.com')
    const contentType = response.headers.get('content-type') || ''

    if (isGoogleDrive && contentType.includes('text/html') && response.ok) {
      const htmlText = responseBuffer.toString('utf-8')

      // Parse hidden input elements from the warning HTML form
      const inputs: Record<string, string> = {}
      const inputRegex = /<input[^>]*type=["']hidden["'][^>]*>/gi
      const nameRegex = /name=["']([^"']+)["']/i
      const valueRegex = /value=["']([^"']+)["']/i
      
      let inputMatch
      while ((inputMatch = inputRegex.exec(htmlText)) !== null) {
        const inputTag = inputMatch[0]
        const nameM = inputTag.match(nameRegex)
        const valM = inputTag.match(valueRegex)
        if (nameM && valM) {
          inputs[nameM[1]] = valM[1]
        }
      }

      // Check if we found a confirmation code or session uuid
      const confirmToken = inputs['confirm'] || ''
      
      // Extract form action URL
      let actionUrl = 'https://drive.google.com/uc'
      const actionRegex = /<form[^>]*action=["']([^"']+)["']/i
      const actionMatch = htmlText.match(actionRegex)
      if (actionMatch && actionMatch[1]) {
        actionUrl = actionMatch[1]
      }
      if (actionUrl.startsWith('/')) {
        actionUrl = 'https://drive.google.com' + actionUrl
      }

      const fileIdMatch = targetUrl.match(/id=([a-zA-Z0-9_-]+)/)
      const fileId = fileIdMatch ? fileIdMatch[1] : ''

      if (confirmToken || inputs['uuid']) {
        console.log(`[PDF Proxy] Bypassing Google Drive virus warning page for file ${fileId} with confirm inputs:`, inputs)
        
        // Build confirmation URL with all form parameters
        const urlParams = new URLSearchParams()
        for (const [k, v] of Object.entries(inputs)) {
          urlParams.append(k, v)
        }
        if (!inputs['confirm']) {
          urlParams.append('confirm', 't')
        }
        if (!inputs['id'] && fileId) {
          urlParams.append('id', fileId)
        }

        const confirmUrl = `${actionUrl}?${urlParams.toString()}`

        // Follow redirect or issue next request
        await assertSafeExternalUrl(confirmUrl)
        const confirmed = await fetchWithLimits(confirmUrl)
        response = confirmed.response
        responseBuffer = confirmed.buffer
      } else {
        // Not a warning page (e.g. folder or custom HTML)
        return validateAndSendBuffer(responseBuffer, res)
      }
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `External server returned status: ${response.statusText} (${response.status})` })
    }

    return validateAndSendBuffer(responseBuffer, res)
  } catch (error: any) {
    console.error('[PDF Proxy Error]', error)
    res.status(500).json({ error: error.message || 'Failed to proxy PDF file' })
  }
})

// Helper to validate PDF or PSD magic bytes and send the response
function validateAndSendBuffer(buffer: Buffer, res: Response) {
  const signature = buffer.length >= 4 ? buffer.toString('utf-8', 0, 4) : ''
  const isPdf = signature === '%PDF'
  const isPsd = signature === '8BPS'

  if (!isPdf && !isPsd) {
    const sampleText = buffer.toString('utf-8', 0, 1000)
    console.warn('[PDF/PSD Proxy] Retrieved content does not appear to be valid PDF or PSD. First 1000 chars:', sampleText)
    
    // Check if the response contains HTML (which indicates a Google Drive login/error page or generic HTML error page)
    const isHtml = sampleText.toLowerCase().includes('<html') || sampleText.toLowerCase().includes('<!doctype html')
    if (isHtml) {
      if (sampleText.includes('Sign in') || sampleText.includes('identifierId') || sampleText.includes('google.com/accounts/')) {
        return res.status(400).json({
          error: 'Google Drive returned a login page. Please verify that sharing settings are set to "Anyone with the link can view".'
        })
      }
      return res.status(400).json({
        error: 'The link returned an HTML webpage instead of a document file. Make sure the link points directly to a PDF or PSD asset and is shared publicly.'
      })
    }
    return res.status(400).json({
      error: 'Invalid structure. The URL did not return a valid PDF or PSD document.'
    })
  }

  if (isPdf) {
    res.setHeader('Content-Type', 'application/pdf')
  } else {
    res.setHeader('Content-Type', 'image/vnd.adobe.photoshop')
  }
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.send(buffer)
}

/**
 * PUT /api/artists/templates/:id
 */
router.put('/templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const artistId = req.user?.id
    const {
      name,
      description,
      category,
      tags,
      status,
      page_count,
      total_photo_slots,
      background_pdf_path,
      thumbnail_url,
      page_previews_urls,
      price_tier,
      available_sizes,
      paper_options,
      cover_options,
      layout_schema,
      version
    } = req.body

    // Ownership check
    const checkRes = await query('SELECT artist_id FROM public.templates WHERE id = $1', [id])
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found.' })
    }
    if (checkRes.rows[0].artist_id !== artistId) {
      return res.status(403).json({ error: 'Not authorized to modify this template.' })
    }

    const updateRes = await query(
      `UPDATE public.templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           tags = COALESCE($4, tags),
           status = COALESCE($5, status),
           page_count = COALESCE($6, page_count),
           total_photo_slots = COALESCE($7, total_photo_slots),
           background_pdf_path = COALESCE($8, background_pdf_path),
           thumbnail_url = COALESCE($9, thumbnail_url),
           page_previews_urls = COALESCE($10, page_previews_urls),
           price_tier = COALESCE($11, price_tier),
           available_sizes = COALESCE($12, available_sizes),
           paper_options = COALESCE($13, paper_options),
           cover_options = COALESCE($14, cover_options),
           layout_schema = COALESCE($15, layout_schema),
           version = COALESCE($16, version),
           updated_at = NOW()
       WHERE id = $17
       RETURNING *`,
      [
        name,
        description,
        category,
        tags ? JSON.stringify(tags) : null,
        status,
        page_count,
        total_photo_slots,
        background_pdf_path,
        thumbnail_url,
        page_previews_urls ? JSON.stringify(page_previews_urls) : null,
        price_tier,
        available_sizes ? JSON.stringify(available_sizes) : null,
        paper_options ? JSON.stringify(paper_options) : null,
        cover_options ? JSON.stringify(cover_options) : null,
        layout_schema ? JSON.stringify(layout_schema) : null,
        version,
        id
      ]
    )

    res.json(updateRes.rows[0])
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/artists/templates/:id
 */
router.delete('/templates/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const artistId = req.user?.id

    const checkRes = await query('SELECT artist_id FROM public.templates WHERE id = $1', [id])
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found.' })
    }
    if (checkRes.rows[0].artist_id !== artistId) {
      return res.status(403).json({ error: 'Not authorized to delete this template.' })
    }

    await query('DELETE FROM public.templates WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/artists/orders
 * Returns list of orders assigned to this artist for layout review
 */
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const artistId = req.user?.id
    const ordersRes = await query(
      `SELECT o.*, p.full_name as user_name, p.email as user_email
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.artist_id = $1 
         AND o.payment_status = 'paid'
         AND o.status IN ('pending-review', 'changes-requested', 'approved')
       ORDER BY o.submitted_at DESC`,
      [artistId]
    )

    // Generate signed URLs for image references for artist to review high resolution files safely
    const orders = ordersRes.rows
    for (const order of orders) {
      if (Array.isArray(order.image_references)) {
        order.image_references = await Promise.all(
          order.image_references.map(async (ref: string) => await getSignedUrl(ref))
        )
      }
    }

    res.json(orders)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/artists/orders/:id/review
 * Approves, requests changes, or escalates an order
 */
router.post('/orders/:id/review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const artistId = req.user?.id
    const { action, comment } = req.body // action: 'approve' | 'request-changes' | 'escalate'

    if (!['approve', 'request-changes', 'escalate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid review action.' })
    }

    const orderRes = await query('SELECT * FROM public.orders WHERE id = $1', [id])
    const order = orderRes.rows[0]
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }
    if (order.artist_id !== artistId) {
      return res.status(403).json({ error: 'Not authorized to review this order.' })
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({ error: 'This order has not been paid for yet.' })
    }

    let nextStatus = order.status
    if (action === 'approve') {
      if (order.status === 'approved') {
        return res.status(409).json({ error: 'This order has already been approved.' })
      }
      nextStatus = 'approved'

      // Auto queue print job — only if this order has no live job already, so a
      // double submit cannot enqueue the same order twice.
      const queued = await query(
        `INSERT INTO public.print_jobs (order_id, status)
         SELECT $1, 'queued'
         WHERE NOT EXISTS (
           SELECT 1 FROM public.print_jobs
           WHERE order_id = $1 AND status IN ('queued', 'processing', 'completed')
         )
         RETURNING id`,
        [id]
      )
      if (queued.rowCount === 0) {
        console.warn(`[ArtistReview] Print job for order ${id} already exists; skipping enqueue.`)
      }

      // Release this order from the artist's workload. current_order_count was
      // only ever incremented, so round-robin assignment drifted permanently
      // towards whoever joined most recently.
      if (order.artist_id) {
        await query(
          'UPDATE public.artists SET current_order_count = GREATEST(0, current_order_count - 1) WHERE user_id = $1',
          [order.artist_id]
        )
      }

      // Notify User: Approved
      await notificationService.sendNotification(
        order.user_id,
        'layout_approved',
        'Layout Approved',
        `Great news! Your layout for order #${id} has been approved and sent to print.`
      ).catch(e => console.error('Failed to send approval notification:', e))
    } else if (action === 'request-changes') {
      nextStatus = 'changes-requested'

      // Notify User: Changes Requested
      await notificationService.sendNotification(
        order.user_id,
        'changes_requested',
        'Changes Requested on Layout',
        `The design artist has requested some revisions on your layout for order #${id}. Comment: "${comment || ''}"`
      ).catch(e => console.error('Failed to send changes-requested notification:', e))
    }

    // Insert Revision Round record. Deriving the round number from MAX() rather
    // than COUNT() keeps numbering monotonic if an older round is ever removed.
    const roundCountRes = await query(
      'SELECT COALESCE(MAX(round_number), 0)::int as last FROM public.revision_rounds WHERE order_id = $1',
      [id]
    )
    const roundNumber = (roundCountRes.rows[0]?.last || 0) + 1

    await query(
      `INSERT INTO public.revision_rounds (order_id, round_number, artist_comment, status)
       VALUES ($1, $2, $3, $4)`,
      [id, roundNumber, comment || '', action === 'approve' ? 'approved' : action === 'request-changes' ? 'changes-requested' : 'pending']
    )

    // Update order status
    const updateRes = await query(
      `UPDATE public.orders
       SET status = $1, 
           reviewed_at = NOW(), 
           updated_at = NOW()
           ${action === 'approve' ? ", tracking_status = 'reviewed by humans'" : ""}
       WHERE id = $2
       RETURNING *`,
      [nextStatus, id]
    )

    res.json({ success: true, order: updateRes.rows[0] })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
