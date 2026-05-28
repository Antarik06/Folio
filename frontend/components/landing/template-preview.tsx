'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

// Spreads inside the album
const PAGES = [
  {
    left: {
      type: 'title',
      title: 'Summer in Tuscany',
      meta: 'COLLECTIVE MEMORY · JULY 2025',
      body: 'A gathering of perspectives. Photos contributed by Sarah, Alex, and Liam, compiled into a physical volume.',
      color: 'bg-[#F9F7F2] dark:bg-[#252019]'
    },
    right: {
      type: 'photo',
      img: '/images/open_photo_album.png',
      caption: 'The golden fields of Val d’Orcia',
      color: 'bg-[#F9F7F2] dark:bg-[#252019]'
    }
  },
  {
    left: {
      type: 'photo',
      img: '/images/polaroid_collage.png',
      caption: 'Sarah’s snapshot: laughing by the coast',
      color: 'bg-[#FDFCF7] dark:bg-[#252019]'
    },
    right: {
      type: 'photo-text',
      img: '/images/magazine_mockup.png',
      title: 'Florence at Night',
      body: 'Wandering the narrow stone paths long after the sunset faded into warm streetlights.',
      color: 'bg-[#FDFCF7] dark:bg-[#252019]'
    }
  },
  {
    left: {
      type: 'photo',
      img: '/images/hardcover_stack.png',
      caption: 'Stack of finished heirlooms',
      color: 'bg-[#F9F6F0] dark:bg-[#252019]'
    },
    right: {
      type: 'title',
      title: 'Endless Horizons',
      meta: 'THE TRAVEL DIARY',
      body: '“We take photos to remember what we felt, not just what we saw.”',
      color: 'bg-[#F9F6F0] dark:bg-[#252019]'
    }
  }
]

export function TemplatePreview() {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const handleNext = () => {
    if (currentSpread >= PAGES.length - 1) return
    setDirection('next')
    setCurrentSpread(prev => prev + 1)
  }

  const handlePrev = () => {
    if (currentSpread <= 0) return
    setDirection('prev')
    setCurrentSpread(prev => prev - 1)
  }

  // Animation variants for double-page transition
  const spreadVariants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? '40%' : '-40%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 220, damping: 26 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      }
    },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? '-40%' : '40%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 220, damping: 26 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      }
    })
  }

  // Helper component to render page types
  const RenderPageContent = ({ page, side }: { page: any, side: 'left' | 'right' }) => {
    if (!page) return null

    return (
      <div className={`w-full h-full flex flex-col justify-between p-6 md:p-10 select-none ${page.color} text-foreground relative transition-colors duration-500`}>
        {page.type === 'title' && (
          <div className="my-auto space-y-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary font-bold block">
              {page.meta}
            </span>
            <h3 className="font-serif text-3xl md:text-4xl leading-tight font-light text-foreground">
              {page.title}
            </h3>
            <div className="w-12 h-px bg-primary/40" />
            <p className="font-sans text-xs md:text-sm text-muted-foreground leading-relaxed">
              {page.body}
            </p>
          </div>
        )}

        {page.type === 'photo' && (
          <div className="w-full h-full flex flex-col justify-center items-center">
            <div className="relative w-full h-[85%] border border-border/40 bg-muted overflow-hidden shadow-sm">
              <Image 
                src={page.img} 
                alt="Book spread photo"
                fill
                sizes="400px"
                className="object-cover pointer-events-none"
              />
              <div className="absolute inset-0 film-grain" />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground mt-3 tracking-wide">
              {page.caption}
            </span>
          </div>
        )}

        {page.type === 'photo-text' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="relative w-full h-[60%] border border-border/40 bg-muted overflow-hidden shadow-sm">
              <Image 
                src={page.img} 
                alt="Book spread photography"
                fill
                sizes="400px"
                className="object-cover pointer-events-none"
              />
              <div className="absolute inset-0 film-grain" />
            </div>
            <div className="space-y-2 mt-4">
              <h4 className="font-serif text-base font-medium text-foreground">
                {page.title}
              </h4>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {page.body}
              </p>
            </div>
          </div>
        )}

        {/* Page numbering */}
        <span className={`absolute bottom-4 ${side === 'left' ? 'left-6' : 'right-6'} font-mono text-[9px] text-muted-foreground/60`}>
          {side === 'left' ? currentSpread * 2 + 1 : currentSpread * 2 + 2}
        </span>
      </div>
    )
  }

  const current = PAGES[currentSpread]

  return (
    <section className="py-24 md:py-36 bg-background overflow-hidden relative border-t border-border/20 transition-colors duration-500">
      
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Title */}
        <div className="text-center max-w-2xl mb-16 space-y-4">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary flex items-center justify-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" /> Editorial Preview
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Flip through the spreads.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Click the controls below to browse pages. Experience the balanced design of a professional photo publication.
          </p>
        </div>

        {/* Flat Double Spread Container */}
        <div className="w-full max-w-[880px] aspect-[2/1] relative select-none bg-card dark:bg-[#1E1A15] border border-border/50 shadow-2xl rounded-sm overflow-hidden">
          
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSpread}
              custom={direction}
              variants={spreadVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex"
            >
              {/* LEFT PAGE */}
              <div className="w-1/2 h-full relative overflow-hidden border-r border-border/20">
                <RenderPageContent page={current.left} side="left" />
              </div>

              {/* RIGHT PAGE */}
              <div className="w-1/2 h-full relative overflow-hidden">
                <RenderPageContent page={current.right} side="right" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Spine Crease (Subtle Center Shadow for Realism) */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[10px] bg-gradient-to-r from-black/[0.04] via-black/[0.08] to-transparent dark:from-black/[0.15] dark:via-black/[0.3] dark:to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border/30 dark:bg-border/10 z-10 pointer-events-none" />
        </div>

        {/* Controls Panel */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 w-full max-w-[880px] border-t border-border/30 dark:border-border/10 pt-8">
          
          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={handlePrev}
              disabled={currentSpread === 0}
              className="w-12 h-12 border border-border/60 dark:border-border/20 rounded-none flex items-center justify-center bg-background hover:bg-muted dark:bg-card dark:hover:bg-muted/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Spread {currentSpread + 1} of {PAGES.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentSpread === PAGES.length - 1}
              className="w-12 h-12 border border-border/60 dark:border-border/20 rounded-none flex items-center justify-center bg-background hover:bg-muted dark:bg-card dark:hover:bg-muted/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Quick instructions and print links */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground hidden md:inline">
              Page {currentSpread * 2 + 1}–{currentSpread * 2 + 2}
            </span>
            <a 
              href="/auth/login"
              className="bg-primary text-primary-foreground px-6 py-3.5 text-xs font-mono uppercase tracking-[0.15em] font-semibold hover:bg-primary/95 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
            >
              Create Album Now
            </a>
          </div>

        </div>

      </div>
    </section>
  )
}
