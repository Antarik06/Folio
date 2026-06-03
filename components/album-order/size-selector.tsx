'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { SIZE_LABELS } from '@/lib/pricing'

interface SizeSelectorProps {
  value: 'small' | 'large'
  onChange: (value: 'small' | 'large') => void
  disabled?: boolean
}

export function SizeSelector({ value, onChange, disabled = false }: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">Size</label>
      <div className="grid grid-cols-2 gap-3">
        {(['small', 'large'] as const).map((size) => {
          const isSelected = value === size

          return (
            <button
              key={size}
              type="button"
              onClick={() => !disabled && onChange(size)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 text-center transition-all
                ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-card'
                    : 'border-border hover:border-primary/50 bg-card'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}

              <p className="text-sm font-medium text-foreground">{SIZE_LABELS[size]}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
