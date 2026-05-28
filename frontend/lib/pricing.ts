// ─── CANONICAL PRICING ────────────────────────────────────────────────────────

export const UNIT_PRICE_CENTS: Record<'softcover' | 'hardcover', number> = {
  softcover: 89900,  // Rs. 899
  hardcover: 149900, // Rs. 1,499
}

export const PRODUCT_LABELS: Record<'softcover' | 'hardcover', string> = {
  softcover: 'Press',
  hardcover: 'Folio',
}

export const SIZE_LABELS: Record<'small' | 'large', string> = {
  small: 'Small (15×15 cm)',
  large: 'Large (30×30 cm)',
}

export const MAX_PAGES: Record<'softcover' | 'hardcover', number> = {
  softcover: 80,
  hardcover: 120,
}

export const MIN_PAGES = 24

// ─── PURE COMPUTATION ─────────────────────────────────────────────────────────

export function computePriceCents(
  productType: 'softcover' | 'hardcover',
  quantity: number,
): number {
  return UNIT_PRICE_CENTS[productType] * quantity
}

export function formatPrice(cents: number): string {
  return `Rs. ${(cents / 100).toLocaleString('en-IN')}`
}

// ─── PURE VALIDATORS ──────────────────────────────────────────────────────────

export function validateQuantity(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 10
}

export function isPageCountValid(
  productType: 'softcover' | 'hardcover',
  pageCount: number,
): boolean {
  return pageCount <= MAX_PAGES[productType]
}

export function validatePostalCode(s: string): boolean {
  return /^[a-zA-Z0-9]{4,10}$/.test(s)
}

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export function validateShippingAddress(addr: ShippingAddress): boolean {
  const required = [
    addr.fullName,
    addr.addressLine1,
    addr.city,
    addr.postalCode,
    addr.country,
  ]
  return required.every((f) => f.trim().length > 0)
}

export function getShippingAddressErrors(
  addr: ShippingAddress,
): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {}
  if (!addr.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!addr.addressLine1.trim()) errors.addressLine1 = 'Address is required.'
  if (!addr.city.trim()) errors.city = 'City is required.'
  if (!addr.state.trim()) errors.state = 'State is required.'
  if (!addr.postalCode.trim()) {
    errors.postalCode = 'Postal code is required.'
  } else if (!validatePostalCode(addr.postalCode)) {
    errors.postalCode = 'Enter a valid postal code (4–10 alphanumeric characters).'
  }
  if (!addr.country.trim()) errors.country = 'Country is required.'
  return errors
}

// ─── ORDER STATUS LABELS ──────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered'

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Order placed',
    paid: 'Payment confirmed',
    printing: 'Being printed',
    shipped: 'On its way',
    delivered: 'Delivered',
  }
  return labels[status]
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'text-muted-foreground',
    paid: 'text-secondary',
    printing: 'text-secondary',
    shipped: 'text-primary',
    delivered: 'text-secondary',
  }
  return colors[status]
}
