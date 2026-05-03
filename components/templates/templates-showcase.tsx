'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MagazineTemplate } from '@/lib/magazine-templates'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'Wedding', label: 'Weddings', icon: '◇' },
  { id: 'Travel', label: 'Journeys', icon: '◎' },
  { id: 'Fashion', label: 'Fashion', icon: '◈' },
  { id: 'Portfolio', label: 'Portfolio', icon: '□' },
  { id: 'Luxury', label: 'Luxury', icon: '◆' },
  { id: 'Modern', label: 'Modern', icon: '▪' },
  { id: 'Birthday', label: 'Celebrations', icon: '✧' },
  { id: 'Nostalgic', label: 'Legacy', icon: '◉' },
]

const COLLECTIONS = [
  { id: 'signature-wedding', label: 'Signature Wedding Collection', sub: 'Curated for eternal love stories', accent: 'var(--primary)' },
  { id: 'voyage', label: 'Voyage Collection', sub: 'For the wandering soul', accent: 'var(--secondary)' },
  { id: 'fashion-house', label: 'Fashion House', sub: 'Editorial excellence', accent: 'var(--ink)' },
]

interface TemplateMeta {
  style: string; pages: number; badge: string | null; badgeColor: string
  rating: number; reviews: number; collection?: string; useCase: string
  innerPages: string[]; accentColor: string
}

const META: Record<string, TemplateMeta> = {
  'travel-minimalist': {
    style: 'Editorial', pages: 24, badge: "Editor's Choice", badgeColor: 'var(--primary)',
    rating: 4.9, reviews: 2847, useCase: 'Travel · Memoir', collection: 'voyage',
    innerPages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#8B9E8B',
  },
  'travel-vintage': {
    style: 'Vintage', pages: 20, badge: 'Most Loved', badgeColor: 'var(--terracotta)',
    rating: 4.8, reviews: 1923, useCase: 'Nostalgia · Journey', collection: 'voyage',
    innerPages: [
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#A08060',
  },
  'travel-modern': {
    style: 'Bold Modern', pages: 18, badge: 'New Arrival', badgeColor: 'var(--bottle-green)',
    rating: 4.7, reviews: 3102, useCase: 'Urban · Architecture',
    innerPages: [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: 'var(--primary)',
  },
  'wedding-eternal': {
    style: 'Romantic', pages: 32, badge: 'Bestseller', badgeColor: 'var(--primary)',
    rating: 5.0, reviews: 4218, useCase: 'Wedding · Ceremony', collection: 'signature-wedding',
    innerPages: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#C4A882',
  },
  'fashion-monochrome': {
    style: 'Avant-Garde', pages: 22, badge: 'Luxury Exclusive', badgeColor: 'var(--darkroom)',
    rating: 4.8, reviews: 987, useCase: 'Fashion · Portfolio', collection: 'fashion-house',
    innerPages: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: 'var(--pencil)',
  },
  'baby-tender': {
    style: 'Soft & Warm', pages: 28, badge: 'Most Loved', badgeColor: 'var(--terracotta)',
    rating: 4.9, reviews: 2134, useCase: 'Baby · Milestones',
    innerPages: [
      'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1491013516836-7db643ee125a?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#E8B4A0',
  },
  'portfolio-clean': {
    style: 'Minimal', pages: 16, badge: 'Trending', badgeColor: 'var(--bottle-green)',
    rating: 4.6, reviews: 756, useCase: 'Portfolio · Creative', collection: 'fashion-house',
    innerPages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524781289445-ddf8f5695861?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#AAAAAA',
  },
  'luxury-gold': {
    style: 'Opulent', pages: 30, badge: 'Luxury Exclusive', badgeColor: 'var(--primary)',
    rating: 4.9, reviews: 1402, useCase: 'Gala · Luxury Events',
    innerPages: [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: 'var(--primary)',
  },
}

function getMeta(id: string): TemplateMeta {
  return META[id] || { style: 'Editorial', pages: 20, badge: null, badgeColor: 'var(--primary)', rating: 4.7, reviews: 500, useCase: 'General', innerPages: [], accentColor: 'var(--primary)' }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.07'/%3E%3C/svg%3E")`

// ─── Stars ──────────────────────────────────────────────────────
function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 10 10">
          <path d="M5 .8l.9 2.6h2.8L6.4 5l.9 2.7L5 6.1 2.7 7.7l.9-2.7L1.3 3.4h2.8z"
            fill={i <= Math.round(score) ? 'var(--terracotta)' : 'none'} 
            stroke="var(--terracotta)" 
            strokeWidth="0.8"
            opacity={i <= Math.round(score) ? 1 : 0.2} />
        </svg>
      ))}
    </span>
  )
}

