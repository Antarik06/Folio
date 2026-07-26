'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Eye, CreditCard, MapPin, Check, Truck, ShieldCheck, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepIndicator, type WizardStep } from './step-indicator'
import { FlipbookPreview } from './flipbook-preview'
import { ProductSelector } from './product-selector'
import { SizeSelector } from './size-selector'
import { QuantityInput } from './quantity-input'
import { ShippingForm } from './shipping-form'
import { OrderConfirmation } from './order-confirmation'
import { OrderHistory } from './order-history'
import { createOrder, verifyPayment } from '@/lib/actions/orders'
import { getShippingAddressErrors, formatPrice } from '@/lib/pricing'
import type { ShippingAddress } from '@/lib/pricing'
import type { FlipbookPageData } from '@/components/flipbook/types'
import type { Order } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

interface OrderPageClientProps {
  albumId: string | null
  albumTitle: string
  albumStatus: 'draft' | 'ready' | 'ordered'
  coverUrl: string | null
  pages: FlipbookPageData[]
  existingOrder: Order | null
  systemSettings: any
  initialProductType?: 'softcover' | 'hardcover' | 'polaroid'
}

interface OrderConfig {
  productType: 'softcover' | 'hardcover' | 'polaroid'
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
  phone: '',
}

const WIZARD_STEPS: WizardStep[] = ['configure', 'shipping', 'review']

