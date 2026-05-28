'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ShippingAddress } from '@/lib/pricing'

interface ShippingFormProps {
  value: ShippingAddress
  onChange: (value: ShippingAddress) => void
  errors?: Partial<Record<keyof ShippingAddress, string>>
  disabled?: boolean
}

export function ShippingForm({ value, onChange, errors = {}, disabled = false }: ShippingFormProps) {
  const handleFieldChange = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-6" id="shipping-form">
      <div className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            value={value.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.fullName}
            placeholder="John Doe"
            className={errors.fullName ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive step-fade-in">{errors.fullName}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2">
          <Label htmlFor="addressLine1" className="text-sm font-medium">
            Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="addressLine1"
            type="text"
            value={value.addressLine1}
            onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.addressLine1}
            placeholder="123 Main Street"
            className={errors.addressLine1 ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.addressLine1 && (
            <p className="text-sm text-destructive step-fade-in">{errors.addressLine1}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <Label htmlFor="addressLine2" className="text-sm font-medium text-muted-foreground">
            Address Line 2 <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Input
            id="addressLine2"
            type="text"
            value={value.addressLine2}
            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            disabled={disabled}
            placeholder="Apartment, suite, floor, etc."
          />
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              type="text"
              value={value.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              disabled={disabled}
              aria-invalid={!!errors.city}
              placeholder="Mumbai"
              className={errors.city ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.city && (
              <p className="text-sm text-destructive step-fade-in">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State / Province <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              type="text"
              value={value.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              disabled={disabled}
              aria-invalid={!!errors.state}
              placeholder="Maharashtra"
              className={errors.state ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.state && (
              <p className="text-sm text-destructive step-fade-in">{errors.state}</p>
            )}
          </div>
        </div>

        {/* Postal Code and Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-sm font-medium">
              Postal Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postalCode"
              type="text"
              value={value.postalCode}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              disabled={disabled}
              aria-invalid={!!errors.postalCode}
              placeholder="400001"
              className={errors.postalCode ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.postalCode && (
              <p className="text-sm text-destructive step-fade-in">{errors.postalCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              type="text"
              value={value.country}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              disabled={disabled}
              aria-invalid={!!errors.country}
              placeholder="India"
              className={errors.country ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.country && (
              <p className="text-sm text-destructive step-fade-in">{errors.country}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