// ─── Preview Modal ───────────────────────────────────────────────
function PreviewModal({ template, onClose }: { template: MagazineTemplate; onClose: () => void }) {
  const meta = getMeta(template.id)
  const pages = [template.thumbnail, ...meta.innerPages]
  const [cur, setCur] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCur(p => Math.min(p + 1, pages.length - 1))
      if (e.key === 'ArrowLeft') setCur(p => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose, pages.length])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300" onClick={onClose}>
      {/* Bar */}
      <div onClick={e => e.stopPropagation()} className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 bg-darkroom/40 backdrop-blur-xl border-b border-white/5 z-20">
        <div>
          <p className="font-serif italic text-2xl text-paper leading-none">{template.name}</p>
          <p className="font-sans uppercase tracking-[0.25em] text-[9px] text-pencil mt-2">{meta.useCase} · {meta.pages} Pages · {meta.style}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={e=>{e.stopPropagation();setZoomed(z=>!z)}} 
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-paper font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
          >
            {zoomed ? 'Fit View' : 'Zoom In'}
          </button>
          <Link 
            href={`/dashboard/templates/use/${template.id}`} 
            onClick={e=>e.stopPropagation()} 
            className="px-6 py-2.5 bg-primary text-primary-foreground font-sans text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
          >
            Use Template
          </Link>
          <button onClick={onClose} className="p-2 text-pencil hover:text-paper transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div onClick={e=>e.stopPropagation()} className="flex-1 w-full flex items-center justify-center p-24 relative overflow-hidden">
        <motion.img 
          key={cur}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={pages[cur]} 
          alt="" 
          className={`max-w-full rounded-sm shadow-[0_40px_120px_rgba(0,0,0,0.9)] select-none transition-all duration-500 ${zoomed ? 'h-full object-contain cursor-zoom-out' : 'max-h-[72vh] cursor-zoom-in'}`}
          draggable={false}
          onClick={() => setZoomed(z => !z)}
        />
        
        {cur > 0 && (
          <button 
            onClick={() => setCur(p=>p-1)} 
            className="absolute left-10 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-paper hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        {cur < pages.length - 1 && (
          <button 
            onClick={() => setCur(p=>p+1)} 
            className="absolute right-10 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-paper hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
      </div>

      {/* Filmstrip */}
      <div onClick={e=>e.stopPropagation()} className="w-full flex justify-center gap-3 py-6 bg-darkroom/60 backdrop-blur-xl border-t border-white/5 overflow-x-auto scrollbar-hide">
        {pages.map((src,i) => (
          <button 
            key={i} 
            onClick={() => setCur(i)} 
            className={`w-14 h-20 shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${i === cur ? 'ring-2 ring-primary ring-offset-2 ring-offset-darkroom opacity-100' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-70'}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Hero Carousel ───────────────────────────────────────────────
function HeroCarousel({ templates }: { templates: MagazineTemplate[] }) {
  const [active, setActive] = useState(0)
  const featured = templates.slice(0, 5)
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p+1) % featured.length), 4000)
    return () => clearInterval(t)
  }, [featured.length])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.img 
          key={featured[active].id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          src={featured[active].thumbnail} 
          alt={featured[active].name} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-br from-darkroom/40 via-transparent to-transparent" />
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {featured.map((_,i) => (
          <button 
            key={i} 
            onClick={() => setActive(i)} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-8 bg-primary' : 'w-1.5 bg-paper/30 hover:bg-paper/50'}`} 
          />
        ))}
      </div>
    </div>
  )
}

