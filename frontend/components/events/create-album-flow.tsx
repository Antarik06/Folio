'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createAlbumAction } from '@/lib/actions/events'

interface CreateAlbumFlowProps {
  eventId: string
  variant?: 'header' | 'empty'
}

export function CreateAlbumFlow({ eventId, variant = 'header' }: CreateAlbumFlowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleCreateScratch() {
    setLoading(true)
    try {
      const res = await createAlbumAction(eventId, 'Untitled Volume')
      if (res && res.id) {
        router.push(`/editor/${res.id}`)
      } else {
        console.error('Failed to create album:', res)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error creating scratch album:', err)
      setLoading(false)
    }
  }

  function handleGoToTemplates() {
    setIsOpen(false)
    router.push(`/dashboard/templates?eventId=${eventId}`)
  }

  const triggerButton = variant === 'empty' ? (
    <button className="bg-primary text-primary-foreground px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 cursor-pointer">
      Create an Album
    </button>
  ) : (
    <button className="bg-primary text-primary-foreground px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 cursor-pointer">
      Create an Album
    </button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-8 border border-border bg-card">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif text-3xl text-foreground text-center sm:text-left">
            Create New Album
          </DialogTitle>
          <p className="text-muted-foreground text-sm font-light mt-1 text-center sm:text-left">
            Choose your creative starting point to organize your event photos.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Card A: Create From Scratch */}
          <div
            onClick={loading ? undefined : handleCreateScratch}
            className={`group p-8 bg-background border border-border hover:border-primary/40 cursor-pointer transition-all flex flex-col justify-between text-left rounded-sm relative overflow-hidden ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div>
              <div className="w-12 h-12 bg-primary/5 border border-primary/10 rounded-full flex items-center justify-center mb-6 transition-all group-hover:bg-primary/10">
                <Layers className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3 leading-tight">
                Option 1 — Create From Scratch
              </h3>
              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-6">
                Start with a blank canvas. You will have full manual control over placing photo elements and designing custom pages.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-all">
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Creating Canvas...
                </>
              ) : (
                'Start Scratch Canvas →'
              )}
            </span>
          </div>

          {/* Card B: Use Premade Template */}
          <div
            onClick={loading ? undefined : handleGoToTemplates}
            className={`group p-8 bg-background border border-border hover:border-secondary/40 cursor-pointer transition-all flex flex-col justify-between text-left rounded-sm relative overflow-hidden ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div>
              <div className="w-12 h-12 bg-secondary/5 border border-secondary/10 rounded-full flex items-center justify-center mb-6 transition-all group-hover:bg-secondary/10">
                <Sparkles className="w-6 h-6 text-secondary" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3 leading-tight">
                Option 2 — Use Premade Template
              </h3>
              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-6">
                Select an artist-crafted layout style (e.g. Wedding, Voyage, Portfolio) to structure your album spreads instantly.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-all">
              Browse Art Catalog →
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
