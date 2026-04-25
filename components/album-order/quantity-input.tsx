'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}: QuantityInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">Quantity</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-10 w-10 rounded-lg border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          className="h-10 w-20 text-center rounded-lg border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="h-10 w-10 rounded-lg border border-input bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>

        <span className="text-sm text-muted-foreground ml-2">
          ({min}–{max} books)
        </span>
      </div>
    </div>
  )
}
