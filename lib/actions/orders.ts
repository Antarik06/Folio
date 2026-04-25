'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  computePriceCents,
  isPageCountValid,
  validateQuantity,
  validatePostalCode,
  validateShippingAddress,
  getShippingAddressErrors,
  ShippingAddress,
} from '@/lib/pricing'
import type { Order } from '@/lib/types/database'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  albumId: string
  productType: 'softcover' | 'hardcover'
  size: 'small' | 'large'
  quantity: number
  shippingAddress: ShippingAddress
}

export type CreateOrderResult =
  | { order: Order; error?: never }
  | { error: string; order?: never }

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to place an order.' }

  // 2. Verify album ownership
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('id, owner_id, status, theme_config')
    .eq('id', input.albumId)
    .single()

  if (albumError || !album) return { error: 'Album not found.' }
  if (album.owner_id !== user.id) return { error: 'You do not own this album.' }

  // 3. Validate quantity
  if (!validateQuantity(input.quantity)) {
    return { error: 'Quantity must be between 1 and 10.' }
  }

  // 4. Validate productType
  if (input.productType !== 'softcover' && input.productType !== 'hardcover') {
    return { error: 'Invalid product type.' }
  }

  // 5. Validate size
  if (input.size !== 'small' && input.size !== 'large') {
    return { error: 'Invalid size.' }
  }

  // 6. Validate required shipping fields
  if (!validateShippingAddress(input.shippingAddress)) {
    const fieldErrors = getShippingAddressErrors(input.shippingAddress)
    const firstError = Object.values(fieldErrors)[0]
    return { error: firstError || 'Please fill in all required shipping fields.' }
  }

  // 7. Validate postal code
  if (!validatePostalCode(input.shippingAddress.postalCode)) {
    return { error: 'Enter a valid postal code (4–10 alphanumeric characters).' }
  }

  // 8. Fetch album page count — try multiple sources
  //    Albums store spreads in theme_config.spreads or as separate album_pages rows.
  //    We check both to be safe.
  let pageCount = 0

  // First: try album_pages table (the canonical source for page count)
  const { count: albumPagesCount } = await supabase
    .from('album_pages')
    .select('id', { count: 'exact', head: true })
    .eq('album_id', input.albumId)

  if (albumPagesCount !== null && albumPagesCount > 0) {
    pageCount = albumPagesCount
  } else {
    // Fallback: try theme_config.spreads (used by the album editor)
    const rawConfig = (album as Record<string, unknown>).theme_config as Record<string, unknown> | null
    if (rawConfig && Array.isArray(rawConfig.spreads)) {
      pageCount = rawConfig.spreads.length
    }
  }

  if (!isPageCountValid(input.productType, pageCount)) {
    return {
      error: `This album has ${pageCount} pages, which exceeds the ${input.productType} limit. Please choose a different format.`,
    }
  }

  // 9. Compute price_cents server-side (never trust client)
  const priceCents = computePriceCents(input.productType, input.quantity)

  // 10. Insert order row
  const { data: order, error: insertError } = await supabase
    .from('orders')
    .insert({
      album_id: input.albumId,
      user_id: user.id,
      product_type: input.productType,
      size: input.size,
      quantity: input.quantity,
      price_cents: priceCents,
      shipping_address: input.shippingAddress as any,
      stripe_payment_intent_id: null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (insertError || !order) {
    console.error('Order insert error:', insertError)
    return { error: 'Failed to place order. Please try again.' }
  }

  // 11. Update album status to 'ordered'
  await supabase
    .from('albums')
    .update({ status: 'ordered', updated_at: new Date().toISOString() })
    .eq('id', input.albumId)

  // 12. Revalidate relevant paths
  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard')

  return { order: order as Order }
}

// ─── GET ALBUM ORDER ──────────────────────────────────────────────────────────

export async function getAlbumOrder(albumId: string): Promise<Order | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (order as Order) ?? null
}
