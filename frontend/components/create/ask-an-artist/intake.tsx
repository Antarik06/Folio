'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, ArrowLeft, Check, CreditCard, ShieldCheck, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { formatPrice } from '@/lib/pricing'

interface ArtistIntakeProps {
  packages: any[]
  onComplete: (newProject: any) => void
}

export function ArtistIntake({ packages, onComplete }: ArtistIntakeProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [selectedPkg, setSelectedPkg] = useState<any>(packages[0] || null)
  const [brief, setBrief] = useState({
    title: '',
    eventDescription: '',
    designTheme: 'elegant-classic', // elegant-classic, vintage-warm, modern-bold, minimal
    instructions: '',
    paperPreference: 'matte-fineart', // matte-fineart, layflat-silk, glossy-editorial
    coverPreference: 'linen-wrapped' // linen-wrapped, leatherbound, hardcover-jacket
  })
  
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const handleNext = () => {
    if (step === 1 && !selectedPkg) return
    if (step === 2 && (!brief.title.trim() || !brief.eventDescription.trim())) {
      setError('Please provide a title and event description.')
      return
    }
    setError(null)
    setStep((s) => (s + 1) as any)
  }

  const handleBack = () => {
    setError(null)
    setStep((s) => (s - 1) as any)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhotos(true)
    setError(null)

    // Mimic upload process to Supabase photos bucket
    try {
      const mockUrls: string[] = []
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i]
        // In local flow, we can use standard Unsplash image or mock url path to represent photos
        const mockUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?q=80&w=800`
        mockUrls.push(mockUrl)
      }
      setUploadedUrls([...uploadedUrls, ...mockUrls])
    } catch (err) {
      setError('Upload failed.')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Create Premium Project
      const project = await apiClient.post('/api/premium/projects', {
        packageId: selectedPkg.id,
        briefJson: brief,
        photoUploads: uploadedUrls
      })

      if (!project || !project.id) {
        throw new Error('Project creation failed.')
      }

      // 2. Authorize Deposit Payment (Dummy flow)
      const updatedProject = await apiClient.post(`/api/premium/projects/${project.id}/deposit-pay`)
      
      onComplete(updatedProject)
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  const depositAmount = selectedPkg ? Math.round((selectedPkg.base_price * (selectedPkg.advance_percentage || 50)) / 100) : 0

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl p-8 lg:p-12 relative overflow-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />

      {/* Progress Line */}
      <div className="flex justify-between items-center mb-12">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all ${
              step === num ? 'bg-primary border-primary text-white scale-110' :
              step > num ? 'bg-secondary border-secondary text-secondary-foreground' :
              'border-border text-muted-foreground'
            }`}>
              {step > num ? <Check className="w-4 h-4" /> : num}
            </div>
            {num < 4 && (
              <div className={`h-[1px] flex-1 mx-4 transition-colors ${
                step > num ? 'bg-secondary' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* ── STEP 1: Select Package ───────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl italic">Select Design Service Tier</h2>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              Choose the level of curation that matches your aesthetic desires. Our designers specialize in fine-art editorial portfolios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`border p-8 rounded-xl text-left flex flex-col justify-between transition-all relative overflow-hidden group shadow-sm ${
                  selectedPkg?.id === pkg.id 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border bg-card/50 hover:border-primary/40'
                }`}
              >
                {selectedPkg?.id === pkg.id && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-[9px] uppercase tracking-widest font-bold px-3 py-1">
                    Selected
                  </div>
                )}
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl text-foreground">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">{pkg.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-2 text-xs font-light text-foreground/80 py-4 border-t border-border/40">
                    {(pkg.features || []).map((feat: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border/40 flex justify-between items-baseline w-full">
                  <span className="text-xs text-muted-foreground">Estimate Price</span>
                  <span className="font-serif text-2xl font-bold">{formatPrice(pkg.base_price)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-border/60">
            <Button onClick={handleNext} disabled={!selectedPkg} className="gap-2 px-6 py-4 bg-primary text-white hover:bg-primary/95">
              Proceed to Creative Brief <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Creative Brief ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <h2 className="font-serif text-3xl italic mb-2">Creative Direction Brief</h2>
            <p className="text-muted-foreground text-sm font-light">Tell our editorial designers about the layout style, color palettes, or stories you want to capture.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Project Title</label>
              <input
                type="text"
                value={brief.title}
                onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                placeholder="e.g. The Wedding of Mia & Arthur"
                className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Event & Story Description</label>
              <textarea
                rows={4}
                value={brief.eventDescription}
                onChange={(e) => setBrief({ ...brief, eventDescription: e.target.value })}
                placeholder="Provide details about the atmosphere, location, flow, and key highlights..."
                className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">Design Theme</label>
                <select
                  value={brief.designTheme}
                  onChange={(e) => setBrief({ ...brief, designTheme: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light text-foreground"
                >
                  <option value="elegant-classic">Elegant & Classic (Serif style)</option>
                  <option value="vintage-warm">Vintage & Nostalgic (Warm filter)</option>
                  <option value="modern-bold">Modern & Bold (High-contrast grid)</option>
                  <option value="minimal">Minimalist Canvas (spacious layout)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">Paper Choice</label>
                <select
                  value={brief.paperPreference}
                  onChange={(e) => setBrief({ ...brief, paperPreference: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light text-foreground"
                >
                  <option value="matte-fineart">320gsm Heavy Matte Art Paper</option>
                  <option value="layflat-silk">Layflat Seamless Silk stock</option>
                  <option value="glossy-editorial">Glossy Archival Inkjet stock</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Special Instructions / Requests</label>
              <textarea
                rows={2}
                value={brief.instructions}
                onChange={(e) => setBrief({ ...brief, instructions: e.target.value })}
                placeholder="e.g. Prefer chronologically organized spreads, avoid cropping family portrait on page 5..."
                className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light"
              />
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-border/60">
            <Button variant="ghost" onClick={handleBack} className="gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Packages
            </Button>
            <Button onClick={handleNext} className="gap-2 px-6 py-4 bg-primary text-white hover:bg-primary/95">
              Continue to Photos <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Photos Upload ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <h2 className="font-serif text-3xl italic mb-2">Upload Reference / Design Photos</h2>
            <p className="text-muted-foreground text-sm font-light">Add up to 5 reference layouts or core event photos to help the designer grasp the direction.</p>
          </div>

          <div className="border border-dashed border-border/80 bg-background/50 hover:bg-background/80 transition-colors p-12 text-center rounded-xl relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploadingPhotos}
            />
            <Upload className="w-10 h-10 text-muted-foreground/60 mx-auto mb-4" />
            <p className="text-sm font-light text-foreground mb-2">Drag and drop files here, or click to choose files</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 10MB per file</p>
          </div>

          {/* Photo Previews */}
          {uploadedUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="aspect-square bg-muted relative rounded-lg overflow-hidden border border-border shadow-sm">
                  <img src={url} alt="Reference photo" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-border/60">
            <Button variant="ghost" onClick={handleBack} className="gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Brief
            </Button>
            <Button onClick={handleNext} className="gap-2 px-6 py-4 bg-primary text-white hover:bg-primary/95">
              Proceed to Deposit Payment <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Deposit Payment ──────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <CreditCard className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl italic">Pay Service Deposit</h2>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              Authorize the advance curation deposit to kick off the design assignment. An artist will review and post a first draft within {selectedPkg?.estimated_turnaround_days} days.
            </p>
          </div>

          <div className="border border-border bg-muted/20 p-8 rounded-xl max-w-md mx-auto space-y-6">
            <div className="space-y-3 border-b border-border pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Service Tier</span>
                <span className="font-semibold text-foreground">{selectedPkg?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Base Pricing</span>
                <span className="font-semibold text-foreground">{formatPrice(selectedPkg?.base_price)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-serif italic text-muted-foreground">Deposit Advance ({selectedPkg?.advance_percentage || 50}%)</span>
              <span className="text-3xl font-serif font-bold text-primary">{formatPrice(depositAmount)}</span>
            </div>

            <div className="text-[10px] text-muted-foreground leading-normal flex items-start gap-2 bg-background border border-border/80 p-3 rounded">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Dummy Payment: Razorpay is currently set to developer sandbox. Confirming this step simulates standard payment approval.</span>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-border/60">
            <Button variant="ghost" onClick={handleBack} disabled={loading} className="gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Uploads
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 px-8 py-5 bg-primary text-white hover:bg-primary/95 text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/10 rounded-lg h-12"
            >
              {loading ? 'Initializing Workspace...' : `Authorize & Pay ${formatPrice(depositAmount)}`}
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
