'use server'

import { serverFetch } from '@/lib/api-client'

/**
 * Fetch public settings configuration (prices, tax, thresholds)
 */
export async function getSystemSettings() {
  try {
    return await serverFetch('/api/settings', null)
  } catch (error) {
    console.error('Error fetching public system settings:', error)
    return {
      pricing: { softcover: 89900, hardcover: 149900, polaroid: 19900 },
      page_limits: { softcover: 80, hardcover: 120 },
      min_pages: 24,
      shipping_and_tax: { tax_rate: 18, shipping_fee: 15000, free_shipping_threshold: 150000 },
      min_max_copies: { min: 1, max: 10 }
    }
  }
}

/**
 * Validate a promo code against checkout subtotal
 */
export async function validatePromoCode(code: string, amount: number) {
  try {
    return await serverFetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}&amount=${amount}`, null)
  } catch (error: any) {
    console.error('Promo code validation action failed:', error)
    return { valid: false, message: error.message || 'Validation service offline.' }
  }
}
