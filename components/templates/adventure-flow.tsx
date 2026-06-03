'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ADVENTURE_PAGES } from '@/lib/magazine-templates'

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = {
  id: string
  type: string
  label: string
  bg?: string
  issue?: string
  photo: string
  photo2?: string
  title: string
  subtitle?: string
  body?: string
  tags?: string[]
  footer?: string
  items?: string[]
  tips?: string[]
  dark?: boolean
}

type EditedPage = Partial<{
  photo: string
  photo2?: string
  title: string
  subtitle?: string
  body?: string
}>

type Step = 'preview3d' | 'editor' | 'preview' | 'checkout'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.06'/%3E%3C/svg%3E")`

// ─── Page Renderer ────────────────────────────────────────────────────────────
function PageRenderer({ page, edits, small = false }: { page: Page; edits: EditedPage; small?: boolean }) {
  const p = { ...page, ...edits, photo: edits.photo || page.photo }
  const s = small ? 0.38 : 1
  const W = 595, H = 842

  const fs = (n: number) => Math.round(n * (small ? 0.9 : 1))

  return (
    <div style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: p.bg || '#fff', flexShrink: 0,
      transform: small ? `scale(${s})` : undefined,
      transformOrigin: 'top left',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      {/* ── COVER ── */}
      {p.type === 'cover' && (
        <>
          <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />
          {/* White left column overlay */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 200, height: '100%', background: 'rgba(244,241,236,0.92)', backdropFilter: 'blur(2px)' }} />
          {/* Title */}
          <div style={{ position: 'absolute', left: 0, top: 60, width: 200, padding: '0 16px' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(52), fontWeight: 900, color: '#1A1A1A', lineHeight: 0.9, letterSpacing: '-0.03em' }}>{p.title}</div>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.28em', color: '#666', marginTop: 8 }}>{p.subtitle}</div>
            <div style={{ fontSize: fs(8), fontWeight: 600, letterSpacing: '0.22em', color: '#999', marginTop: 2 }}>{p.issue}</div>
            <div style={{ width: 32, height: 2, background: '#C9A84C', margin: '14px 0' }} />
            {p.tags && p.tags.slice(0, 2).map((tag, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: fs(10), fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tag}</div>
              </div>
            ))}
            {p.tags && p.tags[2] && (
              <>
                <div style={{ width: 32, height: 1, background: '#DDD', margin: '10px 0' }} />
                <div style={{ fontSize: fs(10), fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THE LOCATION</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(56), fontWeight: 900, color: '#C9A84C', lineHeight: 1 }}>{p.tags[3]}</div>
                <div style={{ fontSize: fs(8), color: '#888', lineHeight: 1.4 }}>Top Mountains that are criminally popular</div>
              </>
            )}
          </div>
          {/* Footer strip */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(28,24,20,0.88)', padding: '8px 16px' }}>
            <div style={{ fontSize: fs(7), fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{p.footer}</div>
          </div>
        </>
      )}

      {/* ── CONTENTS ── */}
      {p.type === 'contents' && (
        <>
          <div style={{ position: 'absolute', right: 0, top: 0, width: 300, height: '60%', overflow: 'hidden' }}>
            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 280, height: '100%', padding: '40px 32px', background: '#fff' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(36), fontWeight: 400, color: '#1A1A1A', marginBottom: 24 }}>{p.title}</div>
            <div style={{ width: 32, height: 2, background: '#C9A84C', marginBottom: 24 }} />
            {(p.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0EDE8', fontSize: fs(10), color: '#1A1A1A' }}>
                <span style={{ fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── EDITOR'S NOTE ── */}
      {p.type === 'editors-note' && (
        <>
          <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '50%', overflow: 'hidden' }}>
            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '40px 36px' }}>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>Editor's Note</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(28), fontStyle: 'italic', color: '#1A1A1A', lineHeight: 1.2, maxWidth: 260, marginBottom: 20 }}>
              {p.subtitle || 'Experience True Adventure'}
            </div>
            <div style={{ width: 32, height: 2, background: '#C9A84C', marginBottom: 20 }} />
            <div style={{ position: 'absolute', bottom: 40, left: 36, right: 36 }}>
              <div style={{ fontSize: fs(10), color: '#555', lineHeight: 1.8, fontWeight: 300 }}>{p.body}</div>
            </div>
          </div>
          {/* Big pull quote */}
          <div style={{ position: 'absolute', top: '52%', right: 32, width: 260 }}>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.2em', color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>The Adventure Issue</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(16), fontStyle: 'italic', color: '#1A1A1A', lineHeight: 1.5 }}>
              "Every great adventure begins with a single step into the unknown."
            </div>
          </div>
        </>
      )}

      {/* ── FEATURE FULL DARK ── */}
      {p.type === 'feature-full' && (
        <>
          <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 40px 48px' }}>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', marginBottom: 10, textTransform: 'uppercase' }}>Feature Story</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(42), fontWeight: 900, color: '#FFFFFF', lineHeight: 0.95, marginBottom: 16, letterSpacing: '-0.02em' }}>{p.title}</div>
            <div style={{ width: 40, height: 2, background: '#C9A84C', marginBottom: 16 }} />
            <div style={{ fontSize: fs(11), color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontWeight: 300, maxWidth: 420 }}>{p.body}</div>
          </div>
        </>
      )}

      {/* ── FEATURE SPLIT ── */}
      {p.type === 'feature-split' && (
        <>
          <div style={{ position: 'absolute', right: 0, top: 0, width: '58%', height: '55%', overflow: 'hidden' }}>
            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {p.photo2 && (
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: '35%', height: '42%', overflow: 'hidden' }}>
              <img src={p.photo2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '44%', height: '100%', padding: '48px 28px', background: p.bg || '#F9F7F4' }}>
            <div style={{ fontSize: fs(8), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>Feature</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(24), color: '#1A1A1A', lineHeight: 1.2, marginBottom: 16 }}>{p.title}</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: fs(13), color: '#888', marginBottom: 16 }}>{p.subtitle}</div>
            <div style={{ width: 28, height: 2, background: '#C9A84C', marginBottom: 16 }} />
            <div style={{ fontSize: fs(9.5), color: '#555', lineHeight: 1.75, fontWeight: 300 }}>{p.body}</div>
          </div>
        </>
      )}

      {/* ── FULL BLEED ── */}
      {p.type === 'full-bleed' && (
        <>
          <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '80%' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(38), fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{p.title}</div>
            <div style={{ width: 40, height: 2, background: '#C9A84C', margin: '18px auto' }} />
            <div style={{ fontSize: fs(10), fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em' }}>{p.subtitle}</div>
          </div>
        </>
      )}

      {/* ── TIPS GRID ── */}
      {p.type === 'tips-grid' && (
        <>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '48%', height: '45%', overflow: 'hidden' }}>
            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ padding: '48px 36px' }}>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 10 }}>Expert Advice</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(30), color: '#1A1A1A', marginBottom: 24 }}>{p.title}</div>
            <div style={{ width: 28, height: 2, background: '#C9A84C', marginBottom: 28 }} />
            <div style={{ position: 'absolute', bottom: 40, left: 36, right: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {(p.tips || []).map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: fs(8), fontWeight: 700, color: '#fff' }}>{i + 1}</div>
                  <div style={{ fontSize: fs(9.5), color: '#333', lineHeight: 1.5, fontWeight: 500 }}>{tip}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── PORTRAIT EDITORIAL ── */}
      {p.type === 'portrait-editorial' && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '55%', height: '100%', overflow: 'hidden' }}>
            <img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 70%, rgba(244,241,236,1) 100%)' }} />
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: '100%', padding: '60px 32px', background: p.bg || '#F4F1EC' }}>
            <div style={{ fontSize: fs(8), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 12 }}>Portrait</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(26), color: '#1A1A1A', lineHeight: 1.2, marginBottom: 12 }}>{p.title}</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: fs(13), color: '#888', marginBottom: 20 }}>{p.subtitle}</div>
            <div style={{ width: 28, height: 2, background: '#C9A84C', marginBottom: 20 }} />
            <div style={{ fontSize: fs(9.5), color: '#555', lineHeight: 1.8, fontWeight: 300 }}>{p.body}</div>
          </div>
        </>
      )}

      {/* ── CLOSING FEATURE ── */}
      {p.type === 'closing-feature' && (
        <>
          <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(28,24,20,0.8) 0%, rgba(28,24,20,0.4) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN }} />
          <div style={{ position: 'absolute', top: 60, left: 48, maxWidth: 300 }}>
            <div style={{ fontSize: fs(9), fontWeight: 700, letterSpacing: '0.3em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 14 }}>Closing Feature</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(46), fontWeight: 900, color: '#FFFFFF', lineHeight: 0.95, marginBottom: 18, letterSpacing: '-0.02em' }}>{p.title}</div>
            <div style={{ width: 40, height: 2, background: '#C9A84C', marginBottom: 18 }} />
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: fs(14), color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>{p.subtitle}</div>
            <div style={{ fontSize: fs(10), color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontWeight: 300 }}>{p.body}</div>
          </div>
        </>
      )}

      {/* ── BACK COVER ── */}
      {p.type === 'back-cover' && (
        <>
          <img src={p.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.65)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: fs(56), fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>{p.title}</div>
            <div style={{ width: 60, height: 2, background: '#C9A84C', margin: '18px auto' }} />
            <div style={{ fontSize: fs(10), fontWeight: 600, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{p.subtitle}</div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Full-Page Preview Component ──────────────────────────────────────────────
function Preview3D({ pages, onStart }: { pages: Page[]; onStart: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoPlay) return
    timerRef.current = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setActiveIdx(p => (p + 1) % pages.length)
        setTransitioning(false)
      }, 300)
    }, 3500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoPlay, pages.length])

  const goTo = (i: number) => {
    if (i === activeIdx) return
    setAutoPlay(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setTransitioning(true)
    setTimeout(() => {
      setActiveIdx(i)
      setTransitioning(false)
    }, 300)
  }

  const goNext = () => goTo(Math.min(activeIdx + 1, pages.length - 1))
  const goPrev = () => goTo(Math.max(activeIdx - 1, 0))

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [activeIdx])

  // The PageRenderer uses 595×842. We scale it to fill the available space.
  const PAGE_W = 595
  const PAGE_H = 842
  const [pageScale, setPageScale] = useState(1)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = pageContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setPageScale(w / PAGE_W)
      }
    })
    obs.observe(el)
    // Initial measurement
    setPageScale(el.offsetWidth / PAGE_W)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: '#0E0D0C', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Montserrat:wght@300;400;600;700;900&display=swap');
        @keyframes ambientGlow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes p3dIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        @keyframes fadeSlideIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .adv-thumb { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); }
        .adv-thumb:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; }
        .adv-nav-arrow { transition: all 0.2s ease; }
        .adv-nav-arrow:hover { background: rgba(201,168,76,0.25) !important; border-color: #C9A84C !important; transform: translateY(-50%) scale(1.1); }
      `}</style>

      {/* Ambient lighting */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)', pointerEvents: 'none', animation: 'ambientGlow 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, opacity: 0.4, pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 10, background: 'rgba(14,13,12,0.85)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard/templates" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7A6F64', textDecoration: 'none', transition: 'color 0.2s' }}>← Templates</Link>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#C9A84C', color: '#1C1814', fontFamily: "'Montserrat', sans-serif", fontSize: 7, fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2 }}>🏆 #1 Template</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#F5F0E8', fontStyle: 'italic' }}>Adventure</span>
            </div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F64', marginTop: 2 }}>Travel Magazine · 10 Pages · 4.9★ · 12,847 uses</p>
          </div>
        </div>
        <button onClick={onStart} style={{
          background: '#C9A84C', color: '#1C1814', border: 'none', padding: '12px 32px', borderRadius: 3, cursor: 'pointer',
          fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
          boxShadow: '0 4px 20px rgba(201,168,76,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-1px)'; (e.target as HTMLElement).style.boxShadow = '0 8px 32px rgba(201,168,76,0.5)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = ''; (e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(201,168,76,0.3)' }}
        >
          Customize This Template →
        </button>
      </div>

      {/* Main full-page preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px 80px 120px' }}>
        {/* Navigation arrows */}
        {activeIdx > 0 && (
          <button className="adv-nav-arrow" onClick={goPrev} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 10 }}>‹</button>
        )}
        {activeIdx < pages.length - 1 && (
          <button className="adv-nav-arrow" onClick={goNext} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 10 }}>›</button>
        )}

        {/* Page render — scales to fill viewport */}
        <div ref={pageContainerRef} style={{
          width: '100%',
          maxWidth: 'min(65vw, 620px)',
          aspectRatio: `${PAGE_W}/${PAGE_H}`,
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 8px 32px rgba(0,0,0,0.4)',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* We render the 595x842 page then scale it to fit the container */}
          <div style={{
            width: PAGE_W,
            height: PAGE_H,
            transformOrigin: 'top left',
            transform: `scale(${pageScale})`,
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            <PageRenderer page={pages[activeIdx]} edits={{}} />
          </div>

          {/* Subtle spine shadow on left */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 16, height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.25), transparent)', pointerEvents: 'none', zIndex: 5 }} />
          {/* Subtle light reflection on right */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: 40, height: '100%', background: 'linear-gradient(to left, rgba(255,255,255,0.04), transparent)', pointerEvents: 'none', zIndex: 5 }} />
        </div>
      </div>

      {/* Bottom filmstrip + info bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(14,13,12,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
          {/* Page label */}
          <div style={{ minWidth: 120, flexShrink: 0 }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 2 }}>{pages[activeIdx].label}</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, letterSpacing: '0.15em', color: '#7A6F64', textTransform: 'uppercase' }}>Page {activeIdx + 1} of {pages.length}</p>
          </div>

          {/* Filmstrip */}
          <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center', overflowX: 'auto', padding: '2px 0' }} className="scrollbar-hide">
            {pages.map((pg, i) => (
              <button key={pg.id} className="adv-thumb" onClick={() => goTo(i)} style={{
                padding: 0, border: 'none', cursor: 'pointer', borderRadius: 3, overflow: 'hidden', position: 'relative',
                outline: i === activeIdx ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
                outlineOffset: i === activeIdx ? 2 : 0,
                width: 48, height: 68, flexShrink: 0,
                opacity: i === activeIdx ? 1 : 0.5,
                background: '#000',
              }}>
                <div style={{ transform: `scale(${48 / PAGE_W})`, transformOrigin: 'top left', width: PAGE_W, height: PAGE_H, pointerEvents: 'none' }}>
                  <PageRenderer page={pg} edits={{}} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '6px 2px 3px', textAlign: 'center', fontSize: 5, color: i === activeIdx ? '#C9A84C' : '#ccc', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>{pg.label}</div>
              </button>
            ))}
          </div>

          {/* CTA */}
          <div style={{ minWidth: 180, flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Link href="/dashboard/templates" style={{
              background: 'rgba(255,255,255,0.06)', color: '#F5F0E8', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 3,
              fontFamily: "'Montserrat', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}>← Back</Link>
            <button onClick={onStart} style={{
              background: '#C9A84C', color: '#1C1814', border: 'none', padding: '10px 20px', borderRadius: 3, cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
            }}>Customize →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Editor Component ─────────────────────────────────────────────────────────
function Editor({ pages, edits, setEdits, onPreview }: {
  pages: Page[]
  edits: EditedPage[]
  setEdits: (e: EditedPage[]) => void
  onPreview: () => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  const update = (field: keyof EditedPage, val: string) => {
    const next = [...edits]
    next[activeIdx] = { ...next[activeIdx], [field]: val }
    setEdits(next)
  }

  const handleImageUpload = (field: 'photo' | 'photo2') => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      update(field, url)
    }
    input.click()
  }

  const page = pages[activeIdx]
  const edit = edits[activeIdx]
  const merged: Page = { ...page, ...edit, photo: edit?.photo || page.photo }

  const hasPhoto2 = ['feature-split'].includes(page.type)
  const hasSubtitle = !['cover', 'contents', 'tips-grid'].includes(page.type)
  const hasBody = !['cover', 'contents', 'full-bleed', 'back-cover'].includes(page.type)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ background: '#1C1814', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#F5F0E8', fontStyle: 'italic' }}>Adventure</div>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', fontFamily: "'Montserrat', sans-serif" }}>Template Editor</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F64' }}>Page {activeIdx + 1}/{pages.length}</span>
          <button onClick={onPreview} style={{ background: '#C9A84C', color: '#1C1814', border: 'none', padding: '10px 24px', borderRadius: 2, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Preview Magazine →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 0 }}>
        {/* Left sidebar: page selector */}
        <div style={{ width: 88, background: '#1A1814', display: 'flex', flexDirection: 'column', padding: '16px 8px', gap: 8, overflowY: 'auto', position: 'sticky', top: 53, height: 'calc(100vh - 53px)' }}>
          {pages.map((pg, i) => (
            <button key={pg.id} onClick={() => setActiveIdx(i)} style={{
              padding: 0, border: 'none', cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
              outline: i === activeIdx ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
              width: 72, height: 96, flexShrink: 0, background: '#0D0D0D', position: 'relative',
            }}>
              <div style={{ transform: 'scale(0.121)', transformOrigin: 'top left', width: 595, height: 842, pointerEvents: 'none' }}>
                <PageRenderer page={pg} edits={edits[i] || {}} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', padding: '2px 0', textAlign: 'center', fontSize: 6, color: i === activeIdx ? '#C9A84C' : '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif" }}>{pg.label}</div>
            </button>
          ))}
        </div>

        {/* Center: page preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px', background: '#E8E3D9', overflowY: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 595, height: 842, boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)' }}>
              <PageRenderer page={merged} edits={{}} />
            </div>
            {/* Click-to-edit photo overlays */}
            <div
              onClick={() => handleImageUpload('photo')}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.15)', border: '2px dashed #C9A84C', borderRadius: 2 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              <div style={{ background: 'rgba(28,24,20,0.85)', color: '#C9A84C', padding: '10px 20px', borderRadius: 3, fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                📷 Click to Change Photo
              </div>
            </div>
          </div>
        </div>

        {/* Right: edit panel */}
        <div style={{ width: 300, background: '#FDFAF5', borderLeft: '1px solid #DDD8CE', padding: '28px 22px', overflowY: 'auto', position: 'sticky', top: 53, height: 'calc(100vh - 53px)' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 20 }}>
            Edit Page · {page.label}
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 8 }}>Main Photo</label>
            <div style={{ width: '100%', height: 100, borderRadius: 4, overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
              <img src={edit?.photo || page.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                onClick={() => handleImageUpload('photo')}
              >
                <span style={{ color: '#fff', fontSize: 20 }}>📷</span>
              </div>
            </div>
            <button onClick={() => handleImageUpload('photo')} style={{ width: '100%', background: '#1C1814', color: '#F5F0E8', border: 'none', padding: '10px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Upload Photo
            </button>
          </div>

          {hasPhoto2 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 8 }}>Secondary Photo</label>
              {(edit?.photo2 || page.photo2) && (
                <div style={{ width: '100%', height: 70, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <img src={edit?.photo2 || page.photo2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <button onClick={() => handleImageUpload('photo2')} style={{ width: '100%', background: '#F5F0E8', color: '#1C1814', border: '1.5px solid #DDD8CE', padding: '10px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Upload Secondary Photo
              </button>
            </div>
          )}

          {/* Title edit */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 6 }}>Headline</label>
            <input value={edit?.title ?? page.title} onChange={e => update('title', e.target.value)} style={{ width: '100%', border: '1.5px solid #DDD8CE', borderRadius: 3, padding: '10px 12px', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 15, color: '#1C1814', background: '#FDFAF5', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {hasSubtitle && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 6 }}>Subheadline</label>
              <input value={edit?.subtitle ?? (page.subtitle || '')} onChange={e => update('subtitle', e.target.value)} style={{ width: '100%', border: '1.5px solid #DDD8CE', borderRadius: 3, padding: '10px 12px', fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#1C1814', background: '#FDFAF5', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {hasBody && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 6 }}>Body Text</label>
              <textarea value={edit?.body ?? (page.body || '')} onChange={e => update('body', e.target.value)} rows={5} style={{ width: '100%', border: '1.5px solid #DDD8CE', borderRadius: 3, padding: '10px 12px', fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: '#1C1814', background: '#FDFAF5', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
            </div>
          )}

          {/* Reset page */}
          <button onClick={() => {
            const next = [...edits]
            next[activeIdx] = {}
            setEdits(next)
          }} style={{ width: '100%', background: 'transparent', color: '#7A6F64', border: '1px solid #DDD8CE', padding: '9px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>
            Reset This Page
          </button>

          <div style={{ marginTop: 28, padding: '16px', background: '#F5F0E8', borderRadius: 4, border: '1px solid #DDD8CE' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, letterSpacing: '0.15em', color: '#7A6F64', textTransform: 'uppercase', marginBottom: 6 }}>Navigation</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setActiveIdx(p => Math.max(0, p - 1))} disabled={activeIdx === 0} style={{ flex: 1, padding: '8px', background: '#1C1814', color: '#F5F0E8', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, opacity: activeIdx === 0 ? 0.3 : 1 }}>‹ Prev</button>
              <button onClick={() => setActiveIdx(p => Math.min(pages.length - 1, p + 1))} disabled={activeIdx === pages.length - 1} style={{ flex: 1, padding: '8px', background: '#1C1814', color: '#F5F0E8', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12, opacity: activeIdx === pages.length - 1 ? 0.3 : 1 }}>Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function MagazinePreview({ pages, edits, onBack, onCheckout }: {
  pages: Page[]; edits: EditedPage[]; onBack: () => void; onCheckout: () => void
}) {
  const [cur, setCur] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [dir, setDir] = useState(1)
  const PAGE_W = 595
  const PAGE_H = 842
  const [previewScale, setPreviewScale] = useState(1)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPreviewScale(entry.contentRect.width / PAGE_W)
      }
    })
    obs.observe(el)
    setPreviewScale(el.offsetWidth / PAGE_W)
    return () => obs.disconnect()
  }, [])

  const go = (next: number) => {
    if (next < 0 || next >= pages.length || flipping) return
    setDir(next > cur ? 1 : -1)
    setFlipping(true)
    setTimeout(() => { setCur(next); setFlipping(false) }, 350)
  }

  const page = pages[cur]
  const edit = edits[cur] || {}

  return (
    <div style={{ minHeight: '100vh', background: '#0A0908', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes flipOut { from{transform:rotateY(0)} to{transform:rotateY(-90deg)} }
        @keyframes flipIn { from{transform:rotateY(90deg)} to{transform:rotateY(0)} }
        .page-flip-out { animation: flipOut 0.175s ease-in forwards; transform-origin: left center; }
        .page-flip-in { animation: flipIn 0.175s ease-out forwards; transform-origin: left center; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,9,8,0.85)', backdropFilter: 'blur(16px)', position: 'relative', zIndex: 10 }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#F5F0E8', fontStyle: 'italic' }}>Adventure Magazine</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', marginTop: 2 }}>Your Customized Edition · Preview</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.07)', color: '#F5F0E8', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 2, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>← Edit More</button>
          <button onClick={onCheckout} style={{ background: '#C9A84C', color: '#1C1814', border: 'none', padding: '10px 22px', borderRadius: 2, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Proceed to Checkout →</button>
        </div>
      </div>

      {/* Full-page magazine viewer */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px 80px 100px' }}>
        {/* Arrow nav */}
        {cur > 0 && (
          <button onClick={() => go(cur - 1)} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>‹</button>
        )}
        {cur < pages.length - 1 && (
          <button onClick={() => go(cur + 1)} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>›</button>
        )}

        <div ref={previewContainerRef} className={flipping ? (dir > 0 ? 'page-flip-out' : 'page-flip-in') : ''} style={{
          width: '100%', maxWidth: 'min(65vw, 620px)', aspectRatio: `${PAGE_W}/${PAGE_H}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.7)', borderRadius: 4, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ width: PAGE_W, height: PAGE_H, transformOrigin: 'top left', transform: `scale(${previewScale})`, position: 'absolute', top: 0, left: 0 }}>
            <PageRenderer page={page} edits={edit} />
          </div>
          {/* Spine shadow */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 12, height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)', pointerEvents: 'none', zIndex: 5 }} />
        </div>
      </div>

      {/* Bottom filmstrip */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(10,9,8,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 700 }}>
            {page.label}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pages.map((_, i) => (
              <button key={i} onClick={() => go(i)} style={{ width: i === cur ? 22 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: i === cur ? '#C9A84C' : 'rgba(255,255,255,0.2)', transition: 'all 0.25s ease' }} />
            ))}
          </div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, letterSpacing: '0.15em', color: '#7A6F64', textTransform: 'uppercase' }}>
            {cur + 1} / {pages.length}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Checkout Component ───────────────────────────────────────────────────────
