import { query } from '../db'
import { computePriceCents, isPageCountValid, validateQuantity, validatePostalCode, validateShippingAddress } from '../utils/pricing'

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
      'SELECT id, owner_id, status, theme_config, layout_data FROM public.albums WHERE id = $1',
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

    // 6. Insert order
    const insertRes = await query(
      `INSERT INTO public.orders 
       (user_id, album_id, product_type, quantity, unit_price, total_price, currency, payment_status, shipping_address, shipping_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        'pending'
      ]
    )
    const order = insertRes.rows[0]

    // 7. Update album status to 'ordered'
    await query(
      "UPDATE public.albums SET status = 'ordered', updated_at = NOW() WHERE id = $1",
      [input.albumId]
    )

    return order
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
  }
}
