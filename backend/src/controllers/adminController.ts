import { Response } from 'express'
import { sendError } from '../utils/httpError'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { adminService } from '../services/adminService'

export const adminController = {
  /**
   * Helper to assert that user is an admin
   */
  assertAdmin(req: AuthenticatedRequest, res: Response): boolean {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access Denied: Super Admin role required.' })
      return false
    }
    return true
  },

  /**
   * GET /api/admin/users
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const users = await adminService.getAllUsers()
      res.json(users)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/admin/users/:userId/events
   */
  async getUserEvents(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const userId = req.params.userId
      const events = await adminService.getUserEvents(userId)
      res.json(events)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/admin/events/:eventId/photos
   */
  async getEventPhotos(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const eventId = req.params.eventId
      const photos = await adminService.getEventPhotos(eventId)
      res.json(photos)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/admin/events/:eventId/albums
   */
  async getEventAlbums(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const eventId = req.params.eventId
      const albums = await adminService.getEventAlbums(eventId)
      res.json(albums)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/admin/orders
   */
  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const orders = await adminService.getAllOrders()
      res.json(orders)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * PATCH /api/admin/orders/:orderId/status
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const orderId = req.params.orderId
      const { status } = req.body
      if (!status) {
        return res.status(400).json({ error: 'Missing status in request body.' })
      }
      const updatedOrder = await adminService.updateOrderStatus(orderId, status)
      res.json({ success: true, order: updatedOrder })
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * PATCH /api/admin/users/:userId/status
   */
  async toggleUserBan(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const userId = req.params.userId
      const { isBanned } = req.body
      if (isBanned === undefined) {
        return res.status(400).json({ error: 'Missing isBanned in request body.' })
      }
      const updatedProfile = await adminService.toggleUserBan(userId, isBanned)
      res.json({ success: true, user: updatedProfile })
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * GET /api/admin/artists
   */
  async listArtists(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const artists = await adminService.listArtists()
      res.json(artists)
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * PATCH /api/admin/orders/:orderId/assign-artist
   */
  async assignArtistToOrder(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const orderId = req.params.orderId
      const { artistId } = req.body
      const updatedOrder = await adminService.assignArtistToOrder(orderId, artistId || null)
      res.json({ success: true, order: updatedOrder })
    } catch (error: any) {
      sendError(res, error)
    }
  },

  /**
   * PATCH /api/admin/premium/projects/:projectId/assign-artist
   */
  async assignArtistToPremiumProject(req: AuthenticatedRequest, res: Response) {
    if (!adminController.assertAdmin(req, res)) return
    try {
      const projectId = req.params.projectId
      const { artistId } = req.body
      const updatedProject = await adminService.assignArtistToPremiumProject(projectId, artistId || null)
      res.json({ success: true, project: updatedProject })
    } catch (error: any) {
      sendError(res, error)
    }
  }
}
