'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Users, FolderOpen, Tag, BookOpen, Gift, ChevronRight, Layout } from 'lucide-react'

const steps = [
  {
    label: 'Gather',
    caption: 'Collaborative Event Spaces',
    visual: 'pile',
    icon: Users,
    description: 'Set up an event space, invite friends, and approve collaborators to drop photos. Keep it view-only for guests, while approved co-creators upload freely.',
  },
  {
    label: 'Organize',
    caption: 'Nested Folder Explorer',
    visual: 'folders',
    icon: FolderOpen,
    description: 'Structure your gallery with a PC-style nested directory layout. Move photos between folders, keep assets neat, and skip the flat-list scroll fatigue.',
  },
  {
    label: 'Tag & Filter',
    caption: 'People & Location Mapping',
    visual: 'tags',
    icon: Tag,
    description: 'Admins and collaborators tag people and pin places on photos. Search the collective gallery instantly with global filtering by person or location.',
  },
  {
    label: 'Design',
    caption: 'Editorial Page Layouts',
    visual: 'spread',
    icon: BookOpen,
    description: 'Start from scratch with a blank canvas or jump-start with a Popular Album design (Wedding, Voyage, Portfolio) to structure gorgeous page spreads.',
  },
  {
    label: 'Preserve',
    caption: 'Gifting & Physical Heirloom',
    visual: 'parcel',
    icon: Gift,
    accent: true,
    description: 'Attach delivery and gifting instructions to your shared digital flipbook. Order premium lay-flat volumes printed on heavy matte paper, delivered to your door.',
  },
]

export function ProcessTimeline() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 md:py-36 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto overflow-hidden bg-background">
      
      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-6">
        <div className="space-y-4">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> The Creative Journey
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            The five acts of memory.
          </h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          From a collaborative shared event to a beautifully printed lay-flat volume. Here is how your story unfolds.
        </p>
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:block relative pt-6 pb-12">
        {/* Horizontal connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border/40 -translate-y-24" />
        
        <div className="grid grid-cols-5 gap-6 relative z-10">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === index
            return (
              <div
                key={step.label}
                className="relative flex flex-col group cursor-pointer"
                onClick={() => setActiveStep(index)}
              >
                {/* Timeline node */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-24 w-5 h-5 rounded-full bg-background border-2 transition-all duration-300 flex items-center justify-center ${
                  isActive ? 'border-primary scale-125' : 'border-border group-hover:border-primary/60'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'} transition-colors`} />
                </div>

                {/* Visual Container */}
                <div
                  className={`mt-16 aspect-[4/3] relative border bg-card dark:bg-card/40 flex items-center justify-center p-4 transition-all duration-500 overflow-hidden ${
                    isActive 
                      ? 'border-primary shadow-lg shadow-primary/5' 
                      : 'border-border/50 group-hover:border-border/80'
                  }`}
                >
                  <StepVisual type={step.visual} />
                </div>

                {/* Content info */}
                <div className="mt-6 space-y-2 text-center md:text-left">
                  <span className="font-mono text-[9px] text-primary/80 uppercase tracking-widest font-bold">Act {index + 1}</span>
                  <h3 className={`font-serif text-lg text-foreground font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
                    {step.label}
                  </h3>
                  <p className="font-mono text-[9px] text-muted-foreground italic">
                    {step.caption}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-12 relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-border/40" />

        {steps.map((step, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            key={step.label}
            className="flex gap-6 relative group"
          >
            {/* Mobile Timeline node */}
            <div className="absolute left-6 top-12 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
              <div className={`w-1.5 h-1.5 rounded-full ${step.accent ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            </div>

            {/* Visual Thumbnail */}
            <div
              className={`w-24 h-24 shrink-0 border bg-card dark:bg-card/40 flex items-center justify-center p-3 overflow-hidden transition-all duration-300 ${
                step.accent ? 'border-primary' : 'border-border/60'
              }`}
            >
              <StepVisual type={step.visual} />
            </div>

            {/* Mobile text */}
            <div className="flex flex-col justify-center space-y-1">
              <span className="font-mono text-[9px] text-primary/80 uppercase tracking-wider font-bold">Act {index + 1}</span>
              <h3 className="font-serif text-base text-foreground font-semibold">
                {step.label}
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground italic">
                {step.caption}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function StepVisual({ type }: { type: string }) {
  switch (type) {
    case 'pile':
      return (
        <div className="relative w-24 h-20">
          {/* Polaroid 1 */}
          <div className="absolute top-2 left-1 w-12 h-11 bg-card border border-border shadow-sm -rotate-12 p-1 pb-3 flex items-center justify-center">
            <div className="w-full h-full bg-muted" />
          </div>
          
          {/* Polaroid 2 */}
          <div className="absolute top-1 left-9 w-12 h-11 bg-card border border-border shadow-sm rotate-12 p-1 pb-3 flex items-center justify-center">
            <div className="w-full h-full bg-muted" />
          </div>

          {/* Polaroid 3 (Top focused) */}
          <div className="absolute top-3.5 left-5 w-13 h-12 bg-card border border-primary/50 shadow-md rotate-2 p-1 pb-3 flex items-center justify-center">
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>
      )
    case 'folders':
      return (
        <div className="relative w-20 h-16 flex flex-col justify-between border border-border p-2 bg-muted/30">
          <div className="flex items-center gap-1.5 border-b border-border pb-1">
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[7px] font-mono text-muted-foreground">/tuscany-trip</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1.5">
            <div className="h-6 bg-card border border-border flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-muted/80" />
            </div>
            <div className="h-6 bg-card border border-border flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-primary/15" />
            </div>
            <div className="h-6 border border-dashed border-border flex items-center justify-center">
              <span className="text-[8px] text-muted-foreground">+</span>
            </div>
          </div>
        </div>
      )
    case 'tags':
      return (
        <div className="relative w-24 h-16 flex flex-col items-center justify-center gap-2">
          {/* Tag shape preview */}
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-2.5 py-1 text-[8px] font-mono text-primary uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            <span>@Sarah</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/10 border border-secondary/30 px-2.5 py-1 text-[8px] font-mono text-secondary uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            <span>Amalfi Coast</span>
          </div>
        </div>
      )
    case 'spread':
      return (
        <div className="flex gap-1.5 w-24 h-16 bg-card border border-border shadow-inner relative p-1.5 rounded-sm">
          {/* Left page */}
          <div className="flex-1 bg-muted/50 border-r border-border/20 p-1 flex items-center justify-center">
            <div className="w-full h-full bg-muted" />
          </div>
          
          {/* Center binding split */}
          <div className="w-px bg-border/80 h-full" />

          {/* Right page */}
          <div className="flex-1 bg-muted/50 p-1 flex flex-col justify-between">
            <div className="w-full h-4 bg-primary/10" />
            <div className="w-3/4 h-1 bg-border" />
            <div className="w-full h-1 bg-border" />
          </div>
        </div>
      )
    case 'parcel':
      return (
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="w-15 h-15 bg-[#c4a77d] border border-[#a88a5e] relative shadow-md p-1 flex items-center justify-center dark:brightness-90">
            {/* Box tape lines */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-[#a88a5e]/45" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-[#a88a5e]/35" />
            
            {/* Shipping stamp */}
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md relative z-10">
              <Gift className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}
