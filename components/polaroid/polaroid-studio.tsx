'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, ChevronRight, Check, Camera, Frame, Image as ImageIcon, ShoppingBag, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'edit' | 'template' | 'preview' | 'order'

interface Template {
  id: string
  name: string
  frameClass: string
  description: string
}

interface PolaroidItem {
  id: string
  url: string
  templateId: string
}

const TEMPLATES: Template[] = [
  { id: 'classic', name: 'Classic White', frameClass: 'bg-[#FDFAF5] shadow-md', description: 'The timeless original with a clean white border.' },
  { id: 'midnight', name: 'Midnight Black', frameClass: 'bg-[#1C1814] shadow-md text-white border-none', description: 'A bold, sophisticated look for high-contrast shots.' },
  { id: 'vintage', name: 'Vintage Cream', frameClass: 'bg-[#F2E8D5] shadow-sm border border-[#D1C7B1]', description: 'Aged paper feel for a nostalgic aesthetic.' },
  { id: 'modern', name: 'Gallery Minimal', frameClass: 'bg-white shadow-xl p-3', description: 'Ultra-clean with a subtle depth for modern spaces.' },
]

const PRICE_PER_PRINT = 199

export function PolaroidStudio() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [items, setItems] = useState<PolaroidItem[]>([])
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) ?? items[0] ?? null,
    [items, activeItemId]
  )

  const totalPrice = items.length * PRICE_PER_PRINT

  useEffect(() => {
    if (!activeItem) return
    const linkedTemplate = TEMPLATES.find((template) => template.id === activeItem.templateId) ?? TEMPLATES[0]
    setSelectedTemplate(linkedTemplate)
  }, [activeItem])

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [items])

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      templateId: selectedTemplate.id,
    }))
    setItems((prev) => [...prev, ...incoming])
    setActiveItemId((prev) => prev ?? incoming[0]?.id ?? null)
    setStep('edit')
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.url)
      const next = prev.filter((item) => item.id !== id)
      if (!next.length) {
        setActiveItemId(null)
        setStep('upload')
      } else if (activeItemId === id) {
        setActiveItemId(next[0].id)
      }
      return next
    })
  }

  const applyTemplateToActive = (template: Template) => {
    setSelectedTemplate(template)
    if (!activeItem) return
    setItems((prev) => prev.map((item) => (item.id === activeItem.id ? { ...item, templateId: template.id } : item)))
  }

  const reset = () => {
    items.forEach((item) => URL.revokeObjectURL(item.url))
    setItems([])
    setActiveItemId(null)
    setStep('upload')
  }

  const openUnifiedCheckout = () => {
    router.push(`/dashboard/orders/checkout?source=polaroid&product=polaroid&items=${items.length}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
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
        {[
          { id: 'upload', label: 'Upload', icon: Camera },
          { id: 'edit', label: 'Quick Edit', icon: ImageIcon },
          { id: 'template', label: 'Template', icon: Frame },
          { id: 'preview', label: 'Preview', icon: ImageIcon },
          { id: 'order', label: 'Order', icon: ShoppingBag },
        ].map((s, idx) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isDone = ['upload', 'edit', 'template', 'preview', 'order'].indexOf(step) > idx
          
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
              {idx < 4 && <div className="hidden sm:block w-8 md:w-12 h-px bg-border mx-2" />}
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
            onDrop={(e) => {
              e.preventDefault()
              addFiles(e.dataTransfer.files)
            }}
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
              Upload your polaroid images
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Photos
            </Button>
          </div>
        )}

{/* ── EDIT ── */}
        {step === 'edit' && items.length > 0 && (
          <div className="p-8 md:p-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-3xl mb-1">Quick editor</h2>
                <p className="text-muted-foreground">Keep only what matters: add and remove images.</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Images
              </Button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={cn(
                    'relative aspect-square overflow-hidden border transition-all',
                    activeItem?.id === item.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                  )}
                >
                  <img src={item.url} alt="Uploaded" className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">
                    #{items.findIndex((entry) => entry.id === item.id) + 1}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                    className="absolute right-2 top-2 rounded bg-black/70 p-1 text-white hover:bg-black"
                  >
                    <Trash2 className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-8">
              <Button variant="outline" onClick={reset}>Start over</Button>
              <Button className="flex-1" onClick={() => setStep('template')}>
                Continue to Templates
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'template' && activeItem && (
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
                      src={activeItem.url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-8 h-3 w-3/4 mx-auto bg-black/5 rounded-full" />
                </div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  {items.findIndex((item) => item.id === activeItem?.id) + 1} / {items.length} photo{items.length > 1 ? 's' : ''}
                </p>

                {/* Thumbnail strip */}
                <div className="flex flex-wrap gap-3 justify-center max-w-[360px]">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className={cn(
                        'relative w-16 h-16 cursor-pointer border-2 transition-all duration-200 overflow-hidden rounded-sm',
                        activeItem?.id === item.id ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100',
                      )}
                      onClick={() => setActiveItemId(item.id)}
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          removeItem(item.id)
                        }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options + template sidebar */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-3xl mb-2">Choose your frame</h2>
                  <p className="text-muted-foreground">Template sidebar supports fast switching for selected image.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplateToActive(t)}
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
                  <Button variant="outline" onClick={() => setStep('edit')}>
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
        {step === 'preview' && activeItem && (
          <div className="p-8 md:p-12 animate-in zoom-in duration-500">
             <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-serif text-3xl mb-2">3D Preview</h2>
                <p className="text-muted-foreground mb-8">
                  Optimized interactive preview for smooth Polaroid rendering ({items.length} print{items.length > 1 ? 's' : ''}).
                </p>
                
                <div className="flex justify-center mb-12">
                   <div className="relative group">
                     {/* Stack effect */}
                     <div className="absolute inset-0 bg-white shadow-sm transform rotate-2 translate-x-2 translate-y-2 -z-10" />
                     <div className="absolute inset-0 bg-white shadow-sm transform -rotate-1 -translate-x-1 -translate-y-1 -z-20" />
                     
                     <div 
                        className={cn(
                          'transition-transform duration-150 will-change-transform p-4 pb-16 w-[360px] relative',
                          selectedTemplate.frameClass
                        )}
                        onMouseMove={(event) => {
                          const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
                          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8
                          const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8
                          setTilt({ x, y })
                        }}
                        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                        style={{ transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
                      >
                        <div className="aspect-square bg-muted overflow-hidden relative shadow-inner">
                          <img 
                            src={activeItem.url} 
                            alt="Preview" 
                            className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
                          />
                        </div>
                        <div className="mt-6 px-1 flex justify-between items-end">
                          <div className="h-px w-1/3 bg-muted-foreground/20" />
                          <span className="font-serif text-[10px] opacity-25">#{1000 + items.findIndex((item) => item.id === activeItem.id)}</span>
                        </div>
                      </div>
                    </div>
                </div>
                
                <div className="bg-paper p-6 border border-border mb-8 text-left">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Final Specifications</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Format</p>
                      <p className="font-sans font-medium">Classic Polaroid print</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Template</p>
                      <p className="font-sans font-medium">{TEMPLATES.find((t) => t.id === activeItem.templateId)?.name ?? selectedTemplate.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paper Type</p>
                      <p className="font-sans font-medium">320gsm premium silk</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-sans font-medium">{items.length} print(s)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="font-sans font-medium">107 × 88 mm</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('template')}>
                    Edit Options
                  </Button>
                  <Button className="flex-1 bg-ink text-white hover:bg-ink/90" onClick={() => setStep('order')}>
                    Checkout • ₹{totalPrice}
                    <ShoppingBag className="w-4 h-4 ml-2" />
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
              Your combined Polaroid order is ready. Continue to the shared preview and payment system.
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
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl">₹{totalPrice}</span>
              </div>
              <Button className="w-full h-12 text-lg font-serif" onClick={openUnifiedCheckout}>
                Continue to Unified Checkout
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
