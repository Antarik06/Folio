'use client'

import { motion } from 'framer-motion'

export function AuthVisualPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-darkroom text-paper relative flex-col justify-between p-16 overflow-hidden border-l border-linen/10">
      {/* Film grain and background ambient glow */}
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Atelier of Print</span>
      </div>

      {/* Center piece - Artistic floating composition */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-12">
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
          {/* Animated Background Shutter lines */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute w-72 h-72 rounded-full border border-linen/5 flex items-center justify-center"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-[1px] bg-linen/10"
                style={{ transform: `rotate(${i * 30}deg)` }}
              />
            ))}
            <div className="w-48 h-48 rounded-full border border-linen/10 border-dashed" />
          </motion.div>

          {/* Floating Card 1: Minimalist Camera Iris Aperture */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="absolute top-4 left-6 bg-[#252019]/90 border border-linen/15 backdrop-blur-xl p-5 shadow-2xl rounded-sm w-52"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-mono text-primary uppercase tracking-widest">Aperture f/1.8</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <div className="aspect-video bg-darkroom/40 border border-linen/5 rounded-xs flex items-center justify-center overflow-hidden relative group">
              <svg className="w-10 h-10 text-linen/20" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
            <p className="font-serif italic text-xs text-paper/80 mt-3">"Catch the softest hour."</p>
          </motion.div>

          {/* Floating Card 2: Polaroid Frame mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 6 }}
            animate={{ opacity: 1, y: 0, rotate: 8 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="absolute bottom-6 right-6 bg-[#F5F0E8] text-[#1C1814] p-4 shadow-3xl rounded-sm w-48 polaroid transform hover:scale-105 hover:rotate-6 transition-all duration-300"
          >
            <div className="aspect-square bg-[#E5DEC9] overflow-hidden relative mb-4">
              {/* Abstract layout inside the polaroid */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 mix-blend-multiply" />
              <div className="absolute inset-4 border border-paper/30 flex items-center justify-center">
                <span className="font-serif italic text-[10px] text-paper/70 tracking-widest">VOL. I</span>
              </div>
            </div>
            <div className="font-serif text-[10px] tracking-tight leading-none text-ink/70">
              Tuscany, Late August
            </div>
          </motion.div>

          {/* Floating Card 3: Brand Text Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            className="absolute z-20 bg-darkroom/90 border border-primary/30 backdrop-blur-2xl p-6 shadow-2xl rounded-sm max-w-[220px] text-center"
          >
            <h4 className="font-serif italic text-lg text-paper mb-1.5 leading-none">Designed to Last</h4>
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-pencil leading-relaxed">
              Curate digital assets. Design spreads instantly. Receive a museum-grade book.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer copywriting */}
      <div className="relative z-10">
        <h2 className="font-serif text-3xl md:text-4xl text-paper tracking-tight mb-4 leading-tight">
          A physical archive of <br />
          your <span className="italic text-primary">most beautiful days.</span>
        </h2>
        <p className="text-pencil text-xs leading-relaxed max-w-sm">
          Transform your digital photo collections into stunning print publications. Beautiful layouts, premium papers, and fine ink binding.
        </p>
      </div>
    </div>
  )
}
