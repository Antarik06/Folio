import { query } from '../db'
import { notificationService } from './notificationService'

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
  },

  /**
   * List all registered artists
   */
  async listArtists(): Promise<any[]> {
    const res = await query(
      `SELECT a.*, p.email, p.full_name 
       FROM public.artists a
       JOIN public.profiles p ON a.user_id = p.id
       ORDER BY p.full_name ASC`
    )
    return res.rows
  },

  /**
   * Assign/Reassign an artist to an order
   */
  async assignArtistToOrder(orderId: string, artistId: string | null): Promise<any> {
    // 1. Fetch current artist_id
    const currentRes = await query('SELECT artist_id FROM public.orders WHERE id = $1', [orderId])
    if (currentRes.rowCount === 0) {
      throw new Error('Order not found.')
    }
    const oldArtistId = currentRes.rows[0].artist_id

    // 2. Perform update
    const res = await query(
      `UPDATE public.orders
       SET artist_id = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId, artistId]
    )

    // 3. Update workload counts if artist changed
    if (oldArtistId !== artistId) {
      if (oldArtistId) {
        await query(
          'UPDATE public.artists SET current_order_count = GREATEST(0, current_order_count - 1) WHERE user_id = $1',
          [oldArtistId]
        )
      }
      if (artistId) {
        await query(
          'UPDATE public.artists SET current_order_count = current_order_count + 1 WHERE user_id = $1',
          [artistId]
        )
        // Send notification to the new artist
        await notificationService.sendNotification(
          artistId,
          'artist_assigned',
          'New Order Assigned',
          `You have been assigned to review the layout for order #${orderId}.`
        ).catch(e => console.error('Failed to send assignment notification:', e))
      }
    }

    return res.rows[0]
  },

  /**
   * Assign/Reassign an artist to a premium concierge project
   */
  async assignArtistToPremiumProject(projectId: string, artistId: string | null): Promise<any> {
    // 1. Fetch current editor_id
    const currentRes = await query('SELECT editor_id FROM public.premium_projects WHERE id = $1', [projectId])
    if (currentRes.rowCount === 0) {
      throw new Error('Premium project not found.')
    }
    const oldEditorId = currentRes.rows[0].editor_id

    // 2. Perform update
    const res = await query(
      `UPDATE public.premium_projects
       SET editor_id = $2, 
           status = COALESCE(
             CASE WHEN $2 IS NOT NULL AND status = 'briefing-received' THEN 'editor-assigned'::text ELSE status END,
             status
           ),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [projectId, artistId]
    )

    // 3. Update workload counts if editor changed
    if (oldEditorId !== artistId) {
      if (oldEditorId) {
        await query(
          'UPDATE public.artists SET current_order_count = GREATEST(0, current_order_count - 1) WHERE user_id = $1',
          [oldEditorId]
        )
      }
      if (artistId) {
        await query(
          'UPDATE public.artists SET current_order_count = current_order_count + 1 WHERE user_id = $1',
          [artistId]
        )
        // Send notification to the new artist
        await notificationService.sendNotification(
          artistId,
          'artist_assigned',
          'Concierge Project Assigned',
          `You have been assigned to Concierge design project #${projectId}.`
        ).catch(e => console.error('Failed to send concierge assignment notification:', e))
      }
    }

    return res.rows[0]
  }
}