function Checkout({ pages, edits, onBack }: { pages: Page[]; edits: EditedPage[]; onBack: () => void }) {
  const [step, setStep] = useState<'review' | 'shipping' | 'payment' | 'done'>('review')
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState('A4')
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', country: 'India', zip: '' })
  const [card, setCard] = useState({ num: '', exp: '', cvv: '', name: '' })

  const price = size === 'A4' ? 24 : size === 'A5' ? 18 : 32
  const total = price * qty

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3A7D6E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✓</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 40, fontWeight: 400, color: '#1C1814', marginBottom: 12 }}>Order Placed!</h1>
          <div style={{ width: 40, height: 1, background: '#C9A84C', margin: '0 auto 20px' }} />
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: '#7A6F64', lineHeight: 1.8, marginBottom: 32 }}>
            Your <strong>Adventure Magazine</strong> is being prepared for print. You'll receive a confirmation email with tracking details within 24 hours.
          </p>
          <div style={{ background: '#1C1814', color: '#F5F0E8', padding: '16px 24px', borderRadius: 4, marginBottom: 20, fontFamily: "'Montserrat', sans-serif", fontSize: 10, letterSpacing: '0.15em' }}>
            Order #{Math.floor(Math.random() * 900000) + 100000} · {qty} × Adventure Magazine · ${total}
          </div>
          <Link href="/dashboard/templates" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none', borderBottom: '1px solid #C9A84C', paddingBottom: 2 }}>Back to Templates</Link>
        </div>
      </div>
    )
  }

  const coverEdit = edits[0] || {}
  const coverPage = pages[0]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Steps header */}
      <div style={{ background: '#1C1814', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#F5F0E8', fontStyle: 'italic' }}>Checkout</div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['review', 'Review'], ['shipping', 'Shipping'], ['payment', 'Payment']].map(([s, label]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: step === s ? '#C9A84C' : ['review', 'shipping', 'payment'].indexOf(step as string) > ['review', 'shipping', 'payment'].indexOf(s) ? '#3A7D6E' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: step === s ? '#1C1814' : '#fff', fontFamily: "'Montserrat', sans-serif", transition: 'all 0.3s' }}>
                {['review', 'shipping', 'payment'].indexOf(step as string) > ['review', 'shipping', 'payment'].indexOf(s) ? '✓' : ['review', 'shipping', 'payment'].indexOf(s) + 1}
              </div>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: step === s ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
        {/* Left col */}
        <div>
          {/* ── REVIEW STEP ── */}
          {step === 'review' && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 10 }}>Step 1</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#1C1814', marginBottom: 6 }}>Review Your Magazine</h2>
                <div style={{ width: 36, height: 1, background: '#C9A84C' }} />
              </div>

              {/* Magazine mockup */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 32, background: '#FDFAF5', borderRadius: 6, padding: 24, border: '1px solid #DDD8CE' }}>
                <div style={{ width: 120, height: 170, borderRadius: 3, overflow: 'hidden', flexShrink: 0, boxShadow: '4px 4px 20px rgba(0,0,0,0.15)', transform: 'rotate(-2deg)' }}>
                  <div style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: 595, height: 842, pointerEvents: 'none' }}>
                    <PageRenderer page={coverPage} edits={coverEdit} />
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#1C1814', marginBottom: 6 }}>Adventure Magazine</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F64', marginBottom: 14 }}>Your Custom Edition · 10 Pages</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#C9A84C', fontSize: 12 }}>{s}</span>)}
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: '#7A6F64', marginLeft: 4 }}>Premium Print Quality</span>
                  </div>
                </div>
              </div>

              {/* Size selector */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', marginBottom: 14 }}>Select Size</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['A5', 'A5 (148×210mm)', '$18'], ['A4', 'A4 (210×297mm)', '$24'], ['Letter', 'Letter (216×279mm)', '$32']].map(([s, label, p]) => (
                    <button key={s} onClick={() => setSize(s)} style={{ flex: 1, padding: '14px 12px', border: size === s ? '2px solid #1C1814' : '1.5px solid #DDD8CE', borderRadius: 4, cursor: 'pointer', background: size === s ? '#1C1814' : '#FDFAF5', transition: 'all 0.2s', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: size === s ? '#F5F0E8' : '#1C1814' }}>{s}</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, color: size === s ? 'rgba(245,240,232,0.6)' : '#7A6F64', marginTop: 4 }}>{label}</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 700, color: size === s ? '#C9A84C' : '#1C1814', marginTop: 6 }}>{p}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', marginBottom: 14 }}>Quantity</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 'fit-content', border: '1.5px solid #DDD8CE', borderRadius: 4, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, border: 'none', background: '#F5F0E8', cursor: 'pointer', fontSize: 18, color: '#1C1814' }}>−</button>
                  <div style={{ width: 56, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 700, color: '#1C1814', background: '#FDFAF5', borderLeft: '1px solid #DDD8CE', borderRight: '1px solid #DDD8CE' }}>{qty}</div>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 40, height: 40, border: 'none', background: '#F5F0E8', cursor: 'pointer', fontSize: 18, color: '#1C1814' }}>+</button>
                </div>
                {qty >= 3 && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: '#3A7D6E', marginTop: 8 }}>✓ 10% bulk discount applied!</p>}
              </div>

              {/* Specs */}
              <div style={{ background: '#FDFAF5', border: '1px solid #DDD8CE', borderRadius: 4, padding: 20, marginBottom: 28 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', marginBottom: 14 }}>What's Included</p>
                {['Premium 120gsm Silk Paper', 'Lay-flat Binding', 'Matte Scuff-resistant Cover', 'Full-colour HD Print', '5–7 Day Global Delivery', '100% Satisfaction Guarantee'].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <span style={{ color: '#3A7D6E', fontSize: 12 }}>✓</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: '#555' }}>{s}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep('shipping')} style={{ width: '100%', background: '#1C1814', color: '#F5F0E8', border: 'none', padding: '16px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Continue to Shipping →</button>
              <button onClick={onBack} style={{ width: '100%', background: 'transparent', color: '#7A6F64', border: 'none', padding: '12px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8 }}>← Back to Preview</button>
            </div>
          )}

          {/* ── SHIPPING STEP ── */}
          {step === 'shipping' && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 10 }}>Step 2</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#1C1814', marginBottom: 6 }}>Shipping Details</h2>
                <div style={{ width: 36, height: 1, background: '#C9A84C' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[['name', 'Full Name', 'text'], ['email', 'Email Address', 'email'], ['address', 'Street Address', 'text'], ['city', 'City', 'text'], ['zip', 'ZIP / Postal Code', 'text'], ['country', 'Country', 'text']].map(([f, label, type]) => (
                  <div key={f} style={{ gridColumn: f === 'address' ? 'span 2' : undefined }}>
                    <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input type={type} value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #DDD8CE', borderRadius: 3, padding: '12px', fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#1C1814', background: '#FDFAF5', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('payment')} style={{ width: '100%', background: '#1C1814', color: '#F5F0E8', border: 'none', padding: '16px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Continue to Payment →</button>
              <button onClick={() => setStep('review')} style={{ width: '100%', background: 'transparent', color: '#7A6F64', border: 'none', padding: '12px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8 }}>← Back</button>
            </div>
          )}

          {/* ── PAYMENT STEP ── */}
          {step === 'payment' && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 10 }}>Step 3</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 400, color: '#1C1814', marginBottom: 6 }}>Payment</h2>
                <div style={{ width: 36, height: 1, background: '#C9A84C' }} />
              </div>
              <div style={{ background: '#FDFAF5', border: '1px solid #DDD8CE', borderRadius: 6, padding: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#7A6F64', marginBottom: 18 }}>Card Details</p>
                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    ['name', 'Cardholder Name', 'text', 'span 2'],
                    ['num', 'Card Number', 'text', 'span 2'],
                    ['exp', 'Expiry (MM/YY)', 'text', undefined],
                    ['cvv', 'CVV', 'text', undefined],
                  ].map(([f, label, type, col]) => {
                    const field = f as keyof typeof card
                    return (
                    <div key={f} style={{ gridColumn: col as string }}>
                      <label style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A6F64', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type={type} placeholder={field === 'num' ? '•••• •••• •••• ••••' : ''} value={card[field]} onChange={e => setCard(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: '100%', border: '1.5px solid #DDD8CE', borderRadius: 3, padding: '12px', fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#1C1814', background: '#FDFAF5', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>🔒</span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: '#7A6F64', letterSpacing: '0.12em' }}>256-bit SSL encrypted · Powered by Stripe</span>
              </div>
              <button onClick={() => setStep('done')} style={{ width: '100%', background: '#C9A84C', color: '#1C1814', border: 'none', padding: '18px', borderRadius: 3, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', boxShadow: '0 8px 24px rgba(201,168,76,0.3)' }}>
                Place Order · ${qty >= 3 ? Math.round(total * 0.9) : total}
              </button>
              <button onClick={() => setStep('shipping')} style={{ width: '100%', background: 'transparent', color: '#7A6F64', border: 'none', padding: '12px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8 }}>← Back</button>
            </div>
          )}
        </div>

        {/* Right col: order summary (sticky) */}
        <div>
          <div style={{ background: '#1C1814', color: '#F5F0E8', padding: '28px 24px', borderRadius: 6, position: 'sticky', top: 24 }}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontStyle: 'italic', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>Order Summary</p>

            {/* Mini cover */}
            <div style={{ width: 64, height: 90, borderRadius: 2, overflow: 'hidden', marginBottom: 16, boxShadow: '3px 3px 12px rgba(0,0,0,0.4)', transform: 'rotate(-1deg)' }}>
              <div style={{ transform: 'scale(0.108)', transformOrigin: 'top left', width: 595, height: 842, pointerEvents: 'none' }}>
                <PageRenderer page={coverPage} edits={coverEdit} />
              </div>
            </div>

            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: '#F5F0E8', marginBottom: 4 }}>Adventure Magazine</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: 'rgba(245,240,232,0.5)', marginBottom: 20, letterSpacing: '0.12em' }}>Custom Edition · {size} · {pages.length} pages</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: 11 }}>
                <span style={{ color: 'rgba(245,240,232,0.6)' }}>{qty} × {size} Magazine</span>
                <span style={{ fontWeight: 700 }}>${price * qty}</span>
              </div>
              {qty >= 3 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: 11 }}>
                  <span style={{ color: '#3A7D6E' }}>Bulk Discount (10%)</span>
                  <span style={{ color: '#3A7D6E', fontWeight: 700 }}>−${Math.round(price * qty * 0.1)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontSize: 11 }}>
                <span style={{ color: 'rgba(245,240,232,0.6)' }}>Shipping</span>
                <span style={{ color: '#3A7D6E', fontWeight: 700 }}>FREE</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontStyle: 'italic' }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700 }}>${qty >= 3 ? Math.round(total * 0.9) : total}</span>
            </div>

            {['Premium Print Quality', '5–7 Day Delivery', '100% Satisfaction'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#3A7D6E', fontSize: 11 }}>✓</span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: 'rgba(245,240,232,0.5)', letterSpacing: '0.1em' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root Orchestrator ────────────────────────────────────────────────────────
export function AdventureFlow() {
  const pages = ADVENTURE_PAGES as Page[]
  const [step, setStep] = useState<Step>('preview3d')
  const [edits, setEdits] = useState<EditedPage[]>(() => pages.map(() => ({})))

  // Scroll to top on step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  return (
    <>
      {step === 'preview3d' && <Preview3D pages={pages} onStart={() => setStep('editor')} />}
      {step === 'editor' && <Editor pages={pages} edits={edits} setEdits={setEdits} onPreview={() => setStep('preview')} />}
      {step === 'preview' && <MagazinePreview pages={pages} edits={edits} onBack={() => setStep('editor')} onCheckout={() => setStep('checkout')} />}
      {step === 'checkout' && <Checkout pages={pages} edits={edits} onBack={() => setStep('preview')} />}
    </>
  )
}