// ─── Template Card ───────────────────────────────────────────────
function Card({ template, index, featured, onPreview }: { template:MagazineTemplate;index:number;featured?:boolean;onPreview:()=>void }) {
  const meta = getMeta(template.id)
  const [hov, setHov] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)
  const [tilt, setTilt] = useState({ x:0,y:0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const allP = [template.thumbnail, ...meta.innerPages]
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  useEffect(() => {
    if (hov) { timerRef.current = setInterval(() => setPageIdx(p => (p+1)%allP.length), 1200) }
    else { if (timerRef.current) clearInterval(timerRef.current); setPageIdx(0) }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hov, allP.length])

  const onMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setTilt({ x:((e.clientY-r.top)/r.height-0.5)*8, y:((e.clientX-r.left)/r.width-0.5)*-8 })
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef} 
      className="flex flex-col group"
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => { setHov(false); setTilt({x:0,y:0}) }} 
      onMouseMove={onMove}
    >
      {/* Image Container */}
      <div 
        className="relative overflow-hidden rounded-md transition-all duration-700 ease-[0.22,1,0.36,1] group cursor-pointer aspect-[3/4]"
        style={{ 
          transform: hov ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-10px) scale(1.02)` : 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)',
          boxShadow: hov ? '0 40px 100px rgba(28,24,20,0.22)' : '0 10px 40px rgba(28,24,20,0.08)'
        }}
      >
        <AnimatePresence initial={false}>
          <motion.img 
            key={allP[pageIdx]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            src={allP[pageIdx]} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          />
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/5 via-transparent to-black/60 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        <div className="absolute inset-0 z-[3] film-grain opacity-10 pointer-events-none" />
        
        {/* Shimmer effect */}
        <div className={`absolute inset-0 z-[4] pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-500 ${hov ? 'opacity-100' : 'opacity-0'}`} />

        {/* Badges */}
        {meta.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 rounded-sm text-[8px] font-bold uppercase tracking-[0.2em] shadow-sm" style={{ background: meta.badgeColor, color: '#fff' }}>{meta.badge}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 z-10">
          <span className="px-3 py-1.5 bg-paper/90 backdrop-blur-md border border-white/20 rounded-sm text-ink text-[8px] font-bold uppercase tracking-[0.2em] shadow-sm">{template.category}</span>
        </div>

        {/* Page Indicators */}
        {hov && allP.length > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {allP.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === pageIdx ? 'w-5 bg-paper' : 'w-1 bg-paper/40'}`} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 p-4 transition-all duration-500 ${hov ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="w-full mb-2.5 py-3.5 bg-paper/10 backdrop-blur-2xl border border-paper/20 text-paper font-sans text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-paper/20 transition-colors"
          >
            Visual Preview
          </button>
          <Link 
            href={`/dashboard/templates/use/${template.id}`} 
            className="block w-full py-3.5 bg-primary text-primary-foreground text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:opacity-90 transition-opacity text-decoration-none"
          >
            Start Project
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="py-6 px-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-ink/5 dark:bg-paper/5 border border-ink/10 dark:border-paper/10 rounded-sm text-[8px] font-bold uppercase tracking-[0.25em] text-ink dark:text-paper">{meta.style}</span>
          <span className="text-[9px] font-sans text-pencil uppercase tracking-[0.2em]">{meta.pages} pages · {meta.useCase}</span>
        </div>
        <h3 className="font-serif text-2xl text-ink leading-tight mb-2.5 tracking-tight group-hover:text-primary transition-colors duration-500">{template.name}</h3>
        <p className="font-serif italic text-sm text-pencil line-clamp-2 leading-relaxed mb-5 opacity-80">{template.description}</p>
        <div className="flex items-center gap-3 pt-4 border-t border-linen/50">
          <Stars score={meta.rating} />
          <span className="text-[10px] font-bold text-ink tracking-widest">{meta.rating}</span>
          <div className="w-[1px] h-3 bg-linen" />
          <span className="text-[9px] font-sans uppercase tracking-widest text-pencil/70">{meta.reviews.toLocaleString()} Reviews</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ────────────────────────────────────────────────────────
export function TemplatesShowcase({ templates }: { templates: MagazineTemplate[] }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<MagazineTemplate | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [filterFloat, setFilterFloat] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setRevealed(true), 100); return () => clearTimeout(t) }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setFilterFloat(!e.isIntersecting), { rootMargin:'-64px 0px 0px 0px' })
    if (sentinel.current) obs.observe(sentinel.current)
    return () => obs.disconnect()
  }, [])

  const filtered = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory)

  const featured = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex flex-col border-b border-linen overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 film-grain opacity-30 pointer-events-none z-0" />
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Floating cards deco */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [-4, -6, -4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-2%] top-[15%] w-48 aspect-[3/4] bg-primary/10 rounded-md border border-primary/20 backdrop-blur-3xl z-[1] opacity-40 hidden xl:block" 
        />
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [2, 5, 2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[5%] bottom-[15%] w-32 aspect-[3/4] bg-ink/5 rounded-md border border-ink/10 backdrop-blur-3xl z-[1] opacity-30 hidden xl:block" 
        />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-8 flex-1 grid lg:grid-cols-2 gap-16 items-center py-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Template Atelier</span>
              <div className="h-[1px] w-12 bg-primary/30" />
            </div>
            
            <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] text-ink tracking-tight mb-6">
              Curated Designs for <br />
              <span className="italic font-medium text-terracotta">Eternal Stories</span>
            </h1>
            
            <p className="font-serif italic text-lg md:text-xl text-pencil max-w-md leading-relaxed mb-8">
              Transform your digital gallery into a museum-grade publication. Inspired by high-fashion editorial excellence.
            </p>

            <div className="flex flex-wrap gap-10 mb-10">
              {[{n:'10k+',l:'Prints Crafted'},{n:'4.9/5',l:'Artist Rating'},{n:'40+',l:'Master Layouts'}].map(s=>(
                <div key={s.l}>
                  <p className="font-serif text-2xl text-ink mb-0.5">{s.n}</p>
                  <p className="font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-pencil">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#tpl-grid" className="px-8 py-4 bg-ink text-paper rounded-sm font-sans text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-terracotta transition-colors duration-500 shadow-xl shadow-ink/10">
                Explore The Collection
              </a>
              <a href="#tpl-grid" className="px-8 py-4 bg-transparent border border-linen text-ink rounded-sm font-sans text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-linen transition-colors duration-500">
                View Anthology
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[3/4] max-h-[500px] hidden lg:block"
          >
            <div className="absolute inset-0 bg-ink/10 rounded-lg translate-x-4 translate-y-4 blur-3xl" />
            <div className="relative w-full h-full rounded-lg border border-linen overflow-hidden shadow-2xl">
              <HeroCarousel templates={templates} />
            </div>
            {/* Floating UI element */}
            <div className="absolute -bottom-6 -left-6 p-4 bg-paper/80 backdrop-blur-2xl border border-linen rounded-sm shadow-xl max-w-[180px] animate-bounce-slow">
              <p className="font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Editor's Choice</p>
              <p className="font-serif italic text-xs text-ink leading-tight">"A masterclass in editorial balance."</p>
            </div>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="py-6 border-t border-linen bg-paper/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee-slower gap-20 items-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-20 items-center">
                {["Museum-Grade Typography","◆","Heirloom Quality Design","◆","Editor's Choice Templates","◆","Trusted by 10k+ Creators","◆"].map((t,idx)=>(
                  <span key={idx} className={`font-sans text-[10px] font-bold uppercase tracking-[0.3em] ${t==='◆'?'text-primary':'text-pencil/60'}`}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE + GRID ─────────────────────────────────────────── */}
      <section id="tpl-grid" className="max-w-[1400px] mx-auto px-8 py-24">
        <div ref={sentinel} className="h-1" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Catalog</span>
          <h2 className="font-serif text-4xl md:text-5xl text-ink mt-4 mb-6">Anthology of Styles</h2>
          <div className="h-[1px] w-24 bg-primary/20 mx-auto" />
        </motion.div>

        {/* Filter Bar */}
        <div className={`sticky top-20 z-40 mb-16 transition-all duration-500 ${filterFloat ? 'px-6 py-4 bg-paper/80 backdrop-blur-3xl border border-linen shadow-xl shadow-ink/5 rounded-full' : ''}`}>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-1">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                className={`px-6 py-3 rounded-full font-sans text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border ${activeCategory===cat.id ? 'bg-ink text-paper border-ink shadow-lg shadow-ink/20' : 'bg-paper/50 text-pencil border-linen hover:border-primary hover:text-ink'}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="mr-2 opacity-60">{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-40 flex flex-col items-center text-center"
          >
            <div className="w-20 h-[1px] bg-linen mb-8" />
            <p className="font-serif italic text-2xl text-pencil mb-4">Curating New Arrivals</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-pencil/50 max-w-xs leading-loose">
              Our designers are currently crafting new museum-grade layouts for this category.
            </p>
            <button 
              onClick={() => setActiveCategory('all')}
              className="mt-10 px-8 py-4 border border-linen text-ink font-sans text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-linen transition-colors"
            >
              Return to Anthology
            </button>
          </motion.div>
        )}

        {/* Featured "Adventure" Section */}
        <AnimatePresence mode="popLayout">
          {(activeCategory === 'all' || activeCategory === 'Travel') && (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-24"
            >
              <div className="flex items-center gap-6 mb-8">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-primary whitespace-nowrap">Signature Masterpiece</span>
                <div className="h-[1px] flex-1 bg-linen" />
              </div>
              
              <Link href="/dashboard/templates/use/adventure-travel" className="group block relative rounded-xl overflow-hidden bg-ink min-h-[420px] shadow-2xl transition-transform duration-700 hover:scale-[1.01]">
                <div className="absolute inset-0 z-0">
                  <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop" alt="Adventure" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
                  <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
                </div>
                
                <div className="relative z-10 h-full p-10 lg:p-16 flex flex-col justify-between max-w-3xl">
                  <div>
                    <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-primary/20 border border-primary/30 backdrop-blur-xl rounded-sm mb-6">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-foreground">Platinum Tier</span>
                    </div>
                    <h3 className="font-serif text-[clamp(2rem,6vw,4.5rem)] leading-none text-paper tracking-tighter mb-6 group-hover:translate-x-4 transition-transform duration-700 uppercase">Adventure</h3>
                    <p className="font-serif italic text-lg text-paper/70 leading-relaxed mb-8 max-w-md">Bold editorial travel magazine with cinematic full-bleed layouts.</p>
                    <div className="flex items-center gap-5 mb-8">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => <span key={i} className="text-primary text-xl">✦</span>)}
                      </div>
                      <span className="font-sans text-xs text-paper/50 tracking-widest uppercase">4.9 · Trusted by 12,847 Creators</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <span className="px-8 py-4 bg-paper text-ink font-sans text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm group-hover:bg-primary group-hover:text-paper transition-colors duration-500">Customize Now</span>
                    <div className="hidden sm:flex -space-x-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-14 h-18 bg-paper/10 border border-paper/20 backdrop-blur-xl rounded-sm overflow-hidden rotate-${i * 3} transform group-hover:rotate-0 transition-transform duration-500 shadow-xl`}>
                          <img src={`https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop`} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Row */}
        <AnimatePresence mode="popLayout">
          {featured.length > 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-20"
            >
              <div className="flex items-center gap-6 mb-10">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-primary whitespace-nowrap">Editorial Selection</span>
                <div className="h-[1px] flex-1 bg-linen" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {featured.map((t,i) => <Card key={t.id} template={t} index={i} featured onPreview={() => setPreviewTemplate(t)} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Collection Grid */}
        <AnimatePresence mode="popLayout">
          {rest.length > 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-6 mb-10">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-pencil whitespace-nowrap">Anthology Catalog</span>
                <div className="h-[1px] flex-1 bg-linen" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {rest.map((t,i) => <Card key={t.id} template={t} index={i+2} onPreview={() => setPreviewTemplate(t)} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collections Section */}
        {activeCategory === 'all' && (
          <div className="mt-40 pt-40 border-t border-linen">
            <div className="text-center mb-20">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Curation</span>
              <h2 className="font-serif text-4xl md:text-5xl text-ink mt-4 mb-6">Browse Collections</h2>
              <p className="font-serif italic text-xl text-pencil max-w-xl mx-auto">Explore thoughtfully assembled design families, each with a distinct editorial voice.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {COLLECTIONS.map(col => {
                const colTs = templates.filter(t => META[t.id]?.collection === col.id)
                const prev = colTs[0]
                return (
                  <div key={col.id} className="group relative aspect-[16/10] overflow-hidden rounded-md border border-linen cursor-pointer" onClick={() => {
                    const found = CATEGORIES.find(c => colTs.some(t => (c.id==='Weddings'&&t.category==='Wedding')||(c.id==='Travel'&&t.category==='Travel')||c.id===t.category))
                    if (found) setActiveCategory(found.id)
                    document.getElementById('tpl-grid')?.scrollIntoView({ behavior:'smooth' })
                  }}>
                    {prev && <img src={prev.thumbnail} alt={col.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                    <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="h-0.5 w-10 bg-primary mb-4 group-hover:w-16 transition-all duration-500" />
                      <h4 className="font-serif text-2xl text-paper mb-1 tracking-tight">{col.label}</h4>
                      <p className="font-serif italic text-sm text-paper/60 mb-4">{col.sub}</p>
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                        {colTs.length} Designs <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <section className="mt-40 -mx-8 px-8 py-40 bg-ink relative overflow-hidden">
          <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="h-[1px] w-20 bg-primary/40 mx-auto mb-10" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-terracotta">Your Journey Starts Here</span>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-paper leading-tight mt-6 mb-10 tracking-tight">
              Every memory deserves <br />
              <span className="italic">extraordinary canvas.</span>
            </h2>
            <p className="font-serif italic text-xl text-paper/50 max-w-2xl mx-auto leading-relaxed mb-16">
              Pick a template, upload your story, and receive a museum-grade magazine that preserves your legacy for generations.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => window.scrollTo({top:0,behavior:'smooth'})}
                className="px-12 py-5 bg-paper text-ink font-sans text-[11px] font-bold uppercase tracking-[0.3em] rounded-sm hover:bg-terracotta hover:text-paper transition-all duration-500 shadow-2xl"
              >
                Browse All Layouts
              </button>
              <button 
                onClick={() => templates[0] && setPreviewTemplate(templates[0])}
                className="px-12 py-5 bg-transparent border border-paper/20 text-paper font-sans text-[11px] font-bold uppercase tracking-[0.3em] rounded-sm hover:bg-paper/5 transition-colors"
              >
                Visual Sample
              </button>
            </div>
          </div>
        </section>
      </section>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewTemplate && (
          <PreviewModal 
            template={previewTemplate} 
            onClose={() => setPreviewTemplate(null)} 
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes marquee-slower {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee-slower {
          animation: marquee-slower 60s linear infinite;
          width: max-content;
        }
        .animate-bounce-slow {
          animation: bounce 4s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
