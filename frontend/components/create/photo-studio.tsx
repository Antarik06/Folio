'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Cropper from 'react-easy-crop'
import {
  ArrowLeft,
  Check,
  Crop,
  Download,
  FlipHorizontal2,
  FlipVertical2,
  Images,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import {
  DEFAULT_FILTERS,
  FILM_STOCKS,
  isUntouched,
  loadImage,
  paintPhoto,
  type CropRect,
  type PhotoFilters,
} from '@/lib/photo-filters'

/**
 * The Photo Studio — one photograph, under the enlarger.
 *
 * Deliberately a different room from the album editor. The album editor is a
 * light table: pale ground, page rail, spec strip, everything measured. This is
 * the darkroom bench — near-black, one lit print in the middle, a rail of dials
 * down the side and a strip of film stocks along the bottom.
 *
 * The print in the middle is a canvas painted by the same code that writes the
 * JPEG, so what you are looking at is the file you will get — crop, rotation,
 * fade and vignette included, not approximated in CSS on top of an <img>.
 */

interface StudioPhoto {
  id: string
  url: string
  event_id?: string
  event_title?: string
}

type DialGroup = 'tone' | 'colour' | 'finish'

const DIAL_GROUPS: { id: DialGroup; label: string }[] = [
  { id: 'tone', label: 'Tone' },
  { id: 'colour', label: 'Colour' },
  { id: 'finish', label: 'Finish' },
]

const DIALS: {
  key: keyof PhotoFilters
  label: string
  min: number
  max: number
  group: DialGroup
  /** The value that reads as "off", for the reset dot and the centre tick. */
  neutral: number
}[] = [
  { key: 'brightness', label: 'Exposure', min: 50, max: 150, group: 'tone', neutral: 100 },
  { key: 'contrast', label: 'Contrast', min: 50, max: 160, group: 'tone', neutral: 100 },
  { key: 'highlights', label: 'Highlights', min: -50, max: 50, group: 'tone', neutral: 0 },
  { key: 'shadows', label: 'Shadows', min: -50, max: 50, group: 'tone', neutral: 0 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 180, group: 'colour', neutral: 100 },
  { key: 'warmth', label: 'Warmth', min: -40, max: 40, group: 'colour', neutral: 0 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, group: 'colour', neutral: 0 },
  { key: 'fade', label: 'Fade', min: 0, max: 60, group: 'finish', neutral: 0 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 80, group: 'finish', neutral: 0 },
]

const CROP_RATIOS: { label: string; value: number | undefined }[] = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
  { label: '16:9', value: 16 / 9 },
]

/** The long edge the on-screen print is painted at. Enough for a retina 4K. */
const PREVIEW_MAX_EDGE = 2000

