'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PRODUCT_LABELS,
  SIZE_LABELS,
  UNIT_PRICE_CENTS,
  computePriceCents,
  formatPrice,
} from '@/lib/pricing'
import type { ShippingAddress } from '@/lib/pricing'

interface OrderConfig {
  productType: 'softcover' | 'hardcover'
  size: 'small' | 'large'
  quantity: number
}

interface OrderSummaryAlbum {
  title: string
  coverUrl: string | null
}

interface OrderSummaryProps {
  config: OrderConfig
  album: OrderSummaryAlbum
  shippingAddress?: ShippingAddress | null
  isSubmitting: boolean
  canSubmit: boolean
  onPlaceOrder: () => void
}

export function OrderSummary({
  config,
  album,
  shippingAddress,
  isSubmitting,
  canSubmit,
  onPlaceOrder,
}: OrderSummaryProps) {
  const unitPrice = UNIT_PRICE_CENTS[config.productType]
  const totalCents = computePriceCents(config.productType, config.quantity)
  const hasAddress =
    shippingAddress &&
    shippingAddress.fullName.trim() &&
    shippingAddress.addressLine1.trim() &&
    shippingAddress.city.trim()

  return (
    <div className="sticky top-20 space-y-0">
      <div className="rounded-lg border border-linen bg-card overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-linen">
          <h2 className="font-serif text-2xl text-foreground">Order Summary</h2>
        </div>

        {/* Album thumbnail */}
        <div className="px-6 py-5 border-b border-linen flex items-start gap-4">
          <div className="polaroid flex-shrink-0 w-16 h-16 overflow-hidden">
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/60 flex items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">No art</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Album</p>
            <p className="font-serif text-lg text-foreground leading-tight truncate">{album.title}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-6 py-5 space-y-3 border-b border-linen">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Format</span>
            <span className="text-foreground font-medium">{PRODUCT_LABELS[config.productType]}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Size</span>
            <span className="text-foreground font-medium">{SIZE_LABELS[config.size]}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="text-foreground font-medium">{config.quantity}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Unit price</span>
            <span className="text-foreground font-medium">{formatPrice(unitPrice)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="px-6 py-5 border-b border-linen">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Total</span>
            <span className="font-serif text-3xl text-foreground">{formatPrice(totalCents)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Shipping calculated at dispatch
          </p>
        </div>

        {/* Shipping address summary */}
        <div className="px-6 py-4 border-b border-linen">
          {hasAddress ? (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ships to</p>
              <p className="text-sm text-foreground">{shippingAddress!.fullName}</p>
              <p className="text-sm text-muted-foreground">{shippingAddress!.addressLine1}</p>
              {shippingAddress!.addressLine2 && (
                <p className="text-sm text-muted-foreground">{shippingAddress!.addressLine2}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {shippingAddress!.city}, {shippingAddress!.state} {shippingAddress!.postalCode}
              </p>
              <p className="text-sm text-muted-foreground">{shippingAddress!.country}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Enter a shipping address below
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 py-5">
          <Button
            type="button"
            onClick={onPlaceOrder}
            disabled={!canSubmit || isSubmitting}
            className="w-full py-6 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Placing order…
              </span>
            ) : (
              'Place order'
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            No payment required now — we'll be in touch to confirm.
          </p>
        </div>
      </div>
    </div>
  )
}
