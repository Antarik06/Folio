'use client'

import React from 'react'
import { ExternalLink, CheckCircle2, Truck, Printer, Clock } from 'lucide-react'
import { PRODUCT_LABELS, SIZE_LABELS, formatPrice, getStatusLabel, getStatusColor } from '@/lib/pricing'
import type { OrderStatus } from '@/lib/pricing'
import type { Order } from '@/lib/types/database'

interface OrderHistoryProps {
  order: Order
}

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle2 className="w-4 h-4 text-secondary" />
    case 'shipped':
      return <Truck className="w-4 h-4 text-primary" />
    case 'printing':
      return <Printer className="w-4 h-4 text-secondary" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colorMap: Record<OrderStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    paid: 'bg-secondary/15 text-secondary',
    printing: 'bg-secondary/15 text-secondary',
    shipped: 'bg-primary/15 text-primary',
    delivered: 'bg-secondary/15 text-secondary',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider ${colorMap[status]}`}
    >
      <StatusIcon status={status} />
      {getStatusLabel(status)}
    </span>
  )
}

export function OrderHistory({ order }: OrderHistoryProps) {
  const productType = order.product_type as 'softcover' | 'hardcover'
  const size = order.size as 'small' | 'large'
  const status = order.status as OrderStatus

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-linen bg-card overflow-hidden shadow-sm mb-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-linen flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Existing order</p>
          <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Details */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-linen">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Format</p>
          <p className="text-sm font-medium text-foreground">{PRODUCT_LABELS[productType]}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Size</p>
          <p className="text-sm font-medium text-foreground">{SIZE_LABELS[size]}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Quantity</p>
          <p className="text-sm font-medium text-foreground">{order.quantity}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total</p>
          <p className="font-serif text-lg text-foreground">{formatPrice(order.price_cents)}</p>
        </div>
      </div>

      {/* Date + tracking */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">Ordered on {orderDate}</p>

        {order.tracking_number && (
          <a
            href={`https://www.indiapost.gov.in/vas/pages/trackconsignment.aspx?consignmentno=${order.tracking_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Track shipment: {order.tracking_number}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
