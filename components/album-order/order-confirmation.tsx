'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft, Package, Printer, Truck, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRODUCT_LABELS, SIZE_LABELS, formatPrice } from '@/lib/pricing'
import type { ShippingAddress } from '@/lib/pricing'
import type { Order } from '@/lib/types/database'

interface OrderConfirmationProps {
  order: Order
  albumTitle: string
  shippingAddress: ShippingAddress
}

const TIMELINE_STEPS = [
  {
    key: 'placed',
    label: 'Order placed',
    description: "We\u2019ve received your order",
    icon: CheckCircle2,
    active: true,
  },
  {
    key: 'printing',
    label: 'Being printed',
    description: 'Your album is in production',
    icon: Printer,
    active: false,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'On its way to you',
    icon: Truck,
    active: false,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your album!',
    icon: MapPin,
    active: false,
  },
]

export function OrderConfirmation({
  order,
  albumTitle,
  shippingAddress,
}: OrderConfirmationProps) {
  const productType = order.product_type as 'softcover' | 'hardcover'
  const size = order.size as 'small' | 'large'

  return (
    <div className="relative min-h-[70vh] py-16 px-6 confirmation-enter overflow-hidden">
      {/* Decorative floating dots */}
      <div className="confirmation-dot" style={{ top: '12%', left: '15%', animationDelay: '0s' }} />
      <div
        className="confirmation-dot"
        style={{ top: '8%', right: '20%', animationDelay: '0.8s' }}
      />
      <div
        className="confirmation-dot"
        style={{ top: '25%', left: '8%', animationDelay: '1.6s' }}
      />
      <div
        className="confirmation-dot"
        style={{ bottom: '20%', right: '12%', animationDelay: '2.2s' }}
      />
      <div
        className="confirmation-dot"
        style={{ bottom: '15%', left: '22%', animationDelay: '0.5s' }}
      />
      <div
        className="confirmation-dot"
        style={{ top: '40%', right: '8%', animationDelay: '1.2s' }}
      />

      <div className="relative z-10 max-w-xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-secondary" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4 leading-tight">
            Your order is placed.
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            We've received your order for{' '}
            <span className="text-foreground font-medium">{albumTitle}</span>. We'll be in touch to
            confirm the details and arrange delivery.
          </p>
        </div>

        {/* Order details card */}
        <div className="rounded-lg border border-linen bg-card overflow-hidden shadow-sm mb-10">
          {/* Order ID */}
          <div className="px-6 py-4 border-b border-linen bg-muted/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Order reference
            </p>
            <p className="font-mono text-sm text-foreground">
              {order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Product details */}
          <div className="px-6 py-4 border-b border-linen space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Format</span>
              <span className="text-foreground font-medium">{PRODUCT_LABELS[productType]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Size</span>
              <span className="text-foreground font-medium">{SIZE_LABELS[size]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="text-foreground font-medium">{order.quantity}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-linen">
              <span className="text-muted-foreground">Total</span>
              <span className="font-serif text-xl text-foreground">
                {formatPrice(order.price_cents)}
              </span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="px-6 py-4 border-b border-linen">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ships to</p>
            <div className="space-y-0.5 text-sm text-foreground">
              <p>{shippingAddress.fullName}</p>
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

          {/* Estimated timeline */}
          <div className="px-6 py-4 flex items-start gap-3">
            <Package className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Estimated delivery</p>
              <p className="text-sm text-muted-foreground">
                7–14 business days after confirmation
              </p>
            </div>
          </div>
        </div>

        {/* Order timeline */}
        <div className="rounded-lg border border-linen bg-card overflow-hidden shadow-sm mb-10 px-6 py-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-5">
            What happens next
          </p>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, index) => {
              const Icon = step.icon
              const isLast = index === TIMELINE_STEPS.length - 1

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.active
                          ? 'bg-secondary text-secondary-foreground'
                          : 'border-2 border-linen bg-card text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-[2px] h-8 my-1 ${
                          step.active ? 'bg-secondary/30' : 'bg-linen'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4 pt-1">
                    <p
                      className={`text-sm font-medium ${
                        step.active ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
