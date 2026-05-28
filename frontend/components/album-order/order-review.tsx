'use client'

import React from 'react'
import { MapPin, Package, Ruler, Hash, Pencil } from 'lucide-react'
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

interface OrderReviewProps {
  config: OrderConfig
  shippingAddress: ShippingAddress
  albumTitle: string
  coverUrl: string | null
  isSubmitting: boolean
  onPlaceOrder: () => void
  onEditConfig: () => void
  onEditShipping: () => void
}

export function OrderReview({
  config,
  shippingAddress,
  albumTitle,
  coverUrl,
  isSubmitting,
  onPlaceOrder,
  onEditConfig,
  onEditShipping,
}: OrderReviewProps) {
  const unitPrice = UNIT_PRICE_CENTS[config.productType]
  const totalCents = computePriceCents(config.productType, config.quantity)

  return (
    <div className="step-enter">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Final step</p>
          <h2 className="font-serif text-3xl lg:text-4xl text-foreground leading-tight">
            Review your order
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Please confirm everything looks correct before placing your order.
          </p>
        </div>

        {/* Order card */}
        <div className="rounded-lg border border-linen bg-card overflow-hidden shadow-sm">
          {/* Album info */}
          <div className="px-6 py-5 border-b border-linen flex items-center gap-4">
            <div className="polaroid flex-shrink-0 w-14 h-14 overflow-hidden">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt={albumTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted/60 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    No art
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Album</p>
              <p className="font-serif text-lg text-foreground leading-tight truncate">
                {albumTitle}
              </p>
            </div>
          </div>

          {/* Product details */}
          <div className="px-6 py-5 border-b border-linen">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Product details
              </p>
              <button
                type="button"
                onClick={onEditConfig}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Format</span>
                <span className="ml-auto text-foreground font-medium">
                  {PRODUCT_LABELS[config.productType]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Size</span>
                <span className="ml-auto text-foreground font-medium">
                  {SIZE_LABELS[config.size]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Quantity</span>
                <span className="ml-auto text-foreground font-medium">
                  {config.quantity} {config.quantity === 1 ? 'book' : 'books'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="px-6 py-5 border-b border-linen">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Ships to</p>
              <button
                type="button"
                onClick={onEditShipping}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-sm text-foreground">
                <p className="font-medium">{shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && (
                  <p className="text-muted-foreground">{shippingAddress.addressLine2}</p>
                )}
                <p className="text-muted-foreground">
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground">{shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="px-6 py-5 border-b border-linen space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {PRODUCT_LABELS[config.productType]} × {config.quantity}
              </span>
              <span className="text-foreground">{formatPrice(unitPrice)} each</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span className="italic">Calculated at dispatch</span>
            </div>
            <div className="pt-3 border-t border-linen flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="font-serif text-3xl text-foreground">{formatPrice(totalCents)}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 py-6">
            <Button
              type="button"
              onClick={onPlaceOrder}
              disabled={isSubmitting}
              className="w-full py-6 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
    </div>
  )
}
