import { createHmac, timingSafeEqual } from 'node:crypto'
import { query } from '../db'
import { validatePostalCode, validateShippingAddress } from '../utils/pricing'
import { razorpay } from '../utils/razorpay'
import { v4 as uuidv4 } from 'uuid'
import { settingsService } from './settingsService'
import { notificationService } from './notificationService'

/** Safety cap so a malformed polaroid basket cannot create an absurd order. */
const MAX_POLAROID_PRINTS = 500

export const orderService = {
  /**
   * Validates details and creates a print book order row.
   */
  async createOrder(input: {
    albumId?: string
    productType: 'softcover' | 'hardcover' | 'polaroid'
    size: 'small' | 'large'
    quantity: number
    shippingAddress: any
    promoCode?: string
    metadata?: any
  }, userId: string): Promise<any> {
    // 1. Verify album ownership if it's a book
    let albumTitle = 'Polaroid Prints'
    let pageCount = 0

    if (input.productType !== 'polaroid') {
      if (!input.albumId) {
        throw new Error('Album ID is required.')
      }

      const albumRes = await query(
        'SELECT id, owner_id, status, layout_data FROM public.albums WHERE id = $1',
        [input.albumId]
      )
      const album = albumRes.rows[0]

      if (!album) {
        throw new Error('Album not found.')
      }
      if (album.owner_id !== userId) {
        throw new Error('You do not own this album.')
      }

      // Fetch page count for Book
      const pagesCountRes = await query(
        'SELECT COUNT(*)::int as count FROM public.album_pages WHERE album_id = $1',
        [input.albumId]
      )
      const albumPagesCount = pagesCountRes.rows[0]?.count

      if (albumPagesCount && albumPagesCount > 0) {
        pageCount = albumPagesCount
      } else {
        const layoutData = album.layout_data
        if (layoutData && typeof layoutData === 'object' && Array.isArray(layoutData.spreads)) {
          pageCount = layoutData.spreads.length
        }
      }

      if (pageCount === 0) {
        throw new Error('This album has no pages yet. Add at least one spread before ordering.')
      }

      // Validate page count limits dynamically
      const [limitsRes, minPagesRes] = await Promise.all([
        query("SELECT value FROM public.system_settings WHERE key = 'page_limits'"),
        query("SELECT value FROM public.system_settings WHERE key = 'min_pages'")
      ])

      let pageLimits = { softcover: 80, hardcover: 120 }
      if (limitsRes.rows.length > 0) {
        pageLimits = limitsRes.rows[0].value
      }
      const maxPages = pageLimits[input.productType] || (input.productType === 'softcover' ? 80 : 120)
      if (pageCount > maxPages) {
        throw new Error(`This album has ${pageCount} pages, which exceeds the limit of ${maxPages} pages.`)
      }

      // Binderies cannot produce a book below a minimum signature count, which
      // is what the min_pages setting exists for. It was seeded but never
      // checked, so under-length albums reached the printer and failed there.
      const minPages = Number(minPagesRes.rows[0]?.value ?? 0)
      if (minPages > 0 && pageCount < minPages) {
        throw new Error(
          `This album has ${pageCount} pages. A printed book needs at least ${minPages} pages — add ${minPages - pageCount} more before ordering.`
        )
      }
    }

    // 2. Validate quantity boundaries dynamically.
    // For polaroids the billable unit is a single print, and the number of
    // prints comes from the per-image quantities in metadata — not from
    // `quantity`, which is the number of copies of a book.
    let billableUnits = input.quantity

    if (input.productType === 'polaroid') {
      const quantities: number[] = Array.isArray(input.metadata?.quantities) ? input.metadata.quantities : []
      const images: string[] = Array.isArray(input.metadata?.images) ? input.metadata.images : []

      if (images.length === 0) {
        throw new Error('Select at least one photo for your polaroid prints.')
      }

      billableUnits = quantities.length > 0
        ? quantities.reduce((sum, q) => sum + (Number(q) || 0), 0)
        : images.length

      if (billableUnits < 1) {
        throw new Error('Select at least one polaroid print.')
      }
      if (billableUnits > MAX_POLAROID_PRINTS) {
        throw new Error(`You can order at most ${MAX_POLAROID_PRINTS} polaroid prints in a single order.`)
      }
    } else {
      const copyLimitsRes = await query("SELECT value FROM public.system_settings WHERE key = 'min_max_copies'")
      let copyLimits = { min: 1, max: 10 }
      if (copyLimitsRes.rows.length > 0) {
        copyLimits = copyLimitsRes.rows[0].value
      }
      if (input.quantity < copyLimits.min || input.quantity > copyLimits.max) {
        throw new Error(`Quantity must be between ${copyLimits.min} and ${copyLimits.max}.`)
      }
    }

    // 3. Validate shipping details
    if (!validateShippingAddress(input.shippingAddress)) {
      throw new Error('Please fill in all required shipping fields.')
    }

    if (!validatePostalCode(input.shippingAddress.postalCode)) {
      throw new Error('Enter a valid postal code (4–10 alphanumeric characters).')
    }

    // 4. Compute server-side price dynamically
    const pricingRes = await query("SELECT value FROM public.system_settings WHERE key = 'pricing'")
    let pricing = { softcover: 89900, hardcover: 149900, polaroid: 19900 }
    if (pricingRes.rows.length > 0) {
      pricing = pricingRes.rows[0].value
    }
    const unitPrice = pricing[input.productType] || (input.productType === 'softcover' ? 89900 : input.productType === 'hardcover' ? 149900 : 19900)
    const subtotal = unitPrice * billableUnits

    // 5. Fetch tax and shipping configurations
    const taxShipRes = await query("SELECT value FROM public.system_settings WHERE key = 'shipping_and_tax'")
    let taxShip = { tax_rate: 18, shipping_fee: 15000, free_shipping_threshold: 150000 }
    if (taxShipRes.rows.length > 0) {
      taxShip = taxShipRes.rows[0].value
    }

    // 6. Handle Promo Codes
    let discount = 0
    if (input.promoCode) {
      const promoCheck = await settingsService.validatePromoCode(input.promoCode, subtotal)
      if (promoCheck.valid) {
        if (promoCheck.discountType === 'percentage') {
          discount = Math.round(subtotal * (promoCheck.discountValue || 0) / 100)
        } else if (promoCheck.discountType === 'fixed') {
          discount = promoCheck.discountValue || 0
        }
        // A fixed discount larger than the basket must not create a credit.
        discount = Math.min(discount, subtotal)
      } else {
        throw new Error(promoCheck.message)
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount)
    const shippingFee = discountedSubtotal >= taxShip.free_shipping_threshold ? 0 : taxShip.shipping_fee
    
    // grandTotal = discounted subtotal + shipping + tax
    const taxableAmount = discountedSubtotal + shippingFee
    const taxAmount = Math.round(taxableAmount * (taxShip.tax_rate / 100))
    const grandTotal = taxableAmount + taxAmount

    // Store calculations and details in metadata column
    const orderMetadata = {
      subtotal,
      discount,
      shippingFee,
      taxRate: taxShip.tax_rate,
      taxAmount,
      promoCode: input.promoCode || null,
      polaroidDetails: input.productType === 'polaroid' ? (input.metadata || {}) : null
    }

    const dbProductType = input.productType === 'polaroid' ? 'polaroid' : `${input.productType}_${input.size}`

    // Create Razorpay Order
    let razorpayOrderId = `order_mock_${uuidv4().substring(0, 8)}`
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (keyId !== 'rzp_test_mock' && keySecret) {
      try {
        const rpOrder = await razorpay.orders.create({
          amount: grandTotal, // Grand total in paise
          currency: 'INR',
          receipt: `rcpt_${uuidv4().substring(0, 8)}`
        })
        razorpayOrderId = rpOrder.id
      } catch (err) {
        console.error('Razorpay Order Creation Error:', err)
        throw new Error('Failed to create payment transaction with Razorpay.')
      }
    }

    // Resolve artist assignment
    let artistId = null
    let albumLayout = null
    const imageReferences: string[] = []

    if (input.albumId) {
      // Find if template is associated with an artist
      const albumRes = await query('SELECT template_id, layout_data FROM public.albums WHERE id = $1', [input.albumId])
      const album = albumRes.rows[0]
      if (album) {
        albumLayout = album.layout_data
        
        // Extract image references
        const unresolvableSources: string[] = []
        if (albumLayout) {
          const spreads = albumLayout.spreads || []
          spreads.forEach((spread: any) => {
            const checkElement = (el: any) => {
              if (el.type === 'image' && el.src) {
                // blob:/data: sources only resolve inside the browser tab that
                // created them. If one reaches here the printer would render a
                // blank box, so refuse the order instead of shipping a book with
                // missing photos.
                if (/^(blob:|data:)/i.test(el.src)) {
                  unresolvableSources.push(el.name || el.id || 'an image')
                  return
                }
                imageReferences.push(el.src)
              }
            }
            if (spread.elements) spread.elements.forEach(checkElement)
            if (spread.front?.elements) spread.front.elements.forEach(checkElement)
            if (spread.back?.elements) spread.back.elements.forEach(checkElement)
          })
        }

        if (unresolvableSources.length > 0) {
          throw new Error(
            `${unresolvableSources.length} photo(s) in this album were never finished uploading and cannot be printed. ` +
            `Open the album in the editor, re-add them, and try again.`
          )
        }

        if (album.template_id) {
          const templateRes = await query('SELECT artist_id FROM public.templates WHERE id = $1', [album.template_id])
          artistId = templateRes.rows[0]?.artist_id || null
        }
      }
    }

    // If template has no specific artist, select available round-robin artist
    if (!artistId) {
      const artistRes = await query(
        `SELECT user_id FROM public.artists 
         WHERE is_available = TRUE 
         ORDER BY current_order_count ASC, id ASC LIMIT 1`
      )
      artistId = artistRes.rows[0]?.user_id || null
    }

    if (artistId) {
      // Increment artist count
      await query(
        'UPDATE public.artists SET current_order_count = current_order_count + 1 WHERE user_id = $1',
        [artistId]
      )
    }

    // Extrapolate contact details
    const contactDetails = {
      name: input.shippingAddress?.fullName || 'Valued Customer',
      email: input.shippingAddress?.email || 'customer@example.com',
      phone: input.shippingAddress?.phone || '000-000-0000'
    }
    const specialInstructions = input.shippingAddress?.specialInstructions || ''

    // 7. Insert order
    const insertRes = await query(
      `INSERT INTO public.orders 
       (user_id, album_id, product_type, quantity, unit_price, total_price, currency, payment_status, shipping_address, shipping_status, razorpay_order_id, tracking_status, metadata, promo_code, artist_id, order_type, status, album_layout_json, image_references, contact_details_json, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        userId,
        input.albumId || null,
        dbProductType,
        billableUnits,
        unitPrice,
        grandTotal,
        'inr',
        'pending',
        JSON.stringify(input.shippingAddress),
        'pending',
        razorpayOrderId,
        'order placed',
        JSON.stringify(orderMetadata),
        input.promoCode || null,
        artistId,
        'standard',
        'pending-review',
        JSON.stringify(albumLayout || {}),
        JSON.stringify(imageReferences),
        JSON.stringify(contactDetails),
        specialInstructions
      ]
    )
    const order = insertRes.rows[0]

    // 8. Update album status to 'ordered' for Books
    if (input.albumId) {
      await query(
        "UPDATE public.albums SET status = 'ordered', updated_at = NOW() WHERE id = $1",
        [input.albumId]
      )
    }

    if (artistId) {
      await notificationService.sendNotification(
        artistId,
        'artist_assigned',
        'New Order Assigned',
        `You have been assigned to review the layout for order #${order.id}.`
      ).catch(e => console.error('Failed to send notification to artist:', e))
    }

    return {
      ...order,
      razorpayKeyId: keyId
    }
  },

  /**
   * Fetches order details for a specific album
   */
  async getAlbumOrder(albumId: string, userId: string): Promise<any> {
    const orderRes = await query(
      'SELECT * FROM public.orders WHERE album_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
      [albumId, userId]
    )
    return orderRes.rows[0] ?? null
  },

  /**
   * Verifies Razorpay payment signature and marks order as paid
   */
  async verifyOrderPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string
  ): Promise<any> {
    const orderRes = await query('SELECT * FROM public.orders WHERE id = $1', [orderId])
    const order = orderRes.rows[0]
    if (!order) {
      throw new Error('Order not found.')
    }

    // Only the buyer may settle their own order.
    if (order.user_id !== userId) {
      throw new Error('Not authorized to verify this order.')
    }

    // The Razorpay order id must be the one this server generated for this
    // order — never the one the client claims — otherwise anyone could pass a
    // fabricated "order_mock_..." id to skip signature verification.
    if (order.razorpay_order_id !== razorpayOrderId) {
      throw new Error('Payment reference does not match this order.')
    }

    if (order.payment_status === 'paid') {
      return order
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
    const gatewayConfigured = Boolean(secret) && keyId !== 'rzp_test_mock'
    // A mock order is one this server itself created in mock mode; it is
    // decided by stored state, not by anything in the request body.
    const isMock = String(order.razorpay_order_id || '').startsWith('order_mock_')

    if (!isMock) {
      if (!gatewayConfigured) {
        throw new Error('Payment gateway is not configured on this server.')
      }

      const body = `${razorpayOrderId}|${razorpayPaymentId}`
      const expectedSignature = createHmac('sha256', secret as string)
        .update(body)
        .digest('hex')

      const expectedBuffer = Buffer.from(expectedSignature)
      const providedBuffer = Buffer.from(String(razorpaySignature || ''))

      if (
        expectedBuffer.length !== providedBuffer.length ||
        !timingSafeEqual(expectedBuffer, providedBuffer)
      ) {
        throw new Error('Payment signature verification failed.')
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Refuse to settle unpaid mock orders on a production deployment.
      throw new Error('Payment gateway is not configured on this server.')
    }

    const updateRes = await query(
      `UPDATE public.orders
       SET payment_status = 'paid',
           tracking_status = 'order placed',
           razorpay_payment_id = $2,
           razorpay_signature = $3,
           amount_paid = total_price,
           updated_at = NOW()
       WHERE id = $1 AND payment_status <> 'paid'
       RETURNING *`,
      [orderId, razorpayPaymentId, razorpaySignature]
    )
    const updatedOrder = updateRes.rows[0]

    if (!updatedOrder) {
      // Another concurrent request already settled it.
      const current = await query('SELECT * FROM public.orders WHERE id = $1', [orderId])
      return current.rows[0]
    }

    // Notify User: Order Placed
    await notificationService.sendNotification(
      updatedOrder.user_id,
      'system',
      'Order Placed Successfully',
      `Your print order #${orderId} has been placed successfully. It is now awaiting artist review.`
    ).catch(e => console.error('Failed to send order placed notification:', e))

    return updatedOrder
  },

  /**
   * Live progress of the print PDF export for one order.
   *
   * Returns null when nothing has been queued yet (the order is still awaiting
   * artist review), which the UI shows as "not started" rather than an error.
   */
  async getPrintJobStatus(orderId: string, userId: string): Promise<any | null> {
    const orderRes = await query('SELECT user_id FROM public.orders WHERE id = $1', [orderId])
    const order = orderRes.rows[0]
    if (!order) {
      throw new Error('Order not found.')
    }

    if (order.user_id !== userId) {
      // Admins fulfil other people's orders, so they may read any job.
      const adminRes = await query(
        "SELECT 1 FROM public.profiles WHERE id = $1 AND role = 'admin'",
        [userId]
      )
      if (adminRes.rowCount === 0) {
        throw new Error('Not authorized to view this print job.')
      }
    }

    const jobRes = await query(
      `SELECT id, status, progress_stage, progress_current, progress_total,
              progress_message, progress_updated_at, queued_at, started_at,
              completed_at, error_message, output_pdf_path, preflight_report
       FROM public.print_jobs
       WHERE order_id = $1
       ORDER BY queued_at DESC
       LIMIT 1`,
      [orderId]
    )

    const job = jobRes.rows[0]
    if (!job) return null

    const total = job.progress_total || 0
    const current = job.progress_current || 0

    return {
      ...job,
      // Rendering is the long phase; treat the tail phases as the last 10% so
      // the bar keeps moving through compile and upload instead of sitting at
      // 100% while Ghostscript runs.
      percent:
        job.progress_stage === 'completed'
          ? 100
          : total > 0
          ? Math.min(90, Math.round((current / total) * 90)) +
            (job.progress_stage === 'compiling' ? 4 : job.progress_stage === 'uploading' ? 7 : 0)
          : 0
    }
  },

  /**
   * Gets all orders created by a particular user
   */
  async getUserOrders(userId: string): Promise<any[]> {
    const ordersRes = await query(
      `SELECT o.*, COALESCE(a.title, 'Polaroid Prints') as album_title, ph.blob_url as cover_image_url
       FROM public.orders o
       LEFT JOIN public.albums a ON o.album_id = a.id
       LEFT JOIN public.photos ph ON a.cover_photo_id = ph.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )
    return ordersRes.rows.map(order => {
      if (!order.cover_image_url && order.product_type === 'polaroid' && order.metadata) {
        try {
          const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata
          const images = meta?.polaroidDetails?.images
          if (Array.isArray(images) && images.length > 0) {
            return { ...order, cover_image_url: images[0] }
          }
        } catch (e) {
          console.error('Error parsing order metadata cover fallback:', e)
        }
      }
      return order
    })
  }
}
