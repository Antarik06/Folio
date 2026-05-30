import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { orderService } from '../services/orderService'
import { createOrderSchema } from '../schema/zod'

export const orderController = {
  /**
   * POST /api/orders
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const parsed = createOrderSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message })
      }

      const order = await orderService.createOrder(parsed.data, userId)
      res.status(201).json({ success: true, order })
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  },

  /**
   * GET /api/albums/:albumId/order
   */
  async getAlbumOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const albumId = req.params.albumId
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const order = await orderService.getAlbumOrder(albumId, userId)
      res.json(order)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/orders/verify
   */
  async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: 'Missing required verification fields.' })
      }

      const order = await orderService.verifyOrderPayment(
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )

      res.json({ success: true, order })
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  },

  /**
   * GET /api/orders
   */
  async getUserOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const orders = await orderService.getUserOrders(userId)
      res.json(orders)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
