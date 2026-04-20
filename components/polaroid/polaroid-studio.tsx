'use client'

import { useState, useRef } from 'react'
import { Upload, ChevronRight, ChevronLeft, Check, Camera, Frame, Image as ImageIcon, ShoppingBag } from 'lucide-react'
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
    description: 'The timeless original with a clean white border.'
  },
  {
    id: 'midnight',
    name: 'Midnight Black',
    frameClass: 'bg-[#1C1814] shadow-md text-white border-none',
    description: 'A bold, sophisticated look for high-contrast shots.'
  },
  {
    id: 'vintage',
    name: 'Vintage Cream',
    frameClass: 'bg-[#F2E8D5] shadow-sm border border-[#D1C7B1]',
    description: 'Aged paper feel for a nostalgic aesthetic.'
  },
  {
    id: 'modern',
    name: 'Gallery Minimal',
    frameClass: 'bg-white shadow-xl p-3',
    description: 'Ultra-clean with a subtle depth for modern spaces.'
  }
]

export function PolaroidStudio() {
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImage(url)
      setStep('template')
    }
  }

  const reset = () => {
    setImage(null)
    setStep('upload')
  }

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
          Polaroid Studio
        </h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          Transform your digital memories into tangible keepsakes. 
          Upload, customize, and order your custom prints.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-12 gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'upload', label: 'Upload', icon: Camera },
          { id: 'template', label: 'Template', icon: Frame },
          { id: 'preview', label: 'Preview', icon: ImageIcon },
          { id: 'order', label: 'Order', icon: ShoppingBag },
        ].map((s, idx) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isDone = ['upload', 'template', 'preview', 'order'].indexOf(step) > idx
          
          return (
            <div key={s.id} className="flex items-center gap-2 md:gap-4 shrink-0">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" : 
                  isDone ? "bg-secondary text-secondary-foreground" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-sm font-mono tracking-wider uppercase",
                isActive ? "text-foreground font-bold" : "text-muted-foreground"
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
        {step === 'upload' && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) {
                const url = URL.createObjectURL(file)
                setImage(url)
                setStep('template')
              }
            }}
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif mb-2">Start your creation</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-xs">
              Drag and drop your photo here, or click to browse your files.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Photo
            </Button>
          </div>
        )}

        {step === 'template' && image && (
          <div className="p-8 md:p-12 animate-in fade-in duration-500">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Preview */}
              <div className="flex justify-center flex-col items-center">
                <div 
                  className={cn(
                    "polaroid-preview transition-all duration-500 p-3 pb-12 w-full max-w-[320px]",
                    selectedTemplate.frameClass
                  )}
                >
                  <div className="aspect-square bg-muted overflow-hidden relative border border-black/5">
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-8 h-4 w-3/4 mx-auto bg-black/5 rounded-full pulse-subtle" />
                </div>
                <p className="mt-6 text-xs font-mono text-muted-foreground uppercase tracking-widest">Live Preview</p>
              </div>

              {/* Options */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-3xl mb-2">Choose your frame</h2>
                  <p className="text-muted-foreground">Select a style that complements your photograph.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={cn(
                        "flex items-start gap-4 p-4 text-left border transition-all duration-200",
                        selectedTemplate.id === t.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-border hover:border-muted-foreground/50 bg-background"
                      )}
                    >
                      <div className={cn("w-12 h-12 shrink-0 border border-border mt-1", t.frameClass)} />
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

        {step === 'preview' && image && (
          <div className="p-8 md:p-12 animate-in zoom-in duration-500">
             <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-serif text-3xl mb-8">Review your print</h2>
                
                <div className="flex justify-center mb-12">
                   <div className="relative group">
                     {/* Stack effect */}
                     <div className="absolute inset-0 bg-white shadow-sm transform rotate-2 translate-x-2 translate-y-2 -z-10" />
                     <div className="absolute inset-0 bg-white shadow-sm transform -rotate-1 -translate-x-1 -translate-y-1 -z-20" />
                     
                     <div 
                        className={cn(
                          "transition-all duration-500 p-4 pb-16 w-[360px] relative",
                          selectedTemplate.frameClass
                        )}
                      >
                        <div className="aspect-square bg-muted overflow-hidden relative shadow-inner">
                          <img 
                            src={image} 
                            alt="Preview" 
                            className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </div>
                        <div className="mt-10 px-2 flex justify-between items-end">
                            <div className="h-px w-1/3 bg-muted-foreground/30" />
                            <span className="font-serif text-sm opacity-30">Folio Print No. {Math.floor(Math.random() * 9000) + 1000}</span>
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
                      <p className="font-sans font-medium">{selectedTemplate.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paper Type</p>
                      <p className="font-sans font-medium">320gsm premium silk</p>
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
                    Checkout • ₹199
                    <ShoppingBag className="w-4 h-4 ml-2" />
                  </Button>
                </div>
             </div>
          </div>
        )}

        {step === 'order' && (
          <div className="p-8 md:p-12 animate-in slide-in-from-bottom duration-700 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mb-8">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-4xl mb-4 text-center">Ready to print</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-12">
              Your custom Polaroid is ready for production. Fill in your details below to complete your order.
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
                <span className="font-serif text-2xl">₹199</span>
              </div>
              <Button className="w-full h-12 text-lg font-serif" onClick={() => alert('Order placed! Thank you.')}>
                Confirm and Pay
              </Button>
            </div>
            
            <button 
              onClick={reset}
              className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Start over with another photo
            </button>
          </div>
        )}
      </div>

      {/* Decorative text */}
      <div className="mt-20 flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/40 px-2 pb-10">
        <span>© 2026 Folio Press</span>
        <span>Studio Edition v1.0.4</span>
        <span>Crafted with patience</span>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
