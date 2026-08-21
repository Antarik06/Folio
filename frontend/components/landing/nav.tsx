'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Landing masthead.
 *
 * The three links are the three rooms of the app, in pipeline order — Photos,
 * Create, Profile — so the nav teaches the structure before you scroll into it.
 */
const ROOMS = [
  { href: '#photos', label: 'Photos' },
  { href: '#create', label: 'Create' },
  { href: '#profile', label: 'Profile' },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // A fixed-overlay menu must not leave the page scrolling underneath it.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 safe-top ${
          scrolled
            ? 'border-b border-[#F5F0E8]/12 bg-[#1C1814]/92 backdrop-blur-md'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            aria-label="Folio home"
            className="inline-flex min-h-[44px] items-center gap-2 font-serif text-2xl text-[#F5F0E8]"
          >
            Folio
            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
          </Link>

          <nav aria-label="Sections" className="hidden items-center gap-9 md:flex">
            {ROOMS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="group relative inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.14em] text-[#F5F0E8]/60 transition-colors hover:text-[#F5F0E8]"
              >
                {label}
                <span className="absolute bottom-[13px] left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link
              href="/auth/login"
              className="hidden min-h-[44px] items-center px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]/60 transition-colors hover:text-[#F5F0E8] sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-[2px] bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 sm:px-5"
            >
              Start free
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span
                className={`h-px w-5 bg-[#F5F0E8] transition-transform duration-300 ${
                  open ? 'translate-y-[6.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-px w-5 bg-[#F5F0E8] transition-opacity duration-200 ${
                  open ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-px w-5 bg-[#F5F0E8] transition-transform duration-300 ${
                  open ? '-translate-y-[6.5px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-0 z-40 bg-[#1C1814] transition-opacity duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex h-full flex-col justify-between px-6 pb-10 pt-24 safe-bottom">
          <nav aria-label="Sections" className="flex flex-col">
            {ROOMS.map(({ href, label }, i) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-[#F5F0E8]/12 py-5"
              >
                <span className="font-mono text-[11px] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-3xl text-[#F5F0E8]">{label}</span>
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[2px] border border-[#F5F0E8]/25 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]"
            >
              I have an invite code
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[2px] bg-primary font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
