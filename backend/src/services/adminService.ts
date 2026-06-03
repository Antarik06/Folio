import { query } from '../db'

export const adminService = {
  /**
   * Get all registered users along with their counts of events, albums, and orders
   */
  async getAllUsers(): Promise<any[]> {
    const res = await query(
      `SELECT 
        p.id, 
        p.email, 
        p.full_name, 
        p.avatar_url,
        p.created_at,
        p.is_banned,
        COALESCE((SELECT COUNT(*)::int FROM public.events e WHERE e.host_id = p.id), 0) as event_count,
        COALESCE((SELECT COUNT(*)::int FROM public.albums a WHERE a.owner_id = p.id), 0) as album_count,
        COALESCE((SELECT COUNT(*)::int FROM public.orders o WHERE o.user_id = p.id), 0) as order_count
      FROM public.profiles p
      ORDER BY p.created_at DESC`
    )
    return res.rows
  },

  /**
   * Toggle a user's ban status (active vs banned)
   */
  async toggleUserBan(userId: string, isBanned: boolean): Promise<any> {
    const res = await query(
      `UPDATE public.profiles
       SET is_banned = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, isBanned]
    )
    if (res.rowCount === 0) {
      throw new Error('User not found.')
    }
    return res.rows[0]
  },

  /**
   * Get all events created by a particular user
   */
  async getUserEvents(userId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        e.*,
        COALESCE((SELECT COUNT(*)::int FROM public.photos p WHERE p.event_id = e.id), 0) as photo_count,
        COALESCE((SELECT COUNT(*)::int FROM public.albums a WHERE a.event_id = e.id), 0) as album_count
      FROM public.events e
      WHERE e.host_id = $1
      ORDER BY e.created_at DESC`,
      [userId]
    )
    return res.rows
  },

  /**
   * Get all photos inside a specific event
   */
  async getEventPhotos(eventId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM public.photos 
       WHERE event_id = $1 
       ORDER BY created_at DESC`,
      [eventId]
    )
    return res.rows
  },

  /**
   * Get all albums inside a specific event
   */
  async getEventAlbums(eventId: string): Promise<any[]> {
    const res = await query(
      `SELECT * FROM public.albums 
       WHERE event_id = $1 
       ORDER BY created_at DESC`,
      [eventId]
    )
    return res.rows
  },

  /**
   * Get all print orders in the system
   */
  async getAllOrders(): Promise<any[]> {
    const res = await query(
      `SELECT 
        o.*,
        COALESCE(a.title, 'Polaroid Prints') as album_title,
        p.email as user_email,
        p.full_name as user_full_name
      FROM public.orders o
      LEFT JOIN public.albums a ON o.album_id = a.id
      LEFT JOIN public.profiles p ON o.user_id = p.id
      ORDER BY o.created_at DESC`
    )
    return res.rows.map(order => {
      if (order.product_type === 'polaroid' && order.metadata) {
        try {
          const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata
          const images = meta?.polaroidDetails?.images
          if (Array.isArray(images) && images.length > 0) {
            return { ...order, cover_image_url: images[0] }
          }
        } catch (e) {
          console.error('Error parsing admin order metadata cover:', e)
        }
      }
      return order
    })
  },

  /**
   * Update the manual tracking progress of an order
   */
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const validStatuses = [
      'order placed',
      'reviewed by humans',
      'finalize design',
      'printed',
      'out for delivery',
      'order arrived'
    ]

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order tracking status: ${status}`)
    }

    const res = await query(
      `UPDATE public.orders
       SET tracking_status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId, status]
    )

    if (res.rowCount === 0) {
      throw new Error('Order not found.')
    }

    return res.rows[0]
  }
}
