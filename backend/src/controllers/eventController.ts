import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { eventService } from '../services/eventService'
import { updateEventSettingsSchema } from '../schema/zod'

export const eventController = {
  /**
   * GET /api/events/:id/role
   */
  async getRole(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const roleInfo = await eventService.getUserEventRole(eventId, userId)
      res.json(roleInfo)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PUT /api/events/:id/settings
   */
  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const parsedBody = updateEventSettingsSchema.safeParse(req.body)
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.errors[0].message })
      }

      const event = await eventService.updateEventSettings(eventId, userId, parsedBody.data)
      res.json({ success: true, event })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/events/join
   */
  async join(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      const { inviteCode } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required.' })
      }

      const result = await eventService.joinEvent(inviteCode, userId)
      res.json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  },

  /**
   * GET /api/events/lookup
   */
  async lookup(req: AuthenticatedRequest, res: Response) {
    try {
      const code = req.query.code as string

      if (!code) {
        return res.status(400).json({ error: 'Code parameter is required.' })
      }

      const event = await eventService.getEventByInviteCode(code)
      if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
      }

      res.json(event)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/events/:id/collaborator-code
   */
  async generateCollabCode(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const code = await eventService.generateCollaboratorCode(eventId, userId)
      res.json({ success: true, code })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * DELETE /api/events/:id/guests/:guestId
   */
  async removeGuest(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const guestId = req.params.guestId
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await eventService.removeGuest(guestId, eventId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/events
   */
  async getMyEvents(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const events = await eventService.getEventsList(userId)
      res.json(events)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/events/:id
   */
  async getDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const details = await eventService.getEventDetails(eventId, userId)
      res.json(details)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/events
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const { title, description, eventDate, settings } = req.body
      if (!title) {
        return res.status(400).json({ error: 'Title is required.' })
      }

      const event = await eventService.createEvent({ title, description, eventDate, settings }, userId)
      res.status(201).json(event)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/events/dashboard
   */
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const dashboardData = await eventService.getDashboardData(userId)
      res.json(dashboardData)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * DELETE /api/events/:id
   */
  async deleteEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await eventService.deleteEvent(eventId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * PATCH /api/events/:id/guests/:guestId/role
   */
  async updateGuestRole(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const guestId = req.params.guestId
      const { role } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }
      if (role !== 'guest' && role !== 'collaborator') {
        return res.status(400).json({ error: 'Invalid role. Must be guest or collaborator.' })
      }

      const guest = await eventService.updateGuestRole(eventId, guestId, role, userId)
      res.json({ success: true, guest })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * POST /api/events/:id/folders
   */
  async createFolder(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const { name, parentId } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }
      if (!name) {
        return res.status(400).json({ error: 'Folder name is required.' })
      }

      const folder = await eventService.createFolder(eventId, parentId || null, name, userId)
      res.status(201).json({ success: true, folder })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * GET /api/events/:id/folders
   */
  async getFolders(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      const folders = await eventService.getEventFolders(eventId, userId)
      res.json(folders)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },

  /**
   * DELETE /api/events/:id/folders/:folderId
   */
  async deleteFolder(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params.id
      const folderId = req.params.folderId
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthenticated' })
      }

      await eventService.deleteFolder(folderId, eventId, userId)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
