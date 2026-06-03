'use client'

import React from 'react'
import { Check, BookOpen } from 'lucide-react'
import { PRODUCT_LABELS, UNIT_PRICE_CENTS, MAX_PAGES, MIN_PAGES, formatPrice } from '@/lib/pricing'

interface ProductSelectorProps {
  value: 'softcover' | 'hardcover'
  onChange: (value: 'softcover' | 'hardcover') => void
  disabled?: boolean
}

const PRODUCT_DETAILS = {
  softcover: {
    label: PRODUCT_LABELS.softcover,
    price: formatPrice(UNIT_PRICE_CENTS.softcover),
    paper: 'Premium matte paper',
    binding: 'Perfect binding',
    pageRange: `${MIN_PAGES}–${MAX_PAGES.softcover} pages`,
    description: 'A beautiful, lightweight book perfect for everyday memories.',
  },
  hardcover: {
    label: PRODUCT_LABELS.hardcover,
    price: formatPrice(UNIT_PRICE_CENTS.hardcover),
    paper: 'Lustre photo paper',
    binding: 'Layflat hardcover',
    pageRange: `${MIN_PAGES}–${MAX_PAGES.hardcover} pages`,
    description: 'Premium quality with lay-flat pages — our finest offering.',
  },
} as const

export function ProductSelector({ value, onChange, disabled = false }: ProductSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">Product Type</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['softcover', 'hardcover'] as const).map((type) => {
          const details = PRODUCT_DETAILS[type]
          const isSelected = value === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => !disabled && onChange(type)}
              disabled={disabled}
              className={`
                group relative p-5 rounded-lg border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-card shadow-sm'
                    : 'border-border hover:border-primary/40 hover:shadow-sm bg-card'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-3">
                {/* Book icon + label */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-foreground mb-0.5">{details.label}</h3>
                    <p className="text-lg font-medium text-primary">{details.price} / book</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed pl-[52px]">
                  {details.description}
                </p>

                {/* Specs */}
                <div className="space-y-1 text-sm text-muted-foreground pl-[52px] pt-1 border-t border-linen">
                  <p className="pt-2">{details.paper}</p>
                  <p>{details.binding}</p>
                  <p className="font-medium text-foreground/80">{details.pageRange}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
