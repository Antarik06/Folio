'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, ChevronRight, Check, Camera, Frame,
  Image as ImageIcon, ShoppingBag, Eye, X, Plus, Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'template' | 'preview' | 'order'

interface Template {
  id: string
  name: string
  frameClass: string
  description: string
}

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic White',
    frameClass: 'bg-[#FDFAF5] shadow-md',
    description: 'The timeless original with a clean white border.',
  },
  {
    id: 'midnight',
    name: 'Midnight Black',
    frameClass: 'bg-[#1C1814] shadow-md text-white border-none',
    description: 'A bold, sophisticated look for high-contrast shots.',
  },
  {
    id: 'vintage',
    name: 'Vintage Cream',
    frameClass: 'bg-[#F2E8D5] shadow-sm border border-[#D1C7B1]',
    description: 'Aged paper feel for a nostalgic aesthetic.',
  },
  {
    id: 'modern',
    name: 'Gallery Minimal',
    frameClass: 'bg-white shadow-xl p-3',
    description: 'Ultra-clean with a subtle depth for modern spaces.',
  },
]

const PRICE_PER_PRINT = 199
const MAX_IMAGES = 10

export function PolaroidStudio() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [images, setImages] = useState<string[]>([])           // object URLs
  const [quantities, setQuantities] = useState<number[]>([])   // qty per print
  const [activeIdx, setActiveIdx] = useState(0)                // thumbnail focus
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreRef   = useRef<HTMLInputElement>(null)

  // --- helpers ---
  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const urls = Array.from(files)
      .slice(0, MAX_IMAGES - images.length)
      .map((f) => URL.createObjectURL(f))
    if (urls.length === 0) return
    setImages((prev) => [...prev, ...urls])
    setQuantities((prev) => [...prev, ...urls.map(() => 1)])
    setActiveIdx(images.length)   // focus first new one
    setStep('template')
  }, [images.length])

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setQuantities((prev) => prev.filter((_, i) => i !== idx))
    setActiveIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev))
    if (images.length === 1) setStep('upload')
  }

  const changeQty = (idx: number, delta: number) =>
    setQuantities((prev) => prev.map((q, i) => i === idx ? Math.max(1, Math.min(20, q + delta)) : q))

  const totalPrints = quantities.reduce((s, q) => s + q, 0)
  const totalPrice  = totalPrints * PRICE_PER_PRINT

  const goTo3DPreview = () => {
    if (images.length === 0) return
    sessionStorage.setItem(
      'polaroid-preview-state',
      JSON.stringify({ images, frame: selectedTemplate.id, quantities })
    )
    router.push('/preview/polaroid')
  }

  const reset = () => {
    images.forEach((url) => URL.revokeObjectURL(url))
    setImages([])
    setQuantities([])
    setActiveIdx(0)
    setStep('upload')
  }

  // --- step bar ---
  const STEPS = [
    { id: 'upload',   label: 'Upload',   icon: Camera      },
    { id: 'template', label: 'Template', icon: Frame       },
    { id: 'preview',  label: 'Preview',  icon: ImageIcon   },
    { id: 'order',    label: 'Order',    icon: ShoppingBag },
  ]
  const stepOrder = STEPS.map((s) => s.id)

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
          Polaroid Studio
        </h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          Transform your digital memories into tangible keepsakes.
          Upload multiple photos, pick a frame, and order your custom prints.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-12 gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        {STEPS.map((s, idx) => {
          const Icon     = s.icon
          const isActive = step === s.id
          const isDone   = stepOrder.indexOf(step) > idx
          return (
            <div key={s.id} className="flex items-center gap-2 md:gap-4 shrink-0">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20'
                  : isDone ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                'text-sm font-mono tracking-wider uppercase',
                isActive ? 'text-foreground font-bold' : 'text-muted-foreground',
              )}>
                {s.label}
              </span>
              {idx < 3 && <div className="hidden sm:block w-8 md:w-16 h-px bg-border mx-2" />}
            </div>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="bg-card border border-border min-h-[500px] relative overflow-hidden">

        {/* ── UPLOAD ── */}
        {step === 'upload' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
          >
            <div
              className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif mb-2">Start your creation</h3>
            <p className="text-muted-foreground mb-2 text-center max-w-xs">
              Drag and drop your photos here, or click to browse.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8 font-mono uppercase tracking-widest">
              Up to {MAX_IMAGES} images per order
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button size="lg" className="px-8" onClick={() => fileInputRef.current?.click()}>
              Select Photos
            </Button>
          </div>
        )}

        {/* ── TEMPLATE ── */}
        {step === 'template' && images.length > 0 && (
          <div className="p-8 md:p-12 animate-in fade-in duration-500">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Left: image strip + live polaroid preview */}
              <div className="flex flex-col items-center gap-6">
                {/* Active polaroid preview */}
                <div
                  className={cn(
                    'polaroid-preview transition-all duration-500 p-3 pb-12 w-full max-w-[300px]',
                    selectedTemplate.frameClass,
                  )}
                >
                  <div className="aspect-square bg-muted overflow-hidden relative border border-black/5">
                    <img
                      src={images[activeIdx]}
                      alt="Preview"
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  </div>
                  <div className="mt-8 h-3 w-3/4 mx-auto bg-black/5 rounded-full" />
                </div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  {activeIdx + 1} / {images.length} photo{images.length > 1 ? 's' : ''}
                </p>

                {/* Thumbnail strip */}
                <div className="flex flex-wrap gap-3 justify-center max-w-[360px]">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      className={cn(
                        'relative w-16 h-16 cursor-pointer border-2 transition-all duration-200 overflow-hidden rounded-sm',
                        i === activeIdx ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100',
                      )}
                      onClick={() => setActiveIdx(i)}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  {images.length < MAX_IMAGES && (
                    <button
                      onClick={() => addMoreRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary flex items-center justify-center rounded-sm transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    ref={addMoreRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </div>
              </div>

              {/* Right: frame options */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-3xl mb-2">Choose your frame</h2>
                  <p className="text-muted-foreground">
                    Applied to all {images.length} print{images.length > 1 ? 's' : ''}.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={cn(
                        'flex items-start gap-4 p-4 text-left border transition-all duration-200',
                        selectedTemplate.id === t.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground/50 bg-background',
                      )}
                    >
                      <div className={cn('w-12 h-12 shrink-0 border border-border mt-1', t.frameClass)} />
                      <div>
                        <h4 className="font-sans font-bold text-base">{t.name}</h4>
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                      </div>
                      {selectedTemplate.id === t.id && (
                        <div className="ml-auto bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep('preview')}>
                    Continue to Preview
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {step === 'preview' && images.length > 0 && (
          <div className="p-8 md:p-12 animate-in zoom-in duration-500">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl mb-8 text-center">Review your prints</h2>

              {/* Polaroid stack preview (scrollable when many) */}
              <div className="flex gap-6 overflow-x-auto pb-6 mb-8 scrollbar-hide justify-start md:justify-center">
                {images.map((src, i) => (
                  <div key={i} className="shrink-0 flex flex-col items-center gap-3">
                    <div className="relative">
                      {/* Stack depth layers */}
                      <div className="absolute inset-0 bg-white shadow-sm transform rotate-2 translate-x-1.5 translate-y-1.5 -z-10" />
                      <div className="absolute inset-0 bg-white shadow-sm transform -rotate-1 -translate-x-1 translate-y-0.5 -z-20" />
                      <div
                        className={cn(
                          'transition-all duration-500 p-3 pb-10 w-[180px]',
                          selectedTemplate.frameClass,
                        )}
                      >
                        <div className="aspect-square overflow-hidden shadow-inner">
                          <img
                            src={src}
                            alt={`Print ${i + 1}`}
                            className="w-full h-full object-cover filter contrast-[1.04] brightness-[1.02]"
                          />
                        </div>
                        <div className="mt-6 px-1 flex justify-between items-end">
                          <div className="h-px w-1/3 bg-muted-foreground/20" />
                          <span className="font-serif text-[10px] opacity-25">#{1000 + i}</span>
                        </div>
                      </div>
                    </div>

                    {/* Per-print quantity stepper */}
                    <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
                      <button
                        onClick={() => changeQty(i, -1)}
                        className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-sm font-bold w-5 text-center">{quantities[i]}</span>
                      <button
                        onClick={() => changeQty(i, 1)}
                        className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      × ₹{PRICE_PER_PRINT}
                    </p>
                  </div>
                ))}
              </div>

              {/* Spec sheet */}
              <div className="bg-paper p-6 border border-border mb-8 text-left">
                <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Order Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Unique prints</p>
                    <p className="font-sans font-medium">{images.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total pieces</p>
                    <p className="font-sans font-medium">{totalPrints}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frame style</p>
                    <p className="font-sans font-medium">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paper</p>
                    <p className="font-sans font-medium">320gsm premium silk</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-sans font-medium">107 × 88 mm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price per print</p>
                    <p className="font-sans font-medium">₹{PRICE_PER_PRINT}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-serif text-base">Total</span>
                  <span className="font-serif text-2xl">₹{totalPrice}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('template')}>
                  Edit Options
                </Button>
                <Button
                  className="flex-1 bg-ink text-white hover:bg-ink/90"
                  onClick={goTo3DPreview}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View in 3D Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDER ── */}
        {step === 'order' && (
          <div className="p-8 md:p-12 animate-in slide-in-from-bottom duration-700 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mb-8">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-4xl mb-4 text-center">Ready to print</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-12">
              {totalPrints} polaroid{totalPrints > 1 ? 's' : ''} ready for production. Fill in your details to complete the order.
            </p>

            <div className="w-full max-w-md space-y-6 bg-paper p-8 border border-border">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-tighter text-muted-foreground">Shipping Address</label>
                <div className="h-10 bg-background border border-border flex items-center px-3 text-sm text-muted-foreground italic">
                  Select from saved addresses...
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-tighter text-muted-foreground">Payment Method</label>
                <div className="h-10 bg-background border border-border flex items-center px-3 text-sm text-foreground">
                  •••• •••• •••• 4242 (Visa)
                </div>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-serif text-lg">Total — {totalPrints} prints</span>
                <span className="font-serif text-2xl">₹{totalPrice}</span>
              </div>
              <Button
                className="w-full h-12 text-lg font-serif"
                onClick={() => alert('Order placed! Thank you.')}
              >
                Confirm and Pay
              </Button>
            </div>

            <button
              onClick={reset}
              className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Start a new order
            </button>
          </div>
        )}
      </div>

      {/* Decorative footer */}
      <div className="mt-20 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/40 px-2 pb-10">
        <span>© 2026 Folio Press</span>
        <span>Studio Edition v1.0.4</span>
        <span>Crafted with patience</span>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
