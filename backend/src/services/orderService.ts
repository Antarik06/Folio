import { query } from '../db'
import { computePriceCents, isPageCountValid, validateQuantity, validatePostalCode, validateShippingAddress } from '../utils/pricing'
import { razorpay } from '../utils/razorpay'
import { v4 as uuidv4 } from 'uuid'

export const orderService = {
  /**
   * Validates details and creates a print book order row.
   */
  async createOrder(input: {
    albumId: string
    productType: 'softcover' | 'hardcover'
    size: 'small' | 'large'
    quantity: number
    shippingAddress: any
  }, userId: string): Promise<any> {
    // 1. Verify album ownership
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

    // 2. Validate quantity
    if (!validateQuantity(input.quantity)) {
      throw new Error('Quantity must be between 1 and 10.')
    }

    // 3. Validate shipping details
    if (!validateShippingAddress(input.shippingAddress)) {
      throw new Error('Please fill in all required shipping fields.')
    }

    if (!validatePostalCode(input.shippingAddress.postalCode)) {
      throw new Error('Enter a valid postal code (4–10 alphanumeric characters).')
    }

    // 4. Fetch page count
    let pageCount = 0
    
    // First try album_pages
    const pagesCountRes = await query(
      'SELECT COUNT(*)::int as count FROM public.album_pages WHERE album_id = $1',
      [input.albumId]
    )
    const albumPagesCount = pagesCountRes.rows[0]?.count

    if (albumPagesCount && albumPagesCount > 0) {
      pageCount = albumPagesCount
    } else {
      // Fallback 1: check theme_config spreads
      const themeConfig = album.theme_config
      if (themeConfig && typeof themeConfig === 'object' && Array.isArray(themeConfig.spreads)) {
        pageCount = themeConfig.spreads.length
      } else {
        // Fallback 2: check layout_data spreads
        const layoutData = album.layout_data
        if (layoutData && typeof layoutData === 'object' && Array.isArray(layoutData.spreads)) {
          pageCount = layoutData.spreads.length
        }
      }
    }

    // Validate page count limits
    if (!isPageCountValid(input.productType, pageCount)) {
      throw new Error(`This album has ${pageCount} pages, which exceeds the ${input.productType} limit.`)
    }

    // 5. Compute server-side price
    const priceCents = computePriceCents(input.productType, input.quantity)

    // Match productType enum in DB schema:
    // Schema expects 'softcover_small', 'softcover_large', 'hardcover_small', 'hardcover_large', etc.
    const dbProductType = `${input.productType}_${input.size}`

    // Create Razorpay Order
    let razorpayOrderId = `order_mock_${uuidv4().substring(0, 8)}`
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (keyId !== 'rzp_test_mock' && keySecret) {
      try {
        const rpOrder = await razorpay.orders.create({
          amount: priceCents, // Price is already in paise/cents
          currency: 'INR',
          receipt: `rcpt_${uuidv4().substring(0, 8)}`
        })
        razorpayOrderId = rpOrder.id
      } catch (err) {
        console.error('Razorpay Order Creation Error:', err)
        throw new Error('Failed to create payment transaction with Razorpay.')
      }
    }

    // 6. Insert order
    const insertRes = await query(
      `INSERT INTO public.orders 
       (user_id, album_id, product_type, quantity, unit_price, total_price, currency, payment_status, shipping_address, shipping_status, razorpay_order_id, tracking_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        input.albumId,
        dbProductType,
        input.quantity,
        computePriceCents(input.productType, 1),
        priceCents,
        'inr',
        'pending',
        JSON.stringify(input.shippingAddress),
        'pending',
        razorpayOrderId,
        'order placed'
      ]
    )
    const order = insertRes.rows[0]

    // 7. Update album status to 'ordered'
    await query(
      "UPDATE public.albums SET status = 'ordered', updated_at = NOW() WHERE id = $1",
      [input.albumId]
    )

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
      `SELECT o.*, a.title as album_title, ph.blob_url as cover_image_url
       FROM public.orders o
       LEFT JOIN public.albums a ON o.album_id = a.id
       LEFT JOIN public.photos ph ON a.cover_photo_id = ph.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )
    return ordersRes.rows
  }
}
