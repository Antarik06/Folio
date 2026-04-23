'use client'

import React, { useState, useCallback } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepIndicator, type WizardStep } from './step-indicator'
import { FlipbookPreview } from './flipbook-preview'
import { ProductSelector } from './product-selector'
import { SizeSelector } from './size-selector'
import { QuantityInput } from './quantity-input'
import { ShippingForm } from './shipping-form'
import { OrderReview } from './order-review'
import { OrderConfirmation } from './order-confirmation'
import { OrderHistory } from './order-history'
import { createOrder } from '@/lib/actions/orders'
import {
  MAX_PAGES,
  getShippingAddressErrors,
} from '@/lib/pricing'
import type { ShippingAddress } from '@/lib/pricing'
import type { FlipbookPageData } from '@/components/flipbook/types'
import type { Order } from '@/lib/types/database'

interface OrderPageClientProps {
  albumId: string
  albumTitle: string
  albumStatus: 'draft' | 'ready' | 'ordered'
  coverUrl: string | null
  pages: FlipbookPageData[]
  existingOrder: Order | null
}

interface OrderConfig {
  productType: 'softcover' | 'hardcover'
  size: 'small' | 'large'
  quantity: number
}

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
}

const WIZARD_STEPS: WizardStep[] = ['preview', 'configure', 'shipping', 'review']

export function OrderPageClient({
  albumId,
  albumTitle,
  albumStatus,
  coverUrl,
  pages,
  existingOrder,
}: OrderPageClientProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('preview')
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([])
  const [stepKey, setStepKey] = useState(0) // force re-mount for animation
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [config, setConfig] = useState<OrderConfig>({
    productType: 'softcover',
    size: 'small',
    quantity: 1,
  })
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const pageCount = pages.length
  const pageCountExceeded = pageCount > MAX_PAGES[config.productType]
  const hasNoPages = pageCount === 0
  const isDraft = albumStatus === 'draft'

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep)

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const goToStep = useCallback(
    (step: WizardStep) => {
      // Mark current step as completed if going forward
      const targetIndex = WIZARD_STEPS.indexOf(step)
      if (targetIndex > currentStepIndex) {
        setCompletedSteps((prev) => {
          const newCompleted = [...prev]
          if (!newCompleted.includes(currentStep)) {
            newCompleted.push(currentStep)
          }
          return newCompleted
        })
      }
      setStepKey((k) => k + 1)
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [currentStep, currentStepIndex],
  )

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < WIZARD_STEPS.length) {
      goToStep(WIZARD_STEPS[nextIndex])
    }
  }, [currentStepIndex, goToStep])

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStepKey((k) => k + 1)
      setCurrentStep(WIZARD_STEPS[prevIndex])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStepIndex])

  // ── Validation for each step ────────────────────────────────────────────────

  const validateShipping = useCallback((): boolean => {
    const errors = getShippingAddressErrors(shippingAddress)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return false
    }
    setFieldErrors({})
    return true
  }, [shippingAddress])

  const handleContinueFromShipping = useCallback(() => {
    if (validateShipping()) {
      goNext()
    }
  }, [validateShipping, goNext])

  // ── Place order ─────────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const result = await createOrder({
        albumId,
        productType: config.productType,
        size: config.size,
        quantity: config.quantity,
        shippingAddress,
      })

      if (result.error) {
        setServerError(result.error)
        return
      }

      setPlacedOrder(result.order ?? null)
      setIsConfirmed(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Confirmed screen ───────────────────────────────────────────────────────

  if (isConfirmed && placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        albumTitle={albumTitle}
        shippingAddress={shippingAddress}
      />
    )
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Page header */}
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Print order
        </p>
        <h1 className="font-serif text-3xl lg:text-4xl text-foreground leading-tight">
          {albumTitle}
        </h1>
      </div>

      {/* Existing order banner */}
      {existingOrder && !placedOrder && (
        <div className="mb-8">
          <OrderHistory order={existingOrder} />
        </div>
      )}

      {/* Draft warning */}
      {isDraft && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Album has unsaved changes</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              This album is still in draft. Consider finishing your edits before ordering.
            </p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-10 max-w-lg mx-auto">
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Step content */}
      <div key={stepKey} className="step-enter">
        {/* ──────── Step 1: Preview ──────── */}
        {currentStep === 'preview' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
                <Eye className="w-3.5 h-3.5" />
                Album Preview
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Take a moment to review your album before configuring your print order.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <FlipbookPreview title={albumTitle} pages={pages} />
            </div>

            {hasNoPages && (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-5 py-4 max-w-md mx-auto">
                <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your album has no pages yet. Add pages in the editor before placing an order.
                </p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                onClick={goNext}
                disabled={hasNoPages}
                className="px-8 py-5 text-sm font-medium gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to configure
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────── Step 2: Configure ──────── */}
        {currentStep === 'configure' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Configure
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl text-foreground">
                Choose your format
              </h2>
            </div>

            <div className="space-y-8">
              <ProductSelector
                value={config.productType}
                onChange={(productType) => setConfig((c) => ({ ...c, productType }))}
                disabled={isSubmitting}
              />

              <div className="border-t border-linen" />

              <SizeSelector
                value={config.size}
                onChange={(size) => setConfig((c) => ({ ...c, size }))}
                disabled={isSubmitting}
              />

              <div className="border-t border-linen" />

              <QuantityInput
                value={config.quantity}
                onChange={(quantity) => setConfig((c) => ({ ...c, quantity }))}
                disabled={isSubmitting}
              />

              {pageCountExceeded && (
                <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    Your album has <strong>{pageCount} pages</strong>, which exceeds the{' '}
                    <strong>{config.productType}</strong> limit of{' '}
                    <strong>{MAX_PAGES[config.productType]} pages</strong>. Please choose a
                    different format.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-linen">
              <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={goNext}
                disabled={pageCountExceeded || hasNoPages}
                className="px-8 py-5 text-sm font-medium gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to shipping
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────── Step 3: Shipping ──────── */}
        {currentStep === 'shipping' && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Shipping
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl text-foreground">
                Where should we deliver?
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                We currently ship within India. International shipping coming soon.
              </p>
            </div>

            <ShippingForm
              value={shippingAddress}
              onChange={setShippingAddress}
              errors={fieldErrors}
              disabled={isSubmitting}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-linen">
              <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleContinueFromShipping}
                className="px-8 py-5 text-sm font-medium gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Review order
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────── Step 4: Review & Order ──────── */}
        {currentStep === 'review' && (
          <div>
            {serverError && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 mb-6 max-w-2xl mx-auto">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <OrderReview
              config={config}
              shippingAddress={shippingAddress}
              albumTitle={albumTitle}
              coverUrl={coverUrl}
              isSubmitting={isSubmitting}
              onPlaceOrder={handlePlaceOrder}
              onEditConfig={() => goToStep('configure')}
              onEditShipping={() => goToStep('shipping')}
            />

            {/* Back button below the review card */}
            <div className="max-w-2xl mx-auto mt-6">
              <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to shipping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