const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function OrderPageClient({
  albumId,
  albumTitle,
  albumStatus,
  coverUrl,
  pages,
  existingOrder,
  systemSettings,
  initialProductType = 'softcover',
}: OrderPageClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('configure')
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([])
  const [stepKey, setStepKey] = useState(0) // force re-mount for animation
  const [isConfirmed, setIsConfirmed] = useState(false)

  // 1. Core Config
  const [config, setConfig] = useState<OrderConfig>({
    productType: initialProductType,
    size: 'small',
    quantity: 1,
  })

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  // 2. Polaroid local state
  const [polaroids, setPolaroids] = useState<{ images: string[]; frame: string; quantities: number[] } | null>(null)
  const [polaroidCover, setPolaroidCover] = useState<string | null>(null)

  useEffect(() => {
    if (initialProductType === 'polaroid') {
      const saved = sessionStorage.getItem('polaroid-preview-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPolaroids(parsed)
          if (parsed.images && parsed.images.length > 0) {
            setPolaroidCover(parsed.images[0])
          }
        } catch (e) {
          console.error('Error parsing polaroid state:', e)
        }
      } else {
        // Fallback: If no polaroids, redirect back to studio
        router.push('/dashboard/polaroid')
      }
    }
  }, [initialProductType, router])

  // 3. Promo Codes state
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
  } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  // 4. Extract Dynamic Config Rules from Server settings
  const pricing = systemSettings?.pricing || { softcover: 89900, hardcover: 149900, polaroid: 19900 }
  const pageLimits = systemSettings?.page_limits || { softcover: 80, hardcover: 120 }
  const shipTax = systemSettings?.shipping_and_tax || { tax_rate: 18, shipping_fee: 15000, free_shipping_threshold: 150000 }
  const copyLimits = systemSettings?.min_max_copies || { min: 1, max: 10 }

  const unitPrice = pricing[config.productType] || (config.productType === 'softcover' ? 89900 : config.productType === 'hardcover' ? 149900 : 19900)

  // Calculations
  const totalPolaroidPieces = polaroids ? polaroids.quantities.reduce((s, q) => s + q, 0) : 0

  const subtotal = config.productType === 'polaroid'
    ? unitPrice * totalPolaroidPieces
    : unitPrice * config.quantity

  // Discount Calculation
  let discount = 0
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discount = Math.round(subtotal * appliedPromo.discountValue / 100)
    } else {
      discount = appliedPromo.discountValue
    }
    // Match the server, which clamps a fixed discount to the basket value.
    // Without this the summary could show a total the server never charges.
    discount = Math.min(discount, subtotal)
  }
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const shippingFee = discountedSubtotal >= shipTax.free_shipping_threshold ? 0 : shipTax.shipping_fee
  const taxableAmount = discountedSubtotal + shippingFee
  const taxAmount = Math.round(taxableAmount * (shipTax.tax_rate / 100))
  const grandTotal = taxableAmount + taxAmount

  const pageCount = pages.length
  const maxPages = pageLimits[config.productType] || 1000
  const pageCountExceeded = config.productType !== 'polaroid' && pageCount > maxPages
  const hasNoPages = config.productType !== 'polaroid' && pageCount === 0
  // Binderies enforce a minimum signature count; the server rejects orders
  // below it, so surface it here instead of failing at the payment step.
  const minPages = Number(systemSettings?.min_pages ?? 0)
  const belowMinPages =
    config.productType !== 'polaroid' && minPages > 0 && pageCount > 0 && pageCount < minPages
  const pageCountBlocked = pageCountExceeded || hasNoPages || belowMinPages
  const isDraft = albumStatus === 'draft'

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep)

  // ── Promo Code handler ──────────────────────────────────────────────────────

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return
    setPromoError(null)
    setPromoSuccess(null)
    setIsValidatingPromo(true)

    try {
      const { validatePromoCode } = await import('@/lib/actions/settings')
      const result = await validatePromoCode(promoCodeInput, subtotal)
      if (result.valid) {
        setAppliedPromo({
          code: promoCodeInput.toUpperCase().trim(),
          discountType: result.discountType,
          discountValue: result.discountValue,
        })
        setPromoSuccess(result.message)
      } else {
        setPromoError(result.message)
      }
    } catch (e) {
      setPromoError('Failed to apply promo code.')
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoSuccess(null)
    setPromoCodeInput('')
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const goToStep = useCallback(
    (step: WizardStep) => {
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
        albumId: albumId || undefined,
        productType: config.productType,
        size: config.size,
        quantity: config.quantity,
        shippingAddress,
        promoCode: appliedPromo?.code || undefined,
        metadata: config.productType === 'polaroid' ? {
          images: polaroids?.images || [],
          frame: polaroids?.frame || 'classic',
          quantities: polaroids?.quantities || [],
        } : undefined
      })

      if (result.error) {
        setServerError(result.error)
        setIsSubmitting(false)
        return
      }

      const orderData = result.order || result
      const keyId = orderData.razorpayKeyId || 'rzp_test_mock'

      // Mock Gateway flow
      const razorpayOrderId: string = orderData.razorpay_order_id || ''
      if (keyId === 'rzp_test_mock' || razorpayOrderId.startsWith('order_mock_')) {
        const verifyRes = await verifyPayment({
          orderId: orderData.id,
          razorpayOrderId: orderData.razorpay_order_id,
          razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
          razorpaySignature: 'mock_signature'
        })

        if (verifyRes.error) {
          setServerError(verifyRes.error)
          setIsSubmitting(false)
          return
        }

        // Clean polaroids state if needed
        if (config.productType === 'polaroid') {
          sessionStorage.removeItem('polaroid-preview-state')
        }

        setPlacedOrder(verifyRes.order ?? null)
        setIsConfirmed(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsSubmitting(false)
        return
      }

      // Live Gateway SDK Flow
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      if (!scriptLoaded) {
        setServerError('Failed to load Razorpay SDK. Please check your network connection.')
        setIsSubmitting(false)
        return
      }

      const options = {
        key: keyId,
        amount: orderData.total_price,
        currency: (orderData.currency || 'INR').toUpperCase(),
        name: 'Folio Print Room',
        description: config.productType === 'polaroid' ? 'Polaroid Prints Checkout' : `Album Print Order - ${albumTitle}`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response: any) {
          setIsSubmitting(true)
          try {
            const verifyRes = await verifyPayment({
              orderId: orderData.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (verifyRes.error) {
              setServerError(verifyRes.error)
              setIsSubmitting(false)
              return
            }

            if (config.productType === 'polaroid') {
              sessionStorage.removeItem('polaroid-preview-state')
            }

            setPlacedOrder(verifyRes.order ?? null)
            setIsConfirmed(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } catch (err: any) {
            setServerError(err.message || 'Payment verification failed.')
          } finally {
            setIsSubmitting(false)
          }
        },
        prefill: {
          name: shippingAddress.fullName,
        },
        theme: {
          color: '#B85C38',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong. Please try again.')
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 mt-16">
      {/* Existing order banner */}
      {existingOrder && !placedOrder && (
        <div className="mb-8 max-w-7xl">
          <OrderHistory order={existingOrder} />
        </div>
      )}

      {/* Draft warning */}
      {isDraft && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 max-w-7xl">
          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Album has unsaved changes</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              This album is still in draft. Consider finishing your edits before ordering.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Form & Wizard */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-3 block">Step 0{currentStepIndex + 1}</span>
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground leading-tight italic">
              {currentStep === 'configure' ? 'Configure Publication' : currentStep === 'shipping' ? 'Shipping Details' : 'Verify Specifications'}
            </h1>
            <p className="text-sm text-muted-foreground font-light mt-1">
              {currentStep === 'configure'
                ? 'Review product details and proceed to shipping.'
                : currentStep === 'shipping'
                  ? 'Please enter where we should deliver your high-quality prints.'
                  : 'Review all specifications before submitting your order.'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="border border-border bg-card/60 backdrop-blur p-6 rounded-xl">
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
          </div>

          <div key={stepKey} className="step-enter">
            {/* ──────── Step 1: Configure ──────── */}
            {currentStep === 'configure' && (
              <div className="space-y-8">
                {config.productType !== 'polaroid' ? (
                  <>
                    <ProductSelector
                      value={config.productType as any}
                      onChange={(productType) => setConfig((c) => ({ ...c, productType: productType as any }))}
                      disabled={isSubmitting}
                      pricing={pricing}
                      pageLimits={pageLimits}
                      minPages={minPages}
                    />

                    <div className="border-t border-border/60" />

                    <SizeSelector
                      value={config.size}
                      onChange={(size) => setConfig((c) => ({ ...c, size }))}
                      disabled={isSubmitting}
                    />

                    <div className="border-t border-border/60" />

                    <QuantityInput
                      value={config.quantity}
                      onChange={(quantity) => setConfig((c) => ({ ...c, quantity }))}
                      disabled={isSubmitting}
                    />
                  </>
                ) : (
                  <div className="bg-card border border-border p-6 space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-foreground">Polaroid Print Package</h3>
                        <p className="text-sm text-muted-foreground">Premium 320gsm silk finish cardstock prints</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/40 text-xs font-mono text-muted-foreground rounded space-y-2 border border-border/60">
                      <div>UNIQUE PRINTS: {polaroids?.images.length || 0}</div>
                      <div>TOTAL PIECES: {totalPolaroidPieces}</div>
                      <div>FRAME STYLE: <span className="uppercase">{polaroids?.frame || 'Classic'}</span></div>
                      <div>DIMENSIONS: 107 × 88 mm</div>
                    </div>
                  </div>
                )}

                {pageCountExceeded && (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      Your album has <strong>{pageCount} pages</strong>, which exceeds the{' '}
                      <strong>{config.productType}</strong> limit of{' '}
                      <strong>{maxPages} pages</strong>. Please choose a different format.
                    </p>
                  </div>
                )}

                {belowMinPages && (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      Your album has <strong>{pageCount} pages</strong>. A printed book needs at
                      least <strong>{minPages} pages</strong> — add{' '}
                      <strong>{minPages - pageCount} more</strong> in the editor before ordering.
                    </p>
                  </div>
                )}

                {hasNoPages && (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      This album has no pages yet. Add some spreads in the editor before ordering.
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-end pt-6 border-t border-border/60">
                  <Button
                    onClick={goNext}
                    disabled={pageCountBlocked}
                    className="px-8 py-5 text-sm font-medium gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Continue to shipping
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ──────── Step 2: Shipping ──────── */}
            {currentStep === 'shipping' && (
              <div className="space-y-8">
                <ShippingForm
                  value={shippingAddress}
                  onChange={setShippingAddress}
                  errors={fieldErrors}
                  disabled={isSubmitting}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-border/60">
                  <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    Back to configuration
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

            {/* ──────── Step 3: Review ──────── */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                {serverError && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 mb-6">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{serverError}</p>
                  </div>
                )}

                <div className="border border-border bg-card p-6 rounded-xl space-y-6">
                  <h3 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
                    <Check className="w-5 h-5 text-secondary" />
                    Review Specifications
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-light">
                    <div className="space-y-2 bg-muted/40 p-4 rounded-lg border border-border/50">
                      <h4 className="font-sans font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Print Options</h4>
                      {config.productType === 'polaroid' ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">Polaroid Print Stack</p>
                          <p className="text-xs text-muted-foreground">{totalPolaroidPieces} prints ({polaroids?.images.length || 0} layouts)</p>
                          <p className="text-xs text-muted-foreground">Frame: <span className="uppercase font-mono">{polaroids?.frame || 'Classic'}</span></p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground">Product:</span>
                            <span className="font-semibold text-foreground">{config.productType === 'softcover' ? 'Softcover' : 'Hardcover'} Cover</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-semibold text-foreground">{config.size === 'small' ? 'Small' : 'Large'}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-semibold text-foreground">{config.quantity} copies</span>
                          </div>
                        </>
                      )}
                      {config.productType !== 'polaroid' && (
                        <button 
                          onClick={() => goToStep('configure')}
                          className="text-xs text-primary underline mt-2 block"
                        >
                          Change specs
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 bg-muted/40 p-4 rounded-lg border border-border/50">
                      <h4 className="font-sans font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Shipping To</h4>
                      <p className="font-medium text-foreground">{shippingAddress.fullName}</p>
                      <p className="text-muted-foreground text-xs leading-normal">
                        {shippingAddress.addressLine1}
                        {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}
                      </p>
                      <p className="text-muted-foreground text-xs">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                      <p className="text-muted-foreground text-xs">{shippingAddress.country}</p>
                      {shippingAddress.phone && <p className="text-muted-foreground text-xs mt-1">📞 {shippingAddress.phone}</p>}
                      <button 
                        onClick={() => goToStep('shipping')}
                        className="text-xs text-primary underline mt-2 block"
                      >
                        Change address
                      </button>
                    </div>
                  </div>
                </div>

                {/* Craftsmanship guidelines */}
                <div className="border border-border bg-card p-6 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg text-foreground">Craftsmanship & Guarantee</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light">
                    <div className="flex gap-3">
                      <BookOpen className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <h5 className="font-bold text-foreground">Premium Silk Paper & Ink</h5>
                        <p className="text-muted-foreground mt-0.5 font-light leading-normal">Using heavy 320gsm cartridges and non-fade archival inks, our prints provide deep contrast and gorgeous tone rendering.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                      <div>
                        <h5 className="font-bold text-foreground">Inspection Standard</h5>
                        <p className="text-muted-foreground mt-0.5 font-light leading-normal">Every batch is physically verified by our print operations team before dispatch to ensure zero binding or alignment defects.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-border/60">
                  <Button variant="ghost" onClick={goBack} className="gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    Back to shipping
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="border border-border bg-card shadow-2xl p-8 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
            
            <h3 className="font-serif text-2xl mb-8 italic border-b border-border pb-4 text-foreground">Order Summary</h3>

            {/* Cover / Polaroid Thumbnail */}
            <div className="flex gap-4 items-center mb-6 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="w-16 h-20 bg-background border border-border p-1 shadow-md shrink-0 flex items-center justify-center relative overflow-hidden rounded">
                {config.productType === 'polaroid' ? (
                  polaroidCover ? (
                    <img src={polaroidCover} alt={albumTitle} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Polaroid</span>
                    </div>
                  )
                ) : (
                  coverUrl ? (
                    <img src={coverUrl} alt={albumTitle} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">No Cover</span>
                    </div>
                  )
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Item Name</span>
                <h4 className="font-serif text-lg text-foreground leading-snug truncate mt-0.5">{albumTitle}</h4>
                <p className="text-xs text-muted-foreground mt-1 font-light">
                  {config.productType === 'polaroid' ? `${totalPolaroidPieces} prints` : `${pages.length} pages total`}
                </p>
              </div>
            </div>

            {/* Config Specs */}
            <div className="space-y-4 text-sm font-light border-b border-border pb-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Product Finish</span>
                <span className="font-medium text-foreground uppercase text-xs font-mono">{config.productType}</span>
              </div>
              {config.productType !== 'polaroid' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Format size</span>
                    <span className="font-medium text-foreground">{config.size === 'small' ? 'Small (15x15)' : 'Large (30x30)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quantity copies</span>
                    <span className="font-medium text-foreground">{config.quantity}</span>
                  </div>
                </>
              )}
            </div>

            {/* Coupon Code Block */}
            <div className="border-b border-border pb-6 mb-6">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase block mb-3">Promo Code</span>
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 px-3.5 py-2.5 rounded-lg text-sm text-emerald-400">
                  <div className="font-mono text-xs">
                    <span className="font-bold uppercase">{appliedPromo.code}</span>
                    <span className="opacity-80 ml-1">
                      (-{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}%` : formatPrice(appliedPromo.discountValue)})
                    </span>
                  </div>
                  <button 
                    onClick={handleRemovePromo}
                    className="text-xs text-muted-foreground hover:text-foreground underline border-none bg-transparent cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary rounded-lg uppercase font-mono"
                  />
                  <Button 
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="bg-foreground text-background px-4 py-2 hover:opacity-90 text-xs uppercase font-bold tracking-wider rounded-lg shrink-0 h-[38px]"
                  >
                    {isValidatingPromo ? '...' : 'Apply'}
                  </Button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-500 mt-2 font-mono">{promoError}</p>}
              {promoSuccess && <p className="text-xs text-green-500 mt-2 font-mono">{promoSuccess}</p>}
            </div>

            {/* Price breakdown */}
            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-light">Subtotal</span>
                <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span className="font-light">Promo Discount</span>
                  <span className="font-medium">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-light">Standard Delivery</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-green-600 dark:text-green-400 uppercase text-xs tracking-wider">FREE</span>
                ) : (
                  <span className="font-medium text-foreground">{formatPrice(shippingFee)}</span>
                )}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-light">GST ({shipTax.tax_rate}%)</span>
                <span className="font-medium text-foreground">{formatPrice(taxAmount)}</span>
              </div>
              <div className="h-px bg-border my-4" />
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-lg italic text-foreground">Grand Total</span>
                <span className="font-serif text-3xl font-bold text-foreground">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Action CTA */}
            <div className="space-y-3">
              {currentStep === 'review' ? (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-7 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs hover:bg-primary/95 transition-all shadow-xl shadow-primary/10 rounded-lg flex items-center justify-center gap-2 h-12"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processing Payment…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Place Order & Pay
                    </>
                  )}
                </Button>
              ) : currentStep === 'shipping' ? (
                <Button
                  onClick={handleContinueFromShipping}
                  className="w-full py-7 bg-foreground text-background dark:bg-foreground dark:text-background font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all rounded-lg flex items-center justify-center gap-2 h-12"
                >
                  <span>Verify and Review</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={pageCountBlocked}
                  className="w-full py-7 bg-foreground text-background dark:bg-foreground dark:text-background font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all rounded-lg flex items-center justify-center gap-2 h-12"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Guarantee statements */}
            <div className="mt-8 pt-6 border-t border-border/60 text-center space-y-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Secure Checkout · powered by Razorpay
              </p>
              <div className="flex justify-center gap-4 text-muted-foreground/60 text-xs font-mono">
                <span>🛡️ Quality Check</span>
                <span>🚚 Courier delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
