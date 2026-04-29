'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MagazineTemplate } from '@/lib/magazine-templates'

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'Weddings', label: 'Weddings', icon: '◇' },
  { id: 'Travel', label: 'Journeys', icon: '◎' },
  { id: 'Editorial', label: 'Editorial', icon: '▲' },
  { id: 'Fashion', label: 'Fashion', icon: '◈' },
  { id: 'Birthday', label: 'Celebrations', icon: '✧' },
  { id: 'Portfolio', label: 'Portfolio', icon: '□' },
  { id: 'Minimal', label: 'Minimal', icon: '—' },
  { id: 'Luxury', label: 'Luxury', icon: '◆' },
  { id: 'Modern', label: 'Modern', icon: '▪' },
  { id: 'Nostalgic', label: 'Legacy', icon: '◉' },
]

const COLLECTIONS = [
  { id: 'signature-wedding', label: 'Signature Wedding Collection', sub: 'Curated for eternal love stories', accent: '#C9A84C' },
  { id: 'voyage', label: 'Voyage Collection', sub: 'For the wandering soul', accent: '#3A7D6E' },
  { id: 'fashion-house', label: 'Fashion House', sub: 'Editorial excellence', accent: '#1C1814' },
]

interface TemplateMeta {
  style: string; pages: number; badge: string | null; badgeColor: string
  rating: number; reviews: number; collection?: string; useCase: string
  innerPages: string[]; accentColor: string
}

