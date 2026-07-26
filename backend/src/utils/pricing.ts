/**
 * Shipping-address validation helpers.
 *
 * This module previously also carried hardcoded price, page-limit and copy-limit
 * constants (UNIT_PRICE_CENTS, MAX_PAGES, MIN_PAGES, computePriceCents,
 * formatPrice, validateQuantity, isPageCountValid, getShippingAddressErrors).
 * All of those values are configured at runtime in public.system_settings and
 * read by orderService, so the constants were unreferenced duplicates that only
 * invited someone to price an order from stale numbers. They have been removed.
 */

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export function validatePostalCode(s: string): boolean {
  return /^[a-zA-Z0-9]{4,10}$/.test(s)
}

export function validateShippingAddress(addr: ShippingAddress): boolean {
  const required = [
    addr.fullName,
    addr.addressLine1,
    addr.city,
    addr.postalCode,
    addr.country,
    addr.phone,
  ]
  return required.every((f) => f && f.trim().length > 0)
}