export function PhotoStudio({
  photos,
  initialPhotoId,
}: {
  photos: StudioPhoto[]
  initialPhotoId?: string
}) {
  const [selected, setSelected] = useState<StudioPhoto | null>(
    () => photos.find((p) => p.id === initialPhotoId) ?? null
  )
  const [filters, setFilters] = useState<PhotoFilters>(DEFAULT_FILTERS)
  const [stock, setStock] = useState('Original')
  const [group, setGroup] = useState<DialGroup>('tone')
  const [cropping, setCropping] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [framesOpen, setFramesOpen] = useState(false)

  const touched = !isUntouched(filters)

  const pick = useCallback((photo: StudioPhoto) => {
    setSelected(photo)
    setFilters(DEFAULT_FILTERS)
    setStock('Original')
    setCropping(false)
    setSaved(false)
    setError(null)
    setFramesOpen(false)
  }, [])

  const applyStock = useCallback((name: string) => {
    const found = FILM_STOCKS.find((s) => s.name === name)
    if (!found) return
    setStock(name)
    // A stock is a grade, not a crop: whatever geometry is already set stays.
    setFilters((f) => ({
      ...DEFAULT_FILTERS,
      ...found.filters,
      rotation: f.rotation,
      flipH: f.flipH,
      flipV: f.flipV,
      crop: f.crop,
    }))
    setSaved(false)
  }, [])

  const setDial = useCallback((key: keyof PhotoFilters, value: number) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }, [])

  const resetAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setStock('Original')
    setSaved(false)
  }, [])

  async function download() {
    if (!selected) return
    setError(null)
    try {
      const { renderEditedPhoto } = await import('@/lib/photo-filters')
      const blob = await renderEditedPhoto(selected.url, filters)
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = `folio-print-${selected.id.slice(0, 8)}.jpg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(href)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const { renderEditedPhoto } = await import('@/lib/photo-filters')
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
      if (!selected.event_id) {
        throw new Error(
          'This frame has no event to file the print under. Download it instead.'
        )
      }

      // Dimensions come off the encoded print, not the negative: a crop or a
      // quarter-turn changes them, and the print pipeline reads them back to
      // work out whether a frame has the resolution to be printed large.
      const size = await measureBlob(blob)

      await apiClient.post('/api/photos', {
        eventId: selected.event_id,
        blobUrl: publicUrl,
        blobPathname: path,
        thumbnailUrl: publicUrl,
        originalFilename: `edit-${selected.id}.jpg`,
        fileSize: blob.size,
        width: size?.width,
        height: size?.height,
      })

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
              href="/create#studio"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[2px] border border-[#F5F0E8]/20 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]/70 transition-colors hover:border-[#F5F0E8]/50 hover:text-[#F5F0E8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Create
            </Link>
          </header>

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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0E0C0A]">
      {/* ── Slip line ──────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-2 border-b border-[#F5F0E8]/10 px-3 py-2.5 sm:px-5">
        <Link
          href="/create#studio"
          title="Back to Create"
          aria-label="Back to Create"
          className="flex h-10 w-10 items-center justify-center rounded-[2px] text-[#F5F0E8]/60 transition-colors hover:bg-[#F5F0E8]/8 hover:text-[#F5F0E8]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>

        <button
          type="button"
          onClick={() => setFramesOpen(true)}
          className="inline-flex min-h-[38px] items-center gap-2 rounded-[2px] border border-[#F5F0E8]/18 px-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/75 transition-colors hover:border-[#F5F0E8]/45 hover:text-[#F5F0E8]"
        >
          <Images className="h-3.5 w-3.5" />
          Frames
        </button>

        <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.16em] text-primary sm:inline">
          Darkroom
        </span>

        <span className="ml-auto hidden max-w-[28ch] truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/40 md:inline">
          {selected.event_title || 'Untitled'} · {stock}
        </span>

        <button
          type="button"
          onClick={resetAll}
          disabled={!touched}
          title="Reset everything"
          className="ml-2 inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/60 transition-colors hover:text-[#F5F0E8] disabled:opacity-30"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={() => void download()}
          title="Download this print"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] border border-[#F5F0E8]/18 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/75 transition-colors hover:border-[#F5F0E8]/45 hover:text-[#F5F0E8]"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !touched}
          className="inline-flex min-h-[38px] items-center rounded-[2px] bg-primary px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {saving ? 'Printing…' : saved ? 'Saved' : 'Save print'}
        </button>
      </header>

      {error ? (
        <p
          role="alert"
          className="shrink-0 border-b border-primary/40 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-primary"
        >
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p
          role="status"
          className="flex shrink-0 items-center gap-2 border-b border-secondary/40 bg-secondary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-secondary"
        >
          <Check className="h-3.5 w-3.5" />
          Saved to your prints
          <Link href="/create#prints" className="underline underline-offset-2">
            See saved photos
          </Link>
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ── The print, under the lamp ──────────────────────────────── */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(245,240,232,0.10) 0%, rgba(14,12,10,0) 62%)',
            }}
          />

          {cropping ? (
            <CropStage
              src={selected.url}
              filters={filters}
              onCancel={() => setCropping(false)}
              onApply={(crop) => {
                setFilters((f) => ({ ...f, crop }))
                setCropping(false)
                setSaved(false)
              }}
            />
          ) : (
            <Print
              src={selected.url}
              filters={comparing ? { ...DEFAULT_FILTERS, crop: filters.crop } : filters}
            />
          )}

          {!cropping ? (
            <button
              type="button"
              disabled={!touched}
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              onPointerCancel={() => setComparing(false)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-[2px] border border-[#F5F0E8]/18 bg-[#0E0C0A]/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/70 backdrop-blur-sm transition-colors hover:text-[#F5F0E8] disabled:opacity-25"
            >
              {comparing ? 'Original' : 'Hold to compare'}
            </button>
          ) : null}
        </div>

        {/* ── Dials ──────────────────────────────────────────────────── */}
        {!cropping ? (
          <aside className="flex max-h-[46dvh] shrink-0 flex-col overflow-hidden border-t border-[#F5F0E8]/10 lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
            <div className="flex shrink-0 items-stretch border-b border-[#F5F0E8]/10">
              {DIAL_GROUPS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGroup(tab.id)}
                  aria-current={group === tab.id ? 'true' : undefined}
                  className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                    group === tab.id
                      ? 'bg-[#F5F0E8]/6 text-primary'
                      : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-1">
                {DIALS.filter((d) => d.group === group).map((dial) => (
                  <Dial
                    key={dial.key}
                    label={dial.label}
                    min={dial.min}
                    max={dial.max}
                    neutral={dial.neutral}
                    value={filters[dial.key] as number}
                    onChange={(v) => setDial(dial.key, v)}
                  />
                ))}
              </div>

              <div className="mt-6 border-t border-[#F5F0E8]/10 pt-4">
                <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
                  Frame
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <BenchButton
                    onClick={() => setCropping(true)}
                    active={Boolean(filters.crop)}
                    icon={<Crop className="h-3.5 w-3.5" />}
                  >
                    {filters.crop ? 'Recrop' : 'Crop'}
                  </BenchButton>
                  <BenchButton
                    onClick={() => {
                      setFilters((f) => ({ ...f, crop: null }))
                      setSaved(false)
                    }}
                    disabled={!filters.crop}
                    icon={<X className="h-3.5 w-3.5" />}
                  >
                    Full frame
                  </BenchButton>
                  <BenchButton
                    onClick={() => {
                      setFilters((f) => ({ ...f, rotation: (f.rotation - 90 + 360) % 360 }))
                      setSaved(false)
                    }}
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Left
                  </BenchButton>
                  <BenchButton
                    onClick={() => {
                      setFilters((f) => ({ ...f, rotation: (f.rotation + 90) % 360 }))
                      setSaved(false)
                    }}
                    icon={<RotateCw className="h-3.5 w-3.5" />}
                  >
                    Right
                  </BenchButton>
                  <BenchButton
                    onClick={() => {
                      setFilters((f) => ({ ...f, flipH: !f.flipH }))
                      setSaved(false)
                    }}
                    active={filters.flipH}
                    icon={<FlipHorizontal2 className="h-3.5 w-3.5" />}
                  >
                    Flip H
                  </BenchButton>
                  <BenchButton
                    onClick={() => {
                      setFilters((f) => ({ ...f, flipV: !f.flipV }))
                      setSaved(false)
                    }}
                    active={filters.flipV}
                    icon={<FlipVertical2 className="h-3.5 w-3.5" />}
                  >
                    Flip V
                  </BenchButton>
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] leading-relaxed text-[#F5F0E8]/30">
                  The original stays untouched — every save is a new print.
                </p>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {/* ── Film strip ─────────────────────────────────────────────────── */}
      {!cropping ? (
        <div className="shrink-0 border-t border-[#F5F0E8]/10 bg-[#14110E]">
          <Sprockets />
          <div className="scrollbar-hide overflow-x-auto px-4 py-2.5 sm:px-6">
            <div className="flex w-max gap-2">
              {FILM_STOCKS.map((s) => {
                const active = s.name === stock
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => applyStock(s.name)}
                    className={`w-[96px] shrink-0 rounded-[2px] border p-1.5 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary/10'
                        : 'border-[#F5F0E8]/12 hover:border-[#F5F0E8]/35'
                    }`}
                  >
                    <span
                      className="block h-8 w-full rounded-[1px]"
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
          <Sprockets />
        </div>
      ) : null}

      {/* ── Frames drawer ─────────────────────────────────────────────── */}
      {framesOpen ? (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Choose a frame">
          <button
            type="button"
            aria-label="Close frames"
            onClick={() => setFramesOpen(false)}
            className="flex-1 cursor-default bg-black/60"
          />
          <div className="flex w-[86vw] max-w-[420px] flex-col border-l border-[#F5F0E8]/12 bg-[#14110E]">
            <div className="flex items-center justify-between border-b border-[#F5F0E8]/10 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/50">
                {photos.length} frames
              </span>
              <button
                type="button"
                onClick={() => setFramesOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center text-[#F5F0E8]/60 hover:text-[#F5F0E8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-px overflow-y-auto bg-[#F5F0E8]/10 p-px">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => pick(photo)}
                  className={`relative aspect-square overflow-hidden bg-[#14110E] ${
                    photo.id === selected.id ? 'ring-2 ring-inset ring-primary' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * The print itself, painted by the export pipeline at screen resolution.
 *
 * Repainting on a rAF rather than on every input event keeps a dial drag at
 * one paint per frame however fast the slider is moved.
 */
function Print({ src, filters }: { src: string; filters: PhotoFilters }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    imageRef.current = null

    loadImage(src)
      .then((img) => {
        if (cancelled) return
        imageRef.current = img
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    if (status !== 'ready') return
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      try {
        paintPhoto(canvas, image, filters, PREVIEW_MAX_EDGE)
      } catch {
        setStatus('error')
      }
    })

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [status, filters])

  if (status === 'error') {
    return (
      <p className="relative max-w-[32ch] text-center font-mono text-[11px] uppercase tracking-[0.08em] leading-relaxed text-[#F5F0E8]/50">
        That photograph could not be loaded for grading.
      </p>
    )
  }

  // The canvas sits directly in the flex container so `max-h-full` resolves
  // against a definite height: wrapped in an auto-height div, a portrait frame
  // overflowed the bench instead of scaling down to it.
  return (
    <>
      <canvas
        ref={canvasRef}
        className={`relative max-h-full max-w-full object-contain shadow-[0_30px_80px_rgba(0,0,0,0.7)] transition-opacity duration-300 ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {status === 'loading' ? (
        <span className="absolute font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
          Loading the negative…
        </span>
      ) : null}
    </>
  )
}

/**
 * Crop, on the graded image so you are framing what you will actually print.
 * The rectangle is stored against the source, before rotation.
 */
function CropStage({
  src,
  filters,
  onApply,
  onCancel,
}: {
  src: string
  filters: PhotoFilters
  onApply: (crop: CropRect) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<number | undefined>(undefined)
  const [area, setArea] = useState<CropRect | null>(null)

  const initialArea = useMemo(() => {
    if (!filters.crop) return undefined
    return {
      x: filters.crop.x * 100,
      y: filters.crop.y * 100,
      width: filters.crop.width * 100,
      height: filters.crop.height * 100,
    }
  }, [filters.crop])

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black/40">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          initialCroppedAreaPercentages={initialArea}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(percent) =>
            setArea({
              x: percent.x / 100,
              y: percent.y / 100,
              width: percent.width / 100,
              height: percent.height / 100,
            })
          }
          showGrid
          restrictPosition
          style={{
            mediaStyle: {
              filter: [
                `brightness(${filters.brightness}%)`,
                `contrast(${filters.contrast}%)`,
                `saturate(${filters.saturation}%)`,
                `sepia(${filters.sepia}%)`,
                `hue-rotate(${filters.warmth}deg)`,
              ].join(' '),
            },
          }}
        />
      </div>

      <div className="shrink-0 border-t border-[#F5F0E8]/10 bg-[#14110E] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {CROP_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              type="button"
              onClick={() => setAspect(ratio.value)}
              className={`min-h-[36px] rounded-[2px] border px-3 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                aspect === ratio.value
                  ? 'border-primary text-primary'
                  : 'border-[#F5F0E8]/15 text-[#F5F0E8]/65 hover:border-[#F5F0E8]/40 hover:text-[#F5F0E8]'
              }`}
            >
              {ratio.label}
            </button>
          ))}

          <label className="ml-auto flex min-w-[150px] flex-1 items-center gap-2 sm:flex-none">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/45">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-8 w-full accent-[var(--primary)]"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[40px] items-center rounded-[2px] border border-[#F5F0E8]/18 px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/70 transition-colors hover:border-[#F5F0E8]/45 hover:text-[#F5F0E8]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => area && onApply(area)}
              disabled={!area}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[2px] bg-primary px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              Apply crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dial({
  label,
  value,
  min,
  max,
  neutral,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  neutral: number
  onChange: (value: number) => void
}) {
  const changed = value !== neutral

  return (
    <label className="block">
      <span className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#F5F0E8]/55">
        <span className={changed ? 'text-[#F5F0E8]' : undefined}>{label}</span>
        <span className="flex items-center gap-2">
          <span className={`tabular-nums ${changed ? 'text-primary' : 'text-[#F5F0E8]/30'}`}>
            {value > neutral ? '+' : ''}
            {value - neutral}
          </span>
          {changed ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onChange(neutral)
              }}
              title={`Reset ${label}`}
              aria-label={`Reset ${label}`}
              className="text-[#F5F0E8]/35 transition-colors hover:text-[#F5F0E8]"
            >
              <Undo2 className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-8 w-full accent-[var(--primary)]"
      />
    </label>
  )
}

function BenchButton({
  children,
  icon,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors disabled:opacity-30 ${
        active
          ? 'border-primary text-primary'
          : 'border-[#F5F0E8]/18 text-[#F5F0E8]/75 hover:border-[#F5F0E8]/45 hover:text-[#F5F0E8]'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

/** The pixel size of an encoded image, or null where the browser cannot say. */
async function measureBlob(blob: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null
  }
}

function Sprockets() {
  return (
    <div aria-hidden="true" className="flex items-center gap-1.5 overflow-hidden px-4 py-1.5 sm:px-6">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="h-1.5 w-2.5 shrink-0 rounded-[1px] bg-[#F5F0E8]/12" />
      ))}
    </div>
  )
}
