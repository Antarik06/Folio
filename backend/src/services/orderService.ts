import { query } from '../db'
import { isPageCountValid, validatePostalCode, validateShippingAddress } from '../utils/pricing'
import { razorpay } from '../utils/razorpay'
import { v4 as uuidv4 } from 'uuid'
import { settingsService } from './settingsService'

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

      // Validate page count limits dynamically
      const limitsRes = await query("SELECT value FROM public.system_settings WHERE key = 'page_limits'")
      let pageLimits = { softcover: 80, hardcover: 120 }
      if (limitsRes.rows.length > 0) {
        pageLimits = limitsRes.rows[0].value
      }
      const maxPages = pageLimits[input.productType] || (input.productType === 'softcover' ? 80 : 120)
      if (pageCount > maxPages) {
        throw new Error(`This album has ${pageCount} pages, which exceeds the limit of ${maxPages} pages.`)
      }
    }

    // 2. Validate quantity boundaries dynamically
    const copyLimitsRes = await query("SELECT value FROM public.system_settings WHERE key = 'min_max_copies'")
    let copyLimits = { min: 1, max: 10 }
    if (copyLimitsRes.rows.length > 0) {
      copyLimits = copyLimitsRes.rows[0].value
    }
    if (input.quantity < copyLimits.min || input.quantity > copyLimits.max) {
      throw new Error(`Quantity must be between ${copyLimits.min} and ${copyLimits.max}.`)
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
    const subtotal = unitPrice * input.quantity

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

    // 7. Insert order
    const insertRes = await query(
      `INSERT INTO public.orders 
       (user_id, album_id, product_type, quantity, unit_price, total_price, currency, payment_status, shipping_address, shipping_status, razorpay_order_id, tracking_status, metadata, promo_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId,
        input.albumId || null,
        dbProductType,
        input.quantity,
        unitPrice,
        grandTotal,
        'inr',
        'pending',
        JSON.stringify(input.shippingAddress),
        'pending',
        razorpayOrderId,
        'order placed',
        JSON.stringify(orderMetadata),
        input.promoCode || null
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
    razorpaySignature: string
  ): Promise<any> {
    const orderRes = await query('SELECT * FROM public.orders WHERE id = $1', [orderId])
    const order = orderRes.rows[0]
    if (!order) {
      throw new Error('Order not found.')
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
    const isMock = razorpayOrderId.startsWith('order_mock_') || keyId === 'rzp_test_mock' || !secret

    if (!isMock) {
      const crypto = require('crypto')
      const body = razorpayOrderId + '|' + razorpayPaymentId
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex')

      if (expectedSignature !== razorpaySignature) {
        throw new Error('Payment signature verification failed.')
      }
    }

    const updateRes = await query(
      `UPDATE public.orders 
       SET payment_status = 'paid', 
           tracking_status = 'order placed',
           razorpay_payment_id = $2,
           razorpay_signature = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId, razorpayPaymentId, razorpaySignature]
    )
    return updateRes.rows[0]
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
