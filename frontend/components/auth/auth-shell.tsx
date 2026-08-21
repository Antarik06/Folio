'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CrosshairMark } from '@/components/folio/marks'

/**
 * The auth screen as a darkroom job slip.
 *
 * Replaces the split form/marquee layout, which put half the viewport into a
 * decorative panel and left the form floating in the other half. This is one
 * card on the dark stage — the same ink ground the hero and the 3D preview use
 * — framed with registration crosses and headed with a mono job line, the way
 * a lab slip is.
 *
 * Behind it sits a dimmed sheet of empty plates: the contact-sheet motif from
 * the landing page, so signing in feels like stepping into the darkroom rather
 * than through a gate.
 */
export function AuthShell({
  slip,
  title,
  intro,
  children,
  footer,
}: {
  /** The mono job line, e.g. "Access" or "New account". */
  slip: string
  title: string
  intro: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#1C1814] px-5 py-14 safe-bottom">
      {/* Backdrop: a sheet of unexposed plates, well dimmed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="grid w-[min(120vw,900px)] grid-cols-6 gap-2 opacity-[0.055]">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#F5F0E8]" />
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(28,24,20,0.45) 0%, rgba(28,24,20,0.94) 68%)',
        }}
      />

      <Link
        href="/"
        aria-label="Folio home"
        className="relative z-10 mb-7 inline-flex min-h-[44px] items-center gap-2"
      >
        <span className="font-serif text-2xl tracking-tight text-[#F5F0E8]">Folio</span>
        <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
      </Link>

      {/* The slip. */}
      <div className="relative z-10 w-full max-w-[430px] rounded-[4px] border border-border bg-card px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:px-9 sm:py-10">
        <Corner className="left-2.5 top-2.5" />
        <Corner className="right-2.5 top-2.5" />
        <Corner className="bottom-2.5 left-2.5" />
        <Corner className="bottom-2.5 right-2.5" />

        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            {slip}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            Folio — Vol. 01
          </span>
        </div>

        <h1 className="mt-6 font-serif text-[clamp(1.75rem,6vw,2.25rem)] leading-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{intro}</p>

        <div className="mt-7">{children}</div>
      </div>

      <div className="relative z-10 mt-6 text-center text-[14px] text-[#F5F0E8]/50">
        {footer}
      </div>
    </main>
  )
}

function Corner({ className }: { className: string }) {
  return (
    <span className={`pointer-events-none absolute ${className}`}>
      <CrosshairMark size={13} />
    </span>
  )
}

/* ── Form parts ───────────────────────────────────────────────────────────── */

export function AuthField({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  required,
  autoComplete,
  minLength,
  hint,
}: {
  id: string
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
  hint?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        /* 16px so iOS doesn't zoom the viewport on focus. */
        className="w-full rounded-[2px] border border-border bg-background px-3.5 py-3 text-[16px] text-foreground outline-none transition-colors placeholder:text-ink-soft/50 focus:border-primary"
      />
      {hint ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AuthSubmit({
  children,
  pending,
  disabled,
}: {
  children: ReactNode
  pending?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-primary px-6 font-mono text-[12px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Working…' : children}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-5 rounded-[2px] border border-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary"
    >
      {children}
    </p>
  )
}

export function AuthNote({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 rounded-[2px] border border-secondary px-3.5 py-2.5 text-[13px] leading-relaxed text-secondary">
      {children}
    </p>
  )
}

export function GoogleButton({
  onClick,
  loading,
  disabled,
  label,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[2px] border border-border bg-background px-6 text-[14px] text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-ink-soft/30 border-t-foreground" />
      ) : (
        <GoogleIcon />
      )}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
