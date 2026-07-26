// ─── DISPLAY LABELS ───────────────────────────────────────────────────────────
//
// Prices, page limits and copy limits are NOT defined here. They live in
// public.system_settings and are fetched per request, because that is the
// source the server prices an order from. Hardcoded copies of them used to sit
// in this file and were rendered on the product selector, so any price an admin
// changed in the dashboard was quoted wrongly at checkout.

export const PRODUCT_LABELS: Record<'softcover' | 'hardcover', string> = {
  softcover: 'Press',
  hardcover: 'Folio',
}

export const SIZE_LABELS: Record<'small' | 'large', string> = {
  small: 'Small (15×15 cm)',
  large: 'Large (30×30 cm)',
}

// ─── PURE COMPUTATION ─────────────────────────────────────────────────────────

export function formatPrice(cents: number): string {
  return `Rs. ${(cents / 100).toLocaleString('en-IN')}`
}

// ─── PURE VALIDATORS ──────────────────────────────────────────────────────────

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

/** Module-private: only getShippingAddressErrors needs it. */
function validatePostalCode(s: string): boolean {
  return /^[a-zA-Z0-9]{4,10}$/.test(s)
}

export function getShippingAddressErrors(
  addr: ShippingAddress,
): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {}
  if (!addr.fullName || !addr.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!addr.addressLine1 || !addr.addressLine1.trim()) errors.addressLine1 = 'Address is required.'
  if (!addr.city || !addr.city.trim()) errors.city = 'City is required.'
  if (!addr.state || !addr.state.trim()) errors.state = 'State is required.'
  if (!addr.phone || !addr.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!/^[+]?[0-9\s-]{10,15}$/.test(addr.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (10-15 digits).'
  }
  if (!addr.postalCode || !addr.postalCode.trim()) {
    errors.postalCode = 'Postal code is required.'
  } else if (!validatePostalCode(addr.postalCode)) {
    errors.postalCode = 'Enter a valid postal code (4–10 alphanumeric characters).'
  }
  if (!addr.country || !addr.country.trim()) errors.country = 'Country is required.'
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
