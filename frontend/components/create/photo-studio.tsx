'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import {
  DEFAULT_FILTERS,
  FILM_STOCKS,
  buildCssFilter,
  buildTransform,
  isUntouched,
  renderEditedPhoto,
  type PhotoFilters,
} from '@/lib/photo-filters'

/**
 * The Photo Studio — one photograph, under the enlarger.
 *
 * Deliberately a different room from the album editor. The album editor is a
 * light table: pale ground, page rail, spec strip, everything measured. This is
 * the darkroom bench — near-black, one lit print in the middle, a strip of film
 * stocks along the bottom and a column of lab dials down the side.
 *
 * Same design system, opposite end of it. You should never be unsure which of
 * the two you are standing in.
 */

interface StudioPhoto {
  id: string
  url: string
  event_id?: string
  event_title?: string
}

const DIALS: { key: keyof PhotoFilters; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Exposure', min: 50, max: 150 },
  { key: 'contrast', label: 'Contrast', min: 50, max: 160 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 180 },
  { key: 'warmth', label: 'Warmth', min: -40, max: 40 },
  { key: 'fade', label: 'Fade', min: 0, max: 60 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 80 },
]

export function PhotoStudio({ photos }: { photos: StudioPhoto[] }) {
  const [selected, setSelected] = useState<StudioPhoto | null>(null)
  const [filters, setFilters] = useState<PhotoFilters>(DEFAULT_FILTERS)
  const [stock, setStock] = useState('Original')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const css = useMemo(() => buildCssFilter(filters), [filters])
  const transform = useMemo(() => buildTransform(filters), [filters])
  const touched = !isUntouched(filters)

  const pick = useCallback((photo: StudioPhoto) => {
    setSelected(photo)
    setFilters(DEFAULT_FILTERS)
    setStock('Original')
    setSaved(false)
    setError(null)
  }, [])

  const applyStock = useCallback((name: string) => {
    const found = FILM_STOCKS.find((s) => s.name === name)
    if (!found) return
    setStock(name)
    // Keep whatever geometry the user already set; a stock is a grade, not a crop.
    setFilters((f) => ({ ...DEFAULT_FILTERS, ...found.filters, rotation: f.rotation, flipH: f.flipH, flipV: f.flipV }))
    setSaved(false)
  }, [])

  async function save() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const blob = await renderEditedPhoto(selected.url, filters)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session expired. Sign in and try again.')

      const path = `albums/studio/${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(path)

      // Saved alongside the original rather than over it — a grade is a new
      // print, and the negative stays in the library.
      if (selected.event_id) {
        await apiClient.post('/api/photos', {
          eventId: selected.event_id,
          blobUrl: publicUrl,
          blobPathname: path,
          thumbnailUrl: publicUrl,
          originalFilename: `edit-${selected.id}.jpg`,
          fileSize: blob.size,
        })
      }

      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Choosing a frame ─────────────────────────────────────────────── */
  if (!selected) {
    return (
      <div className="min-h-[100dvh] bg-[#0E0C0A]">
        <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 sm:py-14">
          <StudioMasthead />

          <div className="mt-10">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
              Choose a frame — {photos.length} on the shelf
            </div>

            {photos.length === 0 ? (
              <div className="border border-dashed border-[#F5F0E8]/15 px-6 py-16 text-center">
                <p className="font-serif text-2xl italic text-[#F5F0E8]">Nothing to print yet</p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#F5F0E8]/50">
                  Photographs from your events and spaces appear here.
                </p>
                <Link
                  href="/photos"
                  className="mt-7 inline-flex min-h-[48px] items-center rounded-[2px] bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground"
                >
                  Go to Photos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-[#F5F0E8]/10 sm:grid-cols-6 lg:grid-cols-8">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => pick(photo)}
                    className="group relative aspect-square overflow-hidden bg-[#14110E]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                    />
                    <span className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-inset ring-primary transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── The bench ────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0E0C0A]">
      {/* Slip line */}
      <header className="flex items-center gap-3 border-b border-[#F5F0E8]/10 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex min-h-[40px] items-center rounded-[2px] border border-[#F5F0E8]/20 px-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/70 transition-colors hover:border-[#F5F0E8]/50 hover:text-[#F5F0E8]"
        >
          ← Frames
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
          Darkroom
        </span>
        <span className="ml-auto truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/40">
          {selected.event_title || 'Untitled'} · {stock}
        </span>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* ── The print, under the lamp ──────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(245,240,232,0.10) 0%, rgba(14,12,10,0) 62%)',
            }}
          />
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt=""
              className="max-h-[52vh] max-w-full object-contain shadow-[0_30px_80px_rgba(0,0,0,0.7)] lg:max-h-[68vh]"
              style={{ filter: css, transform }}
            />
            {filters.fade > 0 ? (
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: `rgba(255,255,255,${(filters.fade / 100) * 0.35})` }}
              />
            ) : null}
            {filters.vignette > 0 ? (
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${
                    (filters.vignette / 100) * 0.85
                  }) 100%)`,
                }}
              />
            ) : null}
          </div>
        </div>

        {/* ── Dials ──────────────────────────────────────────────────── */}
        <aside className="border-t border-[#F5F0E8]/10 px-4 py-5 sm:px-6 lg:w-[280px] lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
              Dials
            </span>
            {touched ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS)
                  setStock('Original')
                }}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary hover:underline"
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-1">
            {DIALS.map((dial) => (
              <label key={dial.key} className="block">
                <span className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/55">
                  {dial.label}
                  <span className="tabular-nums text-[#F5F0E8]/35">
                    {String(filters[dial.key] as number)}
                  </span>
                </span>
                <input
                  type="range"
                  min={dial.min}
                  max={dial.max}
                  value={filters[dial.key] as number}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, [dial.key]: Number(e.target.value) }))
                    setSaved(false)
                  }}
                  className="mt-1.5 h-9 w-full accent-[var(--primary)]"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#F5F0E8]/10 pt-4">
            <BenchButton onClick={() => setFilters((f) => ({ ...f, rotation: (f.rotation - 90) % 360 }))}>
              Rotate ⟲
            </BenchButton>
            <BenchButton onClick={() => setFilters((f) => ({ ...f, rotation: (f.rotation + 90) % 360 }))}>
              Rotate ⟳
            </BenchButton>
            <BenchButton onClick={() => setFilters((f) => ({ ...f, flipH: !f.flipH }))}>
              Flip H
            </BenchButton>
            <BenchButton onClick={() => setFilters((f) => ({ ...f, flipV: !f.flipV }))}>
              Flip V
            </BenchButton>
          </div>

          {error ? (
            <p className="mt-4 border border-primary px-3 py-2 text-[12px] leading-relaxed text-primary">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={save}
            disabled={saving || !touched}
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-[2px] bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {saving ? 'Printing…' : saved ? 'Saved to library' : 'Save a print'}
          </button>
          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-[#F5F0E8]/30">
            The original stays untouched
          </p>
        </aside>
      </div>

      {/* ── Film strip ─────────────────────────────────────────────────── */}
      <div className="border-t border-[#F5F0E8]/10 bg-[#14110E]">
        <div className="flex items-center gap-1.5 px-4 pt-2 sm:px-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-[1px] bg-[#F5F0E8]/12" />
          ))}
        </div>

        <div className="snap-rail overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex w-max gap-2.5">
            {FILM_STOCKS.map((s) => {
              const active = s.name === stock
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => applyStock(s.name)}
                  className={`w-[104px] shrink-0 rounded-[2px] border p-2 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-[#F5F0E8]/12 hover:border-[#F5F0E8]/35'
                  }`}
                >
                  <span
                    className="block h-10 w-full rounded-[1px]"
                    style={{ background: s.swatch }}
                  />
                  <span className="mt-1.5 block truncate font-mono text-[10px] uppercase tracking-[0.06em] text-[#F5F0E8]">
                    {s.name}
                  </span>
                  <span className="block truncate font-mono text-[9px] uppercase tracking-[0.06em] text-[#F5F0E8]/35">
                    {s.note}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-4 pb-2 sm:px-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-[1px] bg-[#F5F0E8]/12" />
          ))}
        </div>
      </div>
    </div>
  )
}

function StudioMasthead() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-[#F5F0E8]/12 pb-5">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
          Create — Photo Studio
        </div>
        <h1 className="mt-3 font-serif text-[clamp(2.2rem,7vw,3.4rem)] leading-[0.95] tracking-[-0.02em] text-[#F5F0E8]">
          One frame at a time
        </h1>
      </div>
      <Link
        href="/create"
        className="inline-flex min-h-[44px] items-center rounded-[2px] border border-[#F5F0E8]/20 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]/70 transition-colors hover:border-[#F5F0E8]/50 hover:text-[#F5F0E8]"
      >
        ← Create
      </Link>
    </header>
  )
}

function BenchButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-[2px] border border-[#F5F0E8]/18 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/75 transition-colors hover:border-primary hover:text-primary"
    >
      {children}
    </button>
  )
}
