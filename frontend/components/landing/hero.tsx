'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react'

export function Hero() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Normalize coords from -0.5 to 0.5
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setMousePos({ x, y })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  // Parallax layers multipliers
  const calculateParallax = (multiplier: number) => {
    return {
      x: mousePos.x * multiplier * 40,
      y: mousePos.y * multiplier * 40,
    }
  }

  return (
    <section 
      ref={containerRef}
      className="min-h-screen relative flex items-center justify-center pt-24 overflow-hidden bg-background"
    >
      {/* Editorial Grid overlay in background */}
      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-5 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-full border-r border-foreground last:border-0" />
        ))}
      </div>

      {/* Decorative Blur Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-primary/5 rounded-full filter blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/5 rounded-full filter blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center py-12">
        {/* Left Column: Headline and CTAs */}
        <div className="lg:col-span-6 flex flex-col justify-center text-left">
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary pulse-subtle" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
              Cooperative Photo Archiving <Sparkles className="w-3 h-3 text-primary" />
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-[80px] leading-[1.05] tracking-tight text-foreground text-balance">
            {mounted && (
              <>
                <motion.span 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="block"
                >
                  Some moments
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="block text-primary italic font-light"
                >
                  deserve more
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="block"
                >
                  than a screen.
                </motion.span>
              </>
            )}
          </h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 text-lg text-muted-foreground max-w-lg leading-relaxed text-balance"
          >
            Collaborate on digital albums with friends. Print them into custom archival-grade photo books. Memories, preserved together.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-6"
          >
            <Link 
              href="/auth/login" 
              className="bg-primary text-primary-foreground px-8 py-4 text-xs font-mono uppercase tracking-[0.2em] font-semibold hover:bg-primary/95 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
            >
              Start Curating 
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a 
              href="#how-it-works" 
              className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              See how it works
              <span className="w-1.5 h-1.5 rounded-full bg-border transition-colors group-hover:bg-primary" />
            </a>
          </motion.div>

          {/* Tiny trust banner */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 0.6 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 border-t border-border/40 pt-6 flex gap-8 text-xs font-mono text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary" />
              <span>Lay-flat bindings</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-secondary" />
              <span>Premium Matte Paper</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Dynamic Draggable Parallax Photo Collage */}
        <div className="lg:col-span-6 relative h-[500px] md:h-[600px] flex items-center justify-center mt-12 lg:mt-0 select-none">
          {/* Main Book Backdrop Shadow */}
          <div className="absolute inset-0 bg-radial-gradient from-foreground/5 to-transparent pointer-events-none blur-3xl scale-75" />

          {/* Scattered Draggable Stack */}
          {mounted && (
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* Back Decorative Grid Photo (Italy travel) */}
              <motion.div
                animate={calculateParallax(-0.4)}
                transition={{ type: 'spring', damping: 25, stiffness: 80 }}
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                whileDrag={{ scale: 1.05, zIndex: 50 }}
                className="absolute top-10 left-12 w-48 aspect-[3/4] bg-card p-2.5 pb-8 shadow-md border border-border -rotate-12 cursor-grab active:cursor-grabbing hover:shadow-xl transition-shadow"
              >
                <div className="relative w-full h-full bg-muted overflow-hidden">
                  <Image 
                    src="/images/open_photo_album.png" 
                    alt="Travel album preview" 
                    fill 
                    sizes="200px"
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 film-grain" />
                </div>
                <div className="mt-2 text-center font-mono text-[9px] text-muted-foreground italic">
                  tuscany. july '25
                </div>
              </motion.div>

              {/* Main Photo Book Spread (Centerpiece) */}
              <motion.div
                animate={calculateParallax(-0.15)}
                transition={{ type: 'spring', damping: 20, stiffness: 70 }}
                drag
                dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                whileDrag={{ scale: 1.02, zIndex: 50 }}
                className="absolute w-[80%] max-w-[420px] aspect-[4/3] bg-card border border-border shadow-2xl p-3 pb-4 rotate-2 cursor-grab active:cursor-grabbing hover:shadow-[0_25px_60px_-15px_rgba(28,24,20,0.18)] transition-all"
              >
                <div className="relative w-full h-full bg-muted border border-border/20 overflow-hidden">
                  <Image 
                    src="/images/open_photo_album.png" 
                    alt="Open photo album mock" 
                    fill 
                    priority
                    sizes="400px"
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 film-grain" />
                  
                  {/* Subtle gloss effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                </div>
                
                {/* Book Gutter line */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-r from-black/20 via-black/30 to-black/10 shadow-lg" />
              </motion.div>

              {/* Polaroid Photo 1 (Friends Laughing - foreground right) */}
              <motion.div
                animate={calculateParallax(0.3)}
                transition={{ type: 'spring', damping: 18, stiffness: 90 }}
                drag
                dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
                whileDrag={{ scale: 1.1, zIndex: 50 }}
                className="absolute bottom-16 right-4 w-44 aspect-[4/5] bg-card p-3 pb-10 shadow-lg border border-border rotate-6 cursor-grab active:cursor-grabbing hover:shadow-2xl transition-all"
              >
                <div className="relative w-full h-full bg-muted overflow-hidden">
                  <Image 
                    src="/images/polaroid_collage.png" 
                    alt="Polaroid laughter" 
                    fill 
                    sizes="200px"
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 film-grain" />
                </div>
                <div className="mt-3 text-center font-serif text-[10px] text-foreground tracking-tight">
                  Summer nights with them ❤️
                </div>
              </motion.div>

              {/* Polaroid Photo 2 (Sea travel - top right) */}
              <motion.div
                animate={calculateParallax(0.1)}
                transition={{ type: 'spring', damping: 22, stiffness: 75 }}
                drag
                dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
                whileDrag={{ scale: 1.08, zIndex: 50 }}
                className="absolute top-16 right-10 w-40 aspect-[4/5] bg-card p-2.5 pb-9 shadow-md border border-border -rotate-3 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all"
              >
                <div className="relative w-full h-full bg-muted overflow-hidden">
                  <Image 
                    src="/images/polaroid_collage.png" 
                    alt="Sea side polaroid" 
                    fill 
                    sizes="200px"
                    className="object-cover hue-rotate-15 saturate-125" 
                  />
                  <div className="absolute inset-0 film-grain" />
                </div>
                <div className="mt-2.5 text-center font-mono text-[9px] text-muted-foreground">
                  amalfi. beach days
                </div>
              </motion.div>

              {/* Polaroid Photo 3 (Cozy lighting - bottom left) */}
              <motion.div
                animate={calculateParallax(0.5)}
                transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                drag
                dragConstraints={{ left: -160, right: 160, top: -160, bottom: 160 }}
                whileDrag={{ scale: 1.12, zIndex: 50 }}
                className="absolute bottom-8 left-8 w-38 aspect-[1/1] bg-card p-2.5 pb-8 shadow-xl border border-border -rotate-6 cursor-grab active:cursor-grabbing hover:shadow-2xl transition-all"
              >
                <div className="relative w-full h-full bg-muted overflow-hidden">
                  <Image 
                    src="/images/polaroid_collage.png" 
                    alt="Cozy polaroid" 
                    fill 
                    sizes="180px"
                    className="object-cover scale-110 -translate-x-2" 
                  />
                  <div className="absolute inset-0 film-grain" />
                </div>
                <div className="mt-2 text-center font-mono text-[8px] text-muted-foreground uppercase tracking-widest">
                  Golden hour 17:30
                </div>
              </motion.div>
              
              {/* Interactive hint in bottom right */}
              <div className="absolute bottom-2 right-12 text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1.5 animate-pulse">
                <span>[ Drag photos to arrange ]</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </section>
  )
}
