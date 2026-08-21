'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plate } from './plate'

/**
 * Prints scattered on the darkroom table.
 *
 * Carried over from the original hero, which had a tilted, draggable stack of
 * polaroid frames — the one element of that page worth keeping. Rebuilt here
 * on the ink ground, where cream frames read as actual prints laid out on a
 * dark surface rather than cards floating on paper.
 *
 * Every frame is empty. When real photographs exist, each `Plate` takes a
 * `src` and nothing else changes.
 */

interface Card {
  id: string
  /** Tailwind position classes. */
  at: string
  /** Width, and the aspect of the plate inside. */
  w: string
  ratio: string
  rotate: number
  /** How far it drifts with the pointer. Negative = further away. */
  depth: number
  caption: string
  /** Serif captions read as handwriting; mono ones as a lab stamp. */
  hand?: boolean
  /** The centrepiece gets a book gutter down the middle. */
  spread?: boolean
  z: string
}

const CARDS: Card[] = [
  {
    id: 'travel',
    at: 'top-2 left-0 sm:top-6 sm:left-6',
    w: 'w-[38%] max-w-[168px]',
    ratio: '3/4',
    rotate: -12,
    depth: -0.4,
    caption: "tuscany. july '25",
    z: 'z-10',
  },
  {
    id: 'spread',
    at: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    w: 'w-[78%] max-w-[330px]',
    ratio: '4/3',
    rotate: 2,
    depth: -0.15,
    caption: 'the whole day, one spread',
    spread: true,
    z: 'z-20',
  },
  {
    id: 'friends',
    at: 'bottom-6 right-0 sm:bottom-10 sm:right-2',
    w: 'w-[36%] max-w-[156px]',
    ratio: '4/5',
    rotate: 6,
    depth: 0.3,
    caption: 'summer nights with them',
    hand: true,
    z: 'z-30',
  },
  {
    id: 'sea',
    at: 'top-8 right-1 sm:top-12 sm:right-6',
    w: 'w-[32%] max-w-[140px]',
    ratio: '4/5',
    rotate: -3,
    depth: 0.1,
    caption: 'amalfi. beach days',
    z: 'z-30',
  },
  {
    id: 'golden',
    at: 'bottom-0 left-3 sm:bottom-2 sm:left-8',
    w: 'w-[30%] max-w-[132px]',
    ratio: '1/1',
    rotate: -6,
    depth: 0.5,
    caption: 'golden hour 17:30',
    z: 'z-30',
  },
]

export function PhotoScatter() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  // useReducedMotion() resolves to null during SSR and to a boolean on the
  // client, so branching on it directly changed the markup between the two —
  // drag attributes, cursor classes and the hint all differed, and React threw
  // a hydration mismatch. Gate on mount instead: server and first client paint
  // both render the static stack, and interactivity switches on afterwards.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const interactive = mounted && !reduced

  // Parallax follows the pointer across the stack's own box, so the effect is
  // the same wherever the section sits on the page.
  useEffect(() => {
    if (!interactive) return
    const el = ref.current
    if (!el) return
    // Coarse pointers have no hover position to track.
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      setPointer({
        x: (e.clientX - (r.left + r.width / 2)) / r.width,
        y: (e.clientY - (r.top + r.height / 2)) / r.height,
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive])

  return (
    <div
      ref={ref}
      className="relative mx-auto h-[380px] w-full max-w-[460px] select-none sm:h-[460px] lg:h-[500px]"
    >
      {CARDS.map((card) => (
        <motion.div
          key={card.id}
          drag={interactive}
          dragMomentum={false}
          dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
          whileDrag={{ scale: 1.05, zIndex: 60 }}
          animate={
            interactive
              ? { x: pointer.x * card.depth * 34, y: pointer.y * card.depth * 34 }
              : { x: 0, y: 0 }
          }
          transition={{ type: 'spring', damping: 22, stiffness: 80 }}
          style={{ rotate: card.rotate }}
          className={`absolute ${card.at} ${card.w} ${card.z} ${
            interactive ? 'cursor-grab active:cursor-grabbing' : ''
          } bg-[#FDFAF5] p-2.5 pb-7 shadow-[0_10px_30px_rgba(0,0,0,0.45)]`}
        >
          <div className="relative">
            <Plate ratio={card.ratio} tone="paper" />
            {card.spread ? (
              // The gutter of an open book.
              <span className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/25 to-black/10" />
            ) : null}
          </div>
          <div
            className={`mt-2 truncate text-center text-[#1C1814]/60 ${
              card.hand
                ? 'font-serif text-[10px] italic'
                : 'font-mono text-[8px] uppercase tracking-[0.08em]'
            }`}
          >
            {card.caption}
          </div>
        </motion.div>
      ))}

      {interactive ? (
        <div className="pointer-events-none absolute -bottom-1 right-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F0E8]/25">
          [ drag to arrange ]
        </div>
      ) : null}
    </div>
  )
}