const META: Record<string, TemplateMeta> = {
  'travel-minimalist': {
    style: 'Editorial', pages: 24, badge: "Editor's Choice", badgeColor: '#C9A84C',
    rating: 4.9, reviews: 2847, useCase: 'Travel · Memoir', collection: 'voyage',
    innerPages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#8B9E8B',
  },
  'travel-vintage': {
    style: 'Vintage', pages: 20, badge: 'Most Loved', badgeColor: '#B85C38',
    rating: 4.8, reviews: 1923, useCase: 'Nostalgia · Journey', collection: 'voyage',
    innerPages: [
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#A08060',
  },
  'travel-modern': {
    style: 'Bold Modern', pages: 18, badge: 'New Arrival', badgeColor: '#3A7D6E',
    rating: 4.7, reviews: 3102, useCase: 'Urban · Architecture',
    innerPages: [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#D4A853',
  },
  'wedding-eternal': {
    style: 'Romantic', pages: 32, badge: 'Bestseller', badgeColor: '#C9A84C',
    rating: 5.0, reviews: 4218, useCase: 'Wedding · Ceremony', collection: 'signature-wedding',
    innerPages: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#C4A882',
  },
  'fashion-monochrome': {
    style: 'Avant-Garde', pages: 22, badge: 'Luxury Exclusive', badgeColor: '#1C1814',
    rating: 4.8, reviews: 987, useCase: 'Fashion · Portfolio', collection: 'fashion-house',
    innerPages: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#888888',
  },
  'baby-tender': {
    style: 'Soft & Warm', pages: 28, badge: 'Most Loved', badgeColor: '#B85C38',
    rating: 4.9, reviews: 2134, useCase: 'Baby · Milestones',
    innerPages: [
      'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1491013516836-7db643ee125a?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#E8B4A0',
  },
  'portfolio-clean': {
    style: 'Minimal', pages: 16, badge: 'Trending', badgeColor: '#3A7D6E',
    rating: 4.6, reviews: 756, useCase: 'Portfolio · Creative', collection: 'fashion-house',
    innerPages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524781289445-ddf8f5695861?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#AAAAAA',
  },
  'luxury-gold': {
    style: 'Opulent', pages: 30, badge: 'Luxury Exclusive', badgeColor: '#C9A84C',
    rating: 4.9, reviews: 1402, useCase: 'Gala · Luxury Events',
    innerPages: [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=700&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=700&auto=format&fit=crop',
    ],
    accentColor: '#C9A84C',
  },
}

function getMeta(id: string): TemplateMeta {
  return META[id] || { style: 'Editorial', pages: 20, badge: null, badgeColor: '#C9A84C', rating: 4.7, reviews: 500, useCase: 'General', innerPages: [], accentColor: '#C9A84C' }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.07'/%3E%3C/svg%3E")`

// ─── Stars ──────────────────────────────────────────────────────
function Stars({ score }: { score: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="9" height="9" viewBox="0 0 9 9">
          <path d="M4.5.8l.9 2.6H8L5.8 5l.9 2.7-2.2-1.6L2.3 7.7l.9-2.7L1 3.4h2.6z"
            fill={i <= Math.round(score) ? '#C9A84C' : 'none'} stroke="#C9A84C" strokeWidth="0.6"
            opacity={i <= Math.round(score) ? 1 : 0.3} />
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
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(8,7,6,0.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',backdropFilter:'blur(20px)',animation:'mIn 0.35s ease forwards' }} onClick={onClose}>
      <style>{`@keyframes mIn{from{opacity:0}to{opacity:1}} @keyframes pIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}`}</style>

      {/* Bar */}
      <div onClick={e => e.stopPropagation()} style={{ position:'absolute',top:0,left:0,right:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 32px',borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(8,7,6,0.8)',backdropFilter:'blur(16px)',zIndex:10 }}>
        <div>
          <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,color:'#F5F0E8',fontStyle:'italic' }}>{template.name}</p>
          <p style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.25em',textTransform:'uppercase',color:'#7A6F64',marginTop:3 }}>{meta.useCase} · {meta.pages} Pages · {meta.style}</p>
        </div>
        <div style={{ display:'flex',gap:10,alignItems:'center' }}>
          <button onClick={e=>{e.stopPropagation();setZoomed(z=>!z)}} style={{ background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#F5F0E8',padding:'8px 14px',fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer',borderRadius:2 }}>{zoomed?'Fit':'Zoom'}</button>
          <Link href={`/dashboard/templates/use/${template.id}`} onClick={e=>e.stopPropagation()} style={{ background:'#C9A84C',color:'#1C1814',padding:'9px 22px',borderRadius:2,fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',fontWeight:700,textDecoration:'none' }}>Use Template</Link>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#7A6F64',cursor:'pointer',fontSize:20,padding:'4px 8px',lineHeight:1 }}>✕</button>
        </div>
      </div>

      {/* Viewer */}
      <div onClick={e=>e.stopPropagation()} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'80px 100px 100px',position:'relative' }}>
        <img key={cur} src={pages[cur]} alt="" style={{ maxHeight:zoomed?'100%':'74vh',maxWidth:'100%',objectFit:'contain',borderRadius:4,boxShadow:'0 40px 120px rgba(0,0,0,0.85)',animation:'pIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards',userSelect:'none',cursor:'grab' }} draggable={false} />
        {cur > 0 && <button onClick={() => setCur(p=>p-1)} style={{ position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#F5F0E8',width:48,height:48,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>‹</button>}
        {cur < pages.length - 1 && <button onClick={() => setCur(p=>p+1)} style={{ position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#F5F0E8',width:48,height:48,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>›</button>}
      </div>

      {/* Filmstrip */}
      <div onClick={e=>e.stopPropagation()} style={{ position:'absolute',bottom:0,left:0,right:0,display:'flex',justifyContent:'center',gap:8,padding:'14px 32px',background:'rgba(8,7,6,0.85)',backdropFilter:'blur(12px)',borderTop:'1px solid rgba(255,255,255,0.05)',overflowX:'auto' }}>
        {pages.map((src,i) => (
          <button key={i} onClick={() => setCur(i)} style={{ width:50,height:66,flexShrink:0,padding:0,border:'none',cursor:'pointer',borderRadius:2,outline:i===cur?'2px solid #C9A84C':'1px solid rgba(255,255,255,0.1)',outlineOffset:i===cur?2:0,overflow:'hidden',opacity:i===cur?1:0.45,transition:'all 0.2s ease' }}>
            <img src={src} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
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
    const t = setInterval(() => setActive(p => (p+1) % featured.length), 3500)
    return () => clearInterval(t)
  }, [featured.length])
  return (
    <div style={{ position:'relative',width:'100%',height:'100%',borderRadius:8,overflow:'hidden' }}>
      {featured.map((t,i) => (
        <img key={t.id} src={t.thumbnail} alt={t.name} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:i===active?1:0,transform:i===active?'scale(1.04)':'scale(1)',transition:'opacity 1.4s ease, transform 5s ease' }} />
      ))}
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(28,24,20,0.25) 0%,transparent 60%)' }} />
      <div style={{ position:'absolute',inset:0,backgroundImage:GRAIN,opacity:0.5,pointerEvents:'none' }} />
      <div style={{ position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6,zIndex:5 }}>
        {featured.map((_,i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width:i===active?22:6,height:6,borderRadius:4,background:i===active?'#C9A84C':'rgba(255,255,255,0.4)',border:'none',cursor:'pointer',padding:0,transition:'all 0.3s ease' }} />
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
    if (hov) { timerRef.current = setInterval(() => setPageIdx(p => (p+1)%allP.length), 1100) }
    else { if (timerRef.current) clearInterval(timerRef.current); setPageIdx(0) }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hov, allP.length])

  const onMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setTilt({ x:((e.clientY-r.top)/r.height-0.5)*10, y:((e.clientX-r.left)/r.width-0.5)*-10 })
  }

  const tf = hov
    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-8px) scale(1.02)`
    : 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)'

  return (
    <div ref={cardRef} className="tpl-card" style={{ display:'flex',flexDirection:'column',animationDelay:`${index*60}ms` }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setTilt({x:0,y:0}) }} onMouseMove={onMove}>
      {/* Image */}
      <div style={{ position:'relative',aspectRatio:featured?'2/3':'3/4',overflow:'hidden',borderRadius:6,
        boxShadow:hov?'0 40px 100px rgba(28,24,20,0.28),0 12px 32px rgba(28,24,20,0.16)':'0 8px 40px rgba(28,24,20,0.12),0 2px 8px rgba(28,24,20,0.06)',
        transform:tf,transition:'transform 0.5s cubic-bezier(0.22,1,0.36,1),box-shadow 0.5s ease',cursor:'pointer',willChange:'transform' }}>
        {allP.map((src,i) => (
          <img key={src} src={src} alt="" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
            opacity:i===pageIdx?1:0,
            transform:i===pageIdx&&hov?'scale(1.05)':'scale(1)',
            transition:'opacity 0.7s ease, transform 0.8s ease' }} />
        ))}
        {/* shimmer on hover enter */}
        <div style={{ position:'absolute',inset:0,zIndex:4,pointerEvents:'none',
          background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.09) 50%,transparent 60%)',
          backgroundSize:'200% 100%',opacity:hov?1:0,transition:'opacity 0.3s ease' }} />
        <div style={{ position:'absolute',inset:0,zIndex:2,background:'linear-gradient(to bottom,rgba(0,0,0,0.04) 0%,transparent 35%,rgba(0,0,0,0.62) 100%)',opacity:hov?1:0.45,transition:'opacity 0.4s ease' }} />
        <div style={{ position:'absolute',inset:0,zIndex:3,backgroundImage:GRAIN,opacity:0.4,pointerEvents:'none' }} />
        {meta.badge && (
          <div style={{ position:'absolute',top:14,left:14,zIndex:10 }}>
            <span style={{ background:meta.badgeColor,color:meta.badgeColor==='#1C1814'?'#F5F0E8':'#1C1814',fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',padding:'4px 10px',borderRadius:2 }}>{meta.badge}</span>
          </div>
        )}
        <div style={{ position:'absolute',top:14,right:14,zIndex:10 }}>
          <span style={{ background:'rgba(253,250,245,0.9)',backdropFilter:'blur(8px)',color:'#1C1814',fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',padding:'4px 10px',borderRadius:2,border:'1px solid rgba(255,255,255,0.3)' }}>{template.category}</span>
        </div>
        {hov && allP.length > 1 && (
          <div style={{ position:'absolute',bottom:70,left:'50%',transform:'translateX(-50%)',zIndex:10,display:'flex',gap:5 }}>
            {allP.map((_,i) => <div key={i} style={{ width:i===pageIdx?18:5,height:5,borderRadius:3,background:i===pageIdx?'#FDFAF5':'rgba(253,250,245,0.4)',transition:'all 0.3s ease' }} />)}
          </div>
        )}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,zIndex:10,padding:'12px 14px',opacity:hov?1:0,transform:hov?'translateY(0)':'translateY(14px)',transition:'opacity 0.35s ease,transform 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
          <button onClick={onPreview} style={{ display:'block',width:'100%',marginBottom:7,background:'rgba(253,250,245,0.12)',backdropFilter:'blur(16px)',border:'1px solid rgba(253,250,245,0.22)',color:'#FDFAF5',fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',padding:'11px',borderRadius:3,cursor:'pointer' }}>Preview Layout</button>
          <Link href={`/dashboard/templates/use/${template.id}`} style={{ display:'block',width:'100%',textAlign:'center',background:'#C9A84C',color:'#1C1814',fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',padding:'11px',borderRadius:3,textDecoration:'none' }}>Use This Template</Link>
        </div>
      </div>
      {/* Info */}
      <div style={{ padding:'14px 2px 0' }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:5 }}>
          <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:meta.accentColor,padding:'3px 8px',borderRadius:2,background:`${meta.accentColor}18`,border:`1px solid ${meta.accentColor}28` }}>{meta.style}</span>
          <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,color:'#7A6F64',letterSpacing:'0.12em' }}>{meta.pages} pages · {meta.useCase}</span>
        </div>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:featured?22:18,fontWeight:400,color:'#1C1814',lineHeight:1.2,marginBottom:5,letterSpacing:'-0.01em' }}>{template.name}</h3>
        <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:13,color:'#7A6F64',lineHeight:1.6,marginBottom:9,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{template.description}</p>
        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
          <Stars score={meta.rating} />
          <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:10,fontWeight:700,color:'#1C1814' }}>{meta.rating}</span>
          <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:9,color:'#7A6F64' }}>({meta.reviews.toLocaleString()})</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────
export function TemplatesShowcase({ templates }: { templates: MagazineTemplate[] }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<MagazineTemplate | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [filterFloat, setFilterFloat] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setRevealed(true), 80); return () => clearTimeout(t) }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setFilterFloat(!e.isIntersecting), { rootMargin:'-64px 0px 0px 0px' })
    if (sentinel.current) obs.observe(sentinel.current)
    return () => obs.disconnect()
  }, [])

  const filtered = activeCategory === 'all' ? templates : templates.filter(t => {
    if (activeCategory === 'Weddings') return t.category === 'Wedding'
    if (activeCategory === 'Travel') return t.category === 'Travel'
    if (activeCategory === 'Editorial') return ['Editorial','Fashion'].includes(t.category)
    return t.category === activeCategory
  })

  const featured = filtered.slice(0,2)
  const rest = filtered.slice(2)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        .tpl-card { opacity:0; transform:translateY(22px); animation:tplReveal 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes tplReveal { to { opacity:1; transform:translateY(0); } }
        @keyframes hFade { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes fltA { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-12px) rotate(-6deg)} }
        @keyframes fltB { 0%,100%{transform:translateY(0) rotate(4deg)} 50%{transform:translateY(-9px) rotate(4deg)} }
        @keyframes fltC { 0%,100%{transform:translateY(0) rotate(10deg)} 50%{transform:translateY(-14px) rotate(10deg)} }
        @keyframes gPulse { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes marq { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes mIn { from{opacity:0} to{opacity:1} }

        .fpill { display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:100px;white-space:nowrap;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;cursor:pointer;transition:all 0.28s cubic-bezier(0.22,1,0.36,1);border:1.5px solid #DDD8CE;background:rgba(253,250,245,0.7);color:#7A6F64; }
        .fpill:hover { color:#1C1814;border-color:#C9A84C;background:rgba(201,168,76,0.07);box-shadow:0 0 0 4px rgba(201,168,76,0.08); }
        .fpill.active { background:#1C1814;color:#F5F0E8;border-color:#1C1814;box-shadow:0 6px 20px rgba(28,24,20,0.22); }

        .mq-inner { display:flex;gap:56px;align-items:center;animation:marq 30s linear infinite;width:max-content; }
        .gold-line { width:50px;height:1px;background:linear-gradient(90deg,transparent,#C9A84C 40%,#C9A84C 60%,transparent); }
        .eyebrow { font-family:'Montserrat',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.38em;text-transform:uppercase;color:#C9A84C; }
        .hl { font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.4rem,4vw,4.5rem);line-height:1.07;letter-spacing:-0.025em;color:#1C1814;font-weight:400; }
        .sub { font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(1rem,1.3vw,1.2rem);line-height:1.78;color:#7A6F64;font-weight:300;font-style:italic; }
        .coll-card { position:relative;overflow:hidden;border-radius:6px;cursor:pointer;aspectRatio:16/9;box-shadow:0 8px 32px rgba(28,24,20,0.1);transition:transform 0.35s cubic-bezier(0.22,1,0.36,1),box-shadow 0.35s ease; }
        .coll-card:hover { transform:translateY(-5px);box-shadow:0 22px 60px rgba(28,24,20,0.2); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ position:'relative',overflow:'hidden',background:'#F5F0E8',borderBottom:'1px solid #DDD8CE',minHeight:'88vh',display:'flex',flexDirection:'column' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:GRAIN,opacity:0.35,pointerEvents:'none',zIndex:0 }} />
        {/* floating ghost stacks */}
        <div style={{ position:'absolute',right:'-3%',top:'10%',width:200,zIndex:1,animation:'fltA 8s ease-in-out infinite',opacity:0.08 }}><div style={{ aspectRatio:'3/4',background:'#C9A84C',borderRadius:5 }} /></div>
        <div style={{ position:'absolute',right:'12%',top:'-3%',width:120,zIndex:1,animation:'fltB 10s ease-in-out infinite',opacity:0.06 }}><div style={{ aspectRatio:'3/4',background:'#1C1814',borderRadius:5 }} /></div>
        <div style={{ position:'absolute',left:'-2%',bottom:'14%',width:90,zIndex:1,animation:'fltC 12s ease-in-out infinite',opacity:0.05 }}><div style={{ aspectRatio:'3/4',background:'#B85C38',borderRadius:5 }} /></div>
        {/* ambient glow */}
        <div style={{ position:'absolute',top:'25%',left:'22%',width:700,height:450,background:'radial-gradient(ellipse,rgba(201,168,76,0.06) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }} />

        {/* 2-column layout */}
        <div style={{ position:'relative',zIndex:2,maxWidth:1320,margin:'0 auto',width:'100%',padding:'84px 40px 60px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center',flex:1 }}>
          {/* Left */}
          <div style={{ opacity:revealed?1:0,transform:revealed?'none':'translateY(22px)',transition:'opacity 0.8s ease,transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
            <p className="eyebrow" style={{ marginBottom:18 }}>Template Atelier</p>
            <div className="gold-line" style={{ marginBottom:24 }} />
            <h1 className="hl" style={{ marginBottom:22 }}>
              Curated Templates<br />for <em>Timeless Stories</em>
            </h1>
            <p className="sub" style={{ maxWidth:460,marginBottom:40 }}>
              Craft your memories through professionally designed magazine experiences — inspired by editorial excellence and high-fashion aesthetics.
            </p>
            {/* Stats */}
            <div style={{ display:'flex',gap:36,marginBottom:44 }}>
              {[{n:'10K+',l:'Publications Created'},{n:'98%',l:'Satisfaction Rate'},{n:'40+',l:'Curated Templates'}].map(s=>(
                <div key={s.l}>
                  <p style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:400,color:'#1C1814',lineHeight:1 }}>{s.n}</p>
                  <p style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:'#7A6F64',marginTop:5 }}>{s.l}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
              <a href="#tpl-grid" style={{ display:'inline-flex',alignItems:'center',gap:10,background:'#1C1814',color:'#F5F0E8',padding:'14px 30px',borderRadius:3,fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',textDecoration:'none' }}>
                Explore Collection
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#tpl-grid" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'transparent',color:'#1C1814',padding:'14px 22px',borderRadius:3,fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',textDecoration:'none',border:'1.5px solid #DDD8CE' }}>View Collections</a>
            </div>
          </div>
          {/* Right: carousel */}
          <div style={{ aspectRatio:'3/4',maxHeight:560,opacity:revealed?1:0,transform:revealed?'translateY(0) rotate(2deg)':'translateY(32px) rotate(2deg)',transition:'opacity 0.9s ease 0.12s,transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.12s',boxShadow:'0 32px 80px rgba(28,24,20,0.22),-12px 12px 0 rgba(201,168,76,0.1)',borderRadius:8,overflow:'hidden' }}>
            <HeroCarousel templates={templates} />
          </div>
        </div>

        {/* Marquee strip */}
        <div style={{ borderTop:'1px solid #DDD8CE',background:'rgba(253,250,245,0.65)',backdropFilter:'blur(8px)',padding:'14px 0',overflow:'hidden',position:'relative',zIndex:2 }}>
          <div className="mq-inner">
            {["Editor's Choice Templates","◆","Heirloom Quality Design","◆","Print-Ready Layouts","◆","Trusted by 10,000+ Creators","◆","Curated by Design Experts","◆","Museum-Grade Typography","◆","Editor's Choice Templates","◆","Heirloom Quality Design","◆","Print-Ready Layouts","◆","Trusted by 10,000+ Creators","◆","Curated by Design Experts","◆","Museum-Grade Typography","◆"].map((t,i)=>(
              <span key={i} style={{ fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:t==='◆'?400:600,letterSpacing:'0.2em',textTransform:'uppercase',color:t==='◆'?'#C9A84C':'#7A6F64',animation:t==='◆'?'gPulse 2s ease-in-out infinite':undefined }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── BROWSE + GRID ─────────────────────────────────────────── */}
      <div id="tpl-grid" style={{ maxWidth:1320,margin:'0 auto',padding:'0 40px' }}>
        <div ref={sentinel} style={{ height:1,marginTop:52 }} />

        {/* Section label */}
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <p className="eyebrow">Browse the Collection</p>
          <div className="gold-line" style={{ margin:'14px auto 0' }} />
        </div>

        {/* Filter bar */}
        <div style={{
          position:filterFloat?'sticky':'relative', top:filterFloat?64:undefined, zIndex:40,
          background:filterFloat?'rgba(245,240,232,0.97)':'transparent', backdropFilter:filterFloat?'blur(20px)':undefined,
          borderBottom:filterFloat?'1px solid #DDD8CE':'none', boxShadow:filterFloat?'0 4px 30px rgba(28,24,20,0.07)':'none',
          padding:filterFloat?'12px 0':'0 0 36px',
          marginLeft:filterFloat?-40:0,marginRight:filterFloat?-40:0,
          paddingLeft:filterFloat?40:undefined,paddingRight:filterFloat?40:undefined,
          transition:'box-shadow 0.3s ease',
        }}>
          <div style={{ display:'flex',gap:8,overflowX:'auto',paddingBottom:4 }} className="scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat.id} className={`fpill${activeCategory===cat.id?' active':''}`} onClick={() => setActiveCategory(cat.id)}>
                <span style={{ fontSize:10,lineHeight:1 }}>{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding:'80px 0',textAlign:'center' }}>
            <p className="sub">No templates in this collection yet — more arriving soon.</p>
          </div>
        )}

        {/* ADVENTURE HERO CARD */}
        {(activeCategory === 'all' || activeCategory === 'Travel') && (
          <div style={{ marginBottom:48 }}>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:22 }}>
              <div className="gold-line" style={{ flex:'none' }} />
              <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.3em',textTransform:'uppercase',color:'#C9A84C',flex:'none' }}>Highest Selling</span>
              <div style={{ flex:1,height:1,background:'#DDD8CE' }} />
            </div>
            <a href="/dashboard/templates/adventure" style={{ textDecoration:'none',display:'block' }}>
              <div style={{ position:'relative',borderRadius:8,overflow:'hidden',background:'#1C1814',minHeight:360,boxShadow:'0 24px 80px rgba(28,24,20,0.22)',display:'grid',gridTemplateColumns:'1fr 1fr',cursor:'pointer' }}>
                <div style={{ padding:'44px 40px',display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative',zIndex:2 }}>
                  <div>
                    <div style={{ display:'inline-flex',alignItems:'center',background:'#C9A84C',padding:'6px 16px',borderRadius:2,marginBottom:22 }}>
                      <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:900,letterSpacing:'0.28em',textTransform:'uppercase',color:'#1C1814' }}>Highest Selling Template</span>
                    </div>
                    <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(2rem,3.5vw,3.5rem)',fontWeight:900,color:'#F5F0E8',lineHeight:0.95,letterSpacing:'-0.03em',textTransform:'uppercase',marginBottom:14 }}>ADVENTURE</h2>
                    <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:15,color:'rgba(245,240,232,0.65)',lineHeight:1.65,marginBottom:18,maxWidth:340 }}>Bold editorial travel magazine with full-bleed photography and cinematic layouts. The most-used template on our platform.</p>
                    <div style={{ display:'flex',gap:6,marginBottom:14 }}>
                      {[1,2,3,4,5].map(i=><span key={i} style={{ color:'#C9A84C',fontSize:13 }}>&#9733;</span>)}
                      <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:9,color:'rgba(245,240,232,0.45)',marginLeft:8 }}>4.9 · 12,847 uses</span>
                    </div>
                  </div>
                  <div style={{ display:'inline-flex',alignItems:'center',background:'#C9A84C',padding:'13px 28px',borderRadius:3,fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:'#1C1814',width:'fit-content',marginTop:28 }}>View and Customize</div>
                </div>
                <div style={{ position:'relative',overflow:'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=900&auto=format&fit=crop" alt="Adventure" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.85 }} />
                  <div style={{ position:'absolute',inset:0,background:'linear-gradient(to right,#1C1814 0%,transparent 30%)' }} />
                  <div style={{ position:'absolute',top:20,right:20,display:'flex',flexDirection:'column',gap:8 }}>
                    {['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop','https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?q=80&w=200&auto=format&fit=crop','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=200&auto=format&fit=crop'].map((src,i)=>(
                      <div key={i} style={{ width:72,height:100,borderRadius:2,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',transform:i%2===0?'rotate(-2deg)':'rotate(2deg)',border:'1px solid rgba(255,255,255,0.15)' }}>
                        <img src={src} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Featured row */}
        {featured.length > 0 && (
          <div style={{ marginBottom:40 }}>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:22 }}>
              <div className="gold-line" style={{ flex:'none' }} />
              <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.3em',textTransform:'uppercase',color:'#C9A84C',flex:'none' }}>Featured</span>
              <div style={{ flex:1,height:1,background:'#DDD8CE' }} />
            </div>
            <div style={{ display:'grid',gridTemplateColumns:featured.length===1?'1fr':'repeat(2,1fr)',gap:28 }}>
              {featured.map((t,i) => <Card key={t.id} template={t} index={i} featured onPreview={() => setPreviewTemplate(t)} />)}
            </div>
          </div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div style={{ marginBottom:24 }}>
            {rest.length > 2 && (
              <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:22 }}>
                <div style={{ flex:1,height:1,background:'#DDD8CE' }} />
                <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.3em',textTransform:'uppercase',color:'#7A6F64',flex:'none' }}>Full Collection</span>
                <div className="gold-line" style={{ flex:'none' }} />
              </div>
            )}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:32 }}>
              {rest.map((t,i) => <Card key={t.id} template={t} index={i+2} onPreview={() => setPreviewTemplate(t)} />)}
            </div>
          </div>
        )}

        {/* Collections section */}
        {activeCategory === 'all' && (
          <div style={{ margin:'72px 0 0',paddingTop:64,borderTop:'1px solid #DDD8CE' }}>
            <div style={{ textAlign:'center',marginBottom:48 }}>
              <p className="eyebrow" style={{ marginBottom:14 }}>Curated Lines</p>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(1.8rem,2.8vw,2.8rem)',fontWeight:400,color:'#1C1814',marginBottom:10 }}>Explore by Collection</h2>
              <p className="sub" style={{ maxWidth:480,margin:'0 auto' }}>Thoughtfully assembled design families, each with a distinctive editorial voice.</p>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20 }}>
              {COLLECTIONS.map(col => {
                const colTs = templates.filter(t => META[t.id]?.collection === col.id)
                const prev = colTs[0]
                return (
                  <div key={col.id} className="coll-card" style={{ aspectRatio:'16/9' }} onClick={() => {
                    const found = CATEGORIES.find(c => colTs.some(t => (c.id==='Weddings'&&t.category==='Wedding')||(c.id==='Travel'&&t.category==='Travel')||c.id===t.category))
                    if (found) setActiveCategory(found.id)
                    document.getElementById('tpl-grid')?.scrollIntoView({ behavior:'smooth' })
                  }}>
                    {prev && <img src={prev.thumbnail} alt={col.label} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} />}
                    <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.72) 100%)' }} />
                    <div style={{ position:'absolute',inset:0,backgroundImage:GRAIN,opacity:0.4 }} />
                    <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'22px 20px' }}>
                      <div style={{ width:28,height:2,background:col.accent,marginBottom:9,animation:'gPulse 2.5s ease-in-out infinite' }} />
                      <p style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:400,color:'#F5F0E8',marginBottom:3 }}>{col.label}</p>
                      <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:13,color:'rgba(245,240,232,0.65)' }}>{col.sub}</p>
                      <p style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:col.accent,marginTop:9 }}>{colTs.length} Templates →</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dark CTA */}
        <div style={{ margin:'80px -40px 0',padding:'80px 40px',background:'#1C1814',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',inset:0,backgroundImage:GRAIN,opacity:0.6,pointerEvents:'none' }} />
          <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:300,background:'radial-gradient(ellipse,rgba(201,168,76,0.11) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div style={{ position:'relative',zIndex:1,textAlign:'center',maxWidth:560,margin:'0 auto' }}>
            <div className="gold-line" style={{ margin:'0 auto 22px' }} />
            <p className="eyebrow" style={{ color:'rgba(201,168,76,0.75)',marginBottom:18 }}>Begin Creating</p>
            <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(1.9rem,3vw,3rem)',fontWeight:400,color:'#F5F0E8',lineHeight:1.1,marginBottom:14,letterSpacing:'-0.02em' }}>
              Your story deserves<br /><em style={{ color:'#C9A84C' }}>a stunning canvas.</em>
            </h2>
            <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",fontStyle:'italic',fontSize:15,color:'rgba(245,240,232,0.5)',lineHeight:1.75,marginBottom:36 }}>
              Pick a template, add your memories, and publish a magazine-quality keepsake that will be cherished for generations.
            </p>
            <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
              <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})} style={{ background:'#C9A84C',color:'#1C1814',border:'none',padding:'15px 34px',borderRadius:3,cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase' }}>Browse All Templates</button>
              <button onClick={() => templates[0] && setPreviewTemplate(templates[0])} style={{ background:'transparent',color:'#F5F0E8',border:'1.5px solid rgba(245,240,232,0.18)',padding:'15px 28px',borderRadius:3,cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:9,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase' }}>See Preview</button>
            </div>
            <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:24,marginTop:34,flexWrap:'wrap' }}>
              {[{icon:'★',l:'4.9 / 5 Rating'},{icon:'◆',l:'10,000+ Happy Creators'},{icon:'✦',l:'Print-Ready Quality'}].map(item=>(
                <div key={item.l} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ color:'#C9A84C',fontSize:10 }}>{item.icon}</span>
                  <span style={{ fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(245,240,232,0.38)' }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {previewTemplate && <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}
    </>
  )
}
