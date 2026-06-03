import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { settingsService } from '../services/settingsService'

export const settingsController = {
  /**
   * Helper to verify admin permissions
   */
  assertAdmin(req: AuthenticatedRequest, res: Response): boolean {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access Denied: Admin role required.' })
      return false
    }
    return true
  },

  /**
   * GET /api/settings
   * Public settings config fetcher
   */
  async getPublicSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const all = await settingsService.getAllSettings()
      // Return public subsets
      res.json({
        pricing: all.pricing || { softcover: 89900, hardcover: 149900, polaroid: 19900 },
        page_limits: all.page_limits || { softcover: 80, hardcover: 120 },
        min_pages: all.min_pages || 24,
        shipping_and_tax: all.shipping_and_tax || { tax_rate: 18, shipping_fee: 15000, free_shipping_threshold: 150000 },
        min_max_copies: all.min_max_copies || { min: 1, max: 10 }
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * GET /api/admin/settings
   */
  async getAdminSettings(req: AuthenticatedRequest, res: Response) {
    if (!settingsController.assertAdmin(req, res)) return
    try {
      const all = await settingsService.getAllSettings()
      res.json(all)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * PUT /api/admin/settings
   */
  async updateAdminSettings(req: AuthenticatedRequest, res: Response) {
    if (!settingsController.assertAdmin(req, res)) return
    try {
      const { settings } = req.body
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings body' })
      }

      for (const [key, val] of Object.entries(settings)) {
        await settingsService.updateSetting(key, val)
      }

      res.json({ success: true, message: 'Settings updated successfully' })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * GET /api/admin/promo-codes
   */
  async getPromoCodes(req: AuthenticatedRequest, res: Response) {
    if (!settingsController.assertAdmin(req, res)) return
    try {
      const promos = await settingsService.getPromoCodes()
      res.json(promos)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * POST /api/admin/promo-codes
   */
  async createPromoCode(req: AuthenticatedRequest, res: Response) {
    if (!settingsController.assertAdmin(req, res)) return
    try {
      const { code, discount_type, discount_value, min_order_value, expires_at } = req.body
      if (!code || !discount_type || discount_value === undefined) {
        return res.status(400).json({ error: 'Missing required promo code fields.' })
      }

      const newPromo = await settingsService.createPromoCode({
        code,
        discount_type,
        discount_value,
        min_order_value,
        expires_at
      })
      res.json(newPromo)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * DELETE /api/admin/promo-codes/:code
   */
  async deletePromoCode(req: AuthenticatedRequest, res: Response) {
    if (!settingsController.assertAdmin(req, res)) return
    try {
      const code = req.params.code
      const deleted = await settingsService.deletePromoCode(code)
      if (deleted) {
        res.json({ success: true, message: 'Promo code deleted.' })
      } else {
        res.status(404).json({ error: 'Promo code not found.' })
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },

  /**
   * GET /api/promo-codes/validate
   */
  async validatePromoCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, amount } = req.query
      if (!code) {
        return res.status(400).json({ error: 'Code is required.' })
      }
      const orderAmount = parseInt(amount as string) || 0
      const result = await settingsService.validatePromoCode(code as string, orderAmount)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}
