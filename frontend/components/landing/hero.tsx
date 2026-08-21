'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CornerMarks } from '@/components/folio/marks'

/**
 * The hero: a contact sheet coming up in the tray.
 *
 * Rather than one large photograph behind a headline, the hero performs the
 * app's central gesture — a sheet of frames surfacing out of black, staggered,
 * with a mono counter ticking them off as they land. It is the same contact
 * sheet the Photos tab is built on, which makes the hero a demonstration
 * instead of a decoration.
 *
 * The stage is `--ink` regardless of theme: this is the darkroom, and a
 * darkroom is dark in both.
 */

const SHEET = [
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop', alt: 'Wedding ceremony' },
  { src: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=400&auto=format&fit=crop', alt: 'Guests laughing' },
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop', alt: 'Mountain range' },
  { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400&auto=format&fit=crop', alt: 'Couple at golden hour' },
  { src: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=400&auto=format&fit=crop', alt: 'Celebration table' },
  { src: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=400&auto=format&fit=crop', alt: 'Film camera' },
  { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=400&auto=format&fit=crop', alt: 'Bride portrait' },
  { src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop', alt: 'Travellers on a road' },
  { src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=400&auto=format&fit=crop', alt: 'Dinner party' },
  { src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop', alt: 'Beach at dusk' },
  { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', alt: 'Turquoise shore' },
  { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop', alt: 'Shopfront' },
]

export function Hero() {
  const [developed, setDeveloped] = useState(0)

  // The counter tracks the same stagger the frames animate on, so the readout
  // and the sheet stay in step.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDeveloped(SHEET.length)
      return
    }

    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setDeveloped(n)
      if (n >= SHEET.length) window.clearInterval(id)
    }, 110)

    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#1C1814]">
      <div className="hidden sm:block">
        <CornerMarks inset={22} opacity={0.28} />
      </div>

      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-40">
        {/* ── The thesis ────────────────────────────────────────────────── */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary sm:text-[11px]">
            Folio — Vol. 01
          </div>

          <h1 className="mt-5 font-serif text-[clamp(2.6rem,9vw,4.6rem)] leading-[0.98] tracking-[-0.02em] text-[#F5F0E8]">
            Everyone&apos;s photos.
            <br />
            <span className="text-primary">One darkroom.</span>
          </h1>

          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#F5F0E8]/70 sm:text-base">
            Collect every frame from a day — yours and everyone else&apos;s.
            Turn them into an album, a print, or a card worth sending. Keep it
            private, or give it a page of its own.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[2px] bg-primary px-7 font-mono text-[12px] uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start a shelf — free
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[2px] border border-[#F5F0E8]/25 px-7 font-mono text-[12px] uppercase tracking-[0.12em] text-[#F5F0E8]/80 transition-colors hover:border-[#F5F0E8]/60 hover:text-[#F5F0E8]"
            >
              I have an invite code
            </Link>
          </div>

          <dl className="mt-11 grid max-w-md grid-cols-3 gap-4 border-t border-[#F5F0E8]/12 pt-6">
            {[
              ['Photos', 'Every frame, one shelf'],
              ['Create', 'Album, print, or card'],
              ['Profile', 'A page worth sharing'],
            ].map(([term, desc]) => (
              <div key={term}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                  {term}
                </dt>
                <dd className="mt-1.5 text-[12px] leading-snug text-[#F5F0E8]/50">
                  {desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── The sheet ─────────────────────────────────────────────────── */}
        <div className="relative">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/40">
              Contact sheet — Reema &amp; Advait
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-primary"
              role="status"
              aria-live="off"
            >
              {developed < SHEET.length
                ? `Developing ${String(developed).padStart(2, '0')}/${SHEET.length}`
                : `${SHEET.length} frames`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-[3px] border border-[#F5F0E8]/12 p-[3px]">
            {SHEET.map((frame, i) => (
              <div
                key={frame.src}
                className="develop relative aspect-square overflow-hidden bg-[#2F281F]"
                style={{ animationDelay: `${i * 0.11}s` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.src}
                  alt={frame.alt}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/40">
              14 Nov · Udaipur
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/40">
              4 contributors
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .develop {
          animation: develop 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes develop {
          from {
            opacity: 0;
            filter: blur(7px) brightness(0.25) contrast(1.6);
            transform: scale(1.04);
          }
          to {
            opacity: 1;
            filter: blur(0) brightness(1) contrast(1);
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .develop {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
