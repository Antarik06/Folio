import { query } from '../db'

export const settingsService = {
  /**
   * Fetch a setting by key
   */
  async getSetting(key: string): Promise<any> {
    const res = await query('SELECT value FROM public.system_settings WHERE key = $1', [key])
    return res.rows[0]?.value ?? null
  },

  /**
   * Fetch all settings as a key-value object
   */
  async getAllSettings(): Promise<Record<string, any>> {
    const res = await query('SELECT key, value FROM public.system_settings')
    const settings: Record<string, any> = {}
    for (const row of res.rows) {
      settings[row.key] = row.value
    }
    return settings
  },

  /**
   * Update or insert a setting by key
   */
  async updateSetting(key: string, value: any): Promise<any> {
    const res = await query(
      `INSERT INTO public.system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    )
    return res.rows[0]?.value
  },

  /**
   * Get all promo codes
   */
  async getPromoCodes(): Promise<any[]> {
    const res = await query('SELECT * FROM public.promo_codes ORDER BY created_at DESC')
    return res.rows
  },

  /**
   * Create a new promo code
   */
  async createPromoCode(data: {
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    min_order_value?: number
    expires_at?: string | null
  }): Promise<any> {
    const cleanCode = data.code.toUpperCase().trim()
    const res = await query(
      `INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code)
       DO UPDATE SET discount_type = EXCLUDED.discount_type,
                     discount_value = EXCLUDED.discount_value,
                     min_order_value = EXCLUDED.min_order_value,
                     expires_at = EXCLUDED.expires_at,
                     is_active = TRUE,
                     updated_at = NOW()
       RETURNING *`,
      [
        cleanCode,
        data.discount_type,
        data.discount_value,
        data.min_order_value || 0,
        data.expires_at || null
      ]
    )
    return res.rows[0]
  },

  /**
   * Delete a promo code
   */
  async deletePromoCode(code: string): Promise<boolean> {
    const cleanCode = code.toUpperCase().trim()
    const res = await query('DELETE FROM public.promo_codes WHERE code = $1', [cleanCode])
    return (res.rowCount ?? 0) > 0
  },

  /**
   * Validate a promo code against an order total
   */
  async validatePromoCode(code: string, amount: number): Promise<{
    valid: boolean
    discountType?: 'percentage' | 'fixed'
    discountValue?: number
    message: string
  }> {
    const cleanCode = code.toUpperCase().trim()
    const res = await query('SELECT * FROM public.promo_codes WHERE code = $1', [cleanCode])
    const promo = res.rows[0]

    if (!promo) {
      return { valid: false, message: 'Invalid promo code.' }
    }

    if (!promo.is_active) {
      return { valid: false, message: 'This promo code is no longer active.' }
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return { valid: false, message: 'This promo code has expired.' }
    }

    if (amount < promo.min_order_value) {
      const minValRs = (promo.min_order_value / 100).toLocaleString('en-IN')
      return {
        valid: false,
        message: `This promo code requires a minimum order value of Rs. ${minValRs}.`
      }
    }

    return {
      valid: true,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      message: 'Promo code applied successfully!'
    }
  }
}
