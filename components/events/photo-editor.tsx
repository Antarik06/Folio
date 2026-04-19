'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhotoFilters {
  // Basic
  brightness: number  // 100 = normal
  contrast: number    // 100 = normal
  saturation: number  // 100 = normal
  warmth: number      // hue-rotate deg, 0 = normal
  sepia: number       // 0–100

  // Tone
  highlights: number  // -100 to +100 (simulated via brightness on bright regions)
  shadows: number     // -100 to +100
  fade: number        // 0–100 (lifts blacks = matte fade look)

  // Vignette
  vignette: number    // 0–100

  // Crop / Rotate
  rotation: number    // -180 to +180 degrees
  flipH: boolean
  flipV: boolean
}

const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  sepia: 0,
  highlights: 0,
  shadows: 0,
  fade: 0,
  vignette: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
}

// ─── Film Presets ─────────────────────────────────────────────────────────────

interface Preset {
  name: string
  emoji: string
  filters: Partial<PhotoFilters>
  gradient?: string // For thumbnail swatch
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

interface Size {
  width: number
  height: number
}

const FILM_PRESETS: Preset[] = [
  { name: 'Original', emoji: '⬜', gradient: 'linear-gradient(135deg,#ccc,#888)', filters: { ...DEFAULT_FILTERS } },
  {
    name: 'Kodachrome',
    emoji: '🎞',
    gradient: 'linear-gradient(135deg,#c0392b,#e67e22)',
    filters: { brightness: 105, contrast: 115, saturation: 120, warmth: 12, sepia: 8, fade: 5, vignette: 25 },
  },
  {
    name: 'Portra 400',
    emoji: '🌅',
    gradient: 'linear-gradient(135deg,#d4a373,#e9c46a)',
    filters: { brightness: 108, contrast: 95, saturation: 90, warmth: 18, sepia: 12, fade: 18, vignette: 15 },
  },
  {
    name: 'Ilford HP5',
    emoji: '◻️',
    gradient: 'linear-gradient(135deg,#555,#bbb)',
    filters: { brightness: 105, contrast: 125, saturation: 0, warmth: 0, sepia: 0, fade: 8, vignette: 35 },
  },
  {
    name: 'Cross Process',
    emoji: '🌈',
    gradient: 'linear-gradient(135deg,#6a0dad,#e040fb)',
    filters: { brightness: 110, contrast: 130, saturation: 150, warmth: -30, sepia: 0, fade: 0, vignette: 20 },
  },
  {
    name: 'Golden Hour',
    emoji: '☀️',
    gradient: 'linear-gradient(135deg,#f7b731,#e8590c)',
    filters: { brightness: 110, contrast: 105, saturation: 115, warmth: 30, sepia: 15, fade: 10, vignette: 30 },
  },
  {
    name: 'Polaroid',
    emoji: '📷',
    gradient: 'linear-gradient(135deg,#ffe066,#b5e8d7)',
    filters: { brightness: 112, contrast: 90, saturation: 95, warmth: 8, sepia: 20, fade: 22, vignette: 40 },
  },
  {
    name: 'Noir',
    emoji: '🌑',
    gradient: 'linear-gradient(135deg,#111,#555)',
    filters: { brightness: 92, contrast: 140, saturation: 0, warmth: 0, sepia: 5, fade: 0, vignette: 60 },
  },
  {
    name: 'Matte',
    emoji: '🫧',
    gradient: 'linear-gradient(135deg,#aab,#dde)',
    filters: { brightness: 103, contrast: 88, saturation: 85, warmth: 5, sepia: 0, fade: 32, vignette: 10 },
  },
  {
    name: 'Lomo',
    emoji: '🔴',
    gradient: 'linear-gradient(135deg,#e63946,#f4a261)',
    filters: { brightness: 95, contrast: 140, saturation: 160, warmth: -15, sepia: 0, fade: 0, vignette: 55 },
  },
]

// ─── Helper: build CSS filter string ─────────────────────────────────────────

function buildCssFilter(f: PhotoFilters): string {
  // We approximate highlights/shadows by adjusting brightness/contrast
  // Highlights > 0 = slightly more brightness; < 0 = less
  // Shadows > 0 = lift blacks via gamma; < 0 = crush them
  const brightnessAdj = f.brightness + f.highlights * 0.15 - f.shadows * 0.08
  const contrastAdj = f.contrast + (f.shadows < 0 ? Math.abs(f.shadows) * 0.2 : 0)

  return [
    `brightness(${Math.max(0, brightnessAdj)}%)`,
    `contrast(${Math.max(0, contrastAdj)}%)`,
    `saturate(${f.saturation}%)`,
    `sepia(${f.sepia}%)`,
    `hue-rotate(${f.warmth}deg)`,
  ].join(' ')
}

// CSS-based vignette + fade are applied via overlay divs in the preview and
// baked into the canvas on export.

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'basic' | 'tone' | 'crop' | 'presets'

// ─── Slider sub-component ────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, unit = '', onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-mono text-foreground tabular-nums">
          {value > 0 && min < 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center group">
        {/* Track */}
        <div className="absolute inset-x-0 h-0.5 bg-border rounded-full overflow-hidden">
          {min < 0 ? (
            /* Bi-directional fill */
            <>
              {value < 0 && (
                <div
                  className="absolute h-full bg-primary/70 rounded-full"
                  style={{ right: '50%', width: `${Math.abs(pct - 50)}%` }}
                />
              )}
              {value > 0 && (
                <div
                  className="absolute h-full bg-primary/70 rounded-full"
                  style={{ left: '50%', width: `${pct - 50}%` }}
                />
              )}
            </>
          ) : (
            <div className="absolute left-0 h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
          )}
        </div>
        {/* Center tick for bi-directional */}
        {min < 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 w-px h-3 bg-border/60" />
        )}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-full opacity-0 cursor-pointer"
          style={{ WebkitAppearance: 'none' }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-primary border-2 border-primary-foreground shadow-md pointer-events-none transition-transform group-hover:scale-110"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>
    </div>
  )
}

// ─── Toggle Button ────────────────────────────────────────────────────────────

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-all ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PhotoEditorProps {
  imageUrl: string
  onCancel: () => void
  onSave: (editedBlob: Blob) => Promise<void>
}

export function PhotoEditor({ imageUrl, onCancel, onSave }: PhotoEditorProps) {
  const [filters, setFilters] = useState<PhotoFilters>(DEFAULT_FILTERS)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropAspect, setCropAspect] = useState<number>(4 / 3)
  const [imageAspect, setImageAspect] = useState<number>(4 / 3)
  const [previewSize, setPreviewSize] = useState<Size>({ width: 0, height: 0 })
  const [cropSize, setCropSize] = useState<Size | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('presets')
  const [saving, setSaving] = useState(false)
  const [activePreset, setActivePreset] = useState<string>('Original')
  const imageRef = useRef<HTMLImageElement>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const resizeStateRef = useRef<{
    handle: ResizeHandle
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  // ── Apply preset ──
  const applyPreset = useCallback((preset: Preset) => {
    setFilters((f) => ({ ...f, ...DEFAULT_FILTERS, ...preset.filters }))
    setActivePreset(preset.name)
  }, [])

  // ── CSS filter for live preview ──
  const cssFilter = buildCssFilter(filters)

  // ── Transform (rotation + flip) ──
  const transform = [
    `rotate(${filters.rotation}deg)`,
    `scaleX(${filters.flipH ? -1 : 1})`,
    `scaleY(${filters.flipV ? -1 : 1})`,
  ].join(' ')

  // ── Vignette radial-gradient overlay ──
  const vignetteStyle: React.CSSProperties =
    filters.vignette > 0
      ? {
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${
            (filters.vignette / 100) * 0.85
          }) 100%)`,
        }
      : {}

  // ── Fade overlay (lifts blacks with a semi-transparent white layer) ──
  const fadeOpacity = filters.fade / 100 * 0.45

  // ── Snap rotation to 90-deg multiples ──
  const snapRotate = (delta: number) => {
    setFilters((f) => ({ ...f, rotation: (f.rotation + delta + 360) % 360 }))
  }

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const computeFrameSize = useCallback(
    (aspect: number): Size | null => {
      if (!previewSize.width || !previewSize.height || !Number.isFinite(aspect) || aspect <= 0) {
        return null
      }

      const maxWidth = previewSize.width * 0.82
      const maxHeight = previewSize.height * 0.82
      let width = maxWidth
      let height = width / aspect

      if (height > maxHeight) {
        height = maxHeight
        width = height * aspect
      }

      return { width, height }
    },
    [previewSize.height, previewSize.width]
  )

  useEffect(() => {
    const node = previewWrapRef.current
    if (!node) return

    const updateSize = () => {
      const rect = node.getBoundingClientRect()
      setPreviewSize({ width: rect.width, height: rect.height })
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [activeTab])

  useEffect(() => {
    if (cropSize) return
    const next = computeFrameSize(cropAspect)
    if (next) setCropSize(next)
  }, [computeFrameSize, cropAspect, cropSize])

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const handleResizeMove = useCallback(
    (event: PointerEvent) => {
      const state = resizeStateRef.current
      if (!state || !previewSize.width || !previewSize.height) return

      const xSign = state.handle === 'ne' || state.handle === 'se' ? 1 : -1
      const ySign = state.handle === 'sw' || state.handle === 'se' ? 1 : -1
      const dx = (event.clientX - state.startX) * xSign * 2
      const dy = (event.clientY - state.startY) * ySign * 2

      const rawWidthX = state.startWidth + dx
      const rawHeightY = state.startHeight + dy

      const xRatio = Math.abs(rawWidthX - state.startWidth) / Math.max(1, state.startWidth)
      const yRatio = Math.abs(rawHeightY - state.startHeight) / Math.max(1, state.startHeight)

      let nextWidth = xRatio >= yRatio ? rawWidthX : rawHeightY * cropAspect
      let nextHeight = nextWidth / cropAspect

      const minHeight = 90
      const minWidth = minHeight * cropAspect
      const maxWidth = Math.min(previewSize.width * 0.98, previewSize.height * 0.98 * cropAspect)

      nextWidth = clamp(nextWidth, minWidth, maxWidth)
      nextHeight = nextWidth / cropAspect

      setCropSize({ width: nextWidth, height: nextHeight })
    },
    [cropAspect, previewSize.height, previewSize.width]
  )

  const stopResize = () => {
    resizeStateRef.current = null
    window.removeEventListener('pointermove', handleResizeMove)
    window.removeEventListener('pointerup', stopResize)
  }

  const startResize = (handle: ResizeHandle) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!cropSize) return

    event.preventDefault()
    event.stopPropagation()

    resizeStateRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: cropSize.width,
      startHeight: cropSize.height,
    }

    window.addEventListener('pointermove', handleResizeMove)
    window.addEventListener('pointerup', stopResize)
  }

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropAspect(imageAspect)
    const next = computeFrameSize(imageAspect)
    if (next) setCropSize(next)
    setCroppedAreaPixels(null)
  }

  const applyCropAspect = (ratio: number | null) => {
    const nextAspect = ratio ?? imageAspect
    setCropAspect(nextAspect)
    const next = computeFrameSize(nextAspect)
    if (next) setCropSize(next)
  }

  // ── Save to canvas ──
  const handleSave = async () => {
    if (!imageRef.current) return
    setSaving(true)
    try {
      const img = imageRef.current
      const sourceX = Math.max(0, Math.round(croppedAreaPixels?.x ?? 0))
      const sourceY = Math.max(0, Math.round(croppedAreaPixels?.y ?? 0))
      const sourceWidth = Math.max(1, Math.round(croppedAreaPixels?.width ?? img.naturalWidth))
      const sourceHeight = Math.max(1, Math.round(croppedAreaPixels?.height ?? img.naturalHeight))

      const canvas = document.createElement('canvas')
      const rad = (filters.rotation * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      canvas.width = sourceWidth * cos + sourceHeight * sin
      canvas.height = sourceWidth * sin + sourceHeight * cos

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No canvas context')

      // Apply CSS filters
      ctx.filter = cssFilter

      // Apply transform
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)
      ctx.scale(filters.flipH ? -1 : 1, filters.flipV ? -1 : 1)
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -sourceWidth / 2,
        -sourceHeight / 2,
        sourceWidth,
        sourceHeight
      )
      ctx.restore()

      // Apply fade overlay
      if (filters.fade > 0) {
        ctx.filter = 'none'
        ctx.globalCompositeOperation = 'screen'
        ctx.fillStyle = `rgba(255,255,255,${fadeOpacity})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'source-over'
      }

      // Apply vignette overlay
      if (filters.vignette > 0) {
        ctx.filter = 'none'
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        )
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, `rgba(0,0,0,${(filters.vignette / 100) * 0.85})`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      canvas.toBlob(
        async (blob) => {
          if (blob) await onSave(blob)
          else console.error('Blob creation failed')
          setSaving(false)
        },
        'image/jpeg',
        0.95
      )
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    resetCrop()
    setActivePreset('Original')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'presets', label: 'Presets' },
    { id: 'basic', label: 'Basic' },
    { id: 'tone', label: 'Tone' },
    { id: 'crop', label: 'Crop' },
  ]

  return (
    <div className="fixed inset-0 z-100 bg-background/98 backdrop-blur-3xl flex flex-col md:flex-row overflow-hidden">
      {/* ── Left / Top: Image Preview ── */}
      <div className="flex-1 relative flex items-center justify-center p-6 min-h-[45vh] overflow-hidden">
        {/* Hidden source image for export dimensions */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} crossOrigin="anonymous" alt="" className="hidden" />

        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-5 left-5 z-20 p-2.5 bg-card/80 border border-border rounded-full hover:bg-card transition-all backdrop-blur-sm"
        >
          <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Active preset label */}
        {activePreset !== 'Original' && (
          <div className="absolute top-5 right-5 z-20 px-3 py-1 bg-card/80 border border-border backdrop-blur-sm text-[10px] uppercase tracking-widest text-foreground">
            {activePreset}
          </div>
        )}

        {/* Image / Cropper with overlays */}
        {activeTab === 'crop' ? (
          <div ref={previewWrapRef} className="relative w-full max-w-5xl h-[75vh]">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              cropSize={cropSize ?? undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              cropShape="rect"
              objectFit="contain"
              style={{
                mediaStyle: {
                  filter: cssFilter,
                },
              }}
              onMediaLoaded={({ naturalWidth, naturalHeight }) => {
                const ratio = naturalWidth / naturalHeight
                setImageAspect(ratio)
                setCropAspect((curr) => curr || ratio)
                const next = computeFrameSize(cropAspect || ratio)
                if (next) setCropSize(next)
              }}
            />

            {cropSize && (
              <div
                className="absolute pointer-events-none"
                style={{
                  width: `${cropSize.width}px`,
                  height: `${cropSize.height}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute inset-0 border border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
                <button
                  onPointerDown={startResize('nw')}
                  className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-white border border-foreground/20 shadow pointer-events-auto cursor-nwse-resize"
                  aria-label="Resize crop top left"
                />
                <button
                  onPointerDown={startResize('ne')}
                  className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-white border border-foreground/20 shadow pointer-events-auto cursor-nesw-resize"
                  aria-label="Resize crop top right"
                />
                <button
                  onPointerDown={startResize('sw')}
                  className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-white border border-foreground/20 shadow pointer-events-auto cursor-nesw-resize"
                  aria-label="Resize crop bottom left"
                />
                <button
                  onPointerDown={startResize('se')}
                  className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-white border border-foreground/20 shadow pointer-events-auto cursor-nwse-resize"
                  aria-label="Resize crop bottom right"
                />
              </div>
            )}

            {/* Fade overlay */}
            {filters.fade > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `rgba(245,240,232,${fadeOpacity})`,
                  mixBlendMode: 'screen',
                }}
              />
            )}

            {/* Vignette overlay */}
            {filters.vignette > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={vignetteStyle} />
            )}
          </div>
        ) : (
          <div ref={previewWrapRef} className="relative inline-block max-w-full max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              crossOrigin="anonymous"
              alt="Editing"
              className="block max-w-full max-h-[75vh] object-contain shadow-2xl"
              style={{
                filter: cssFilter,
                transform,
                transition: 'filter 0.12s ease-out, transform 0.2s ease-out',
              }}
              onLoad={(e) => {
                const target = e.currentTarget
                const ratio = target.naturalWidth / target.naturalHeight
                setImageAspect(ratio)
                setCropAspect((curr) => curr || ratio)
              }}
            />

            {/* Fade overlay */}
            {filters.fade > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `rgba(245,240,232,${fadeOpacity})`,
                  mixBlendMode: 'screen',
                }}
              />
            )}

            {/* Vignette overlay */}
            {filters.vignette > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={vignetteStyle} />
            )}
          </div>
        )}
      </div>

      {/* ── Right / Bottom: Controls Panel ── */}
      <div className="w-full md:w-85 bg-card border-t md:border-t-0 md:border-l border-border flex flex-col">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h3 className="font-serif text-xl text-foreground tracking-tight">Edit Photo</h3>
          <button
            onClick={handleReset}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset All
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest transition-all font-medium ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">

          {/* ── PRESETS ── */}
          {activeTab === 'presets' && (
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Film Looks</p>
              <div className="grid grid-cols-2 gap-3">
                {FILM_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`group relative aspect-4/3 rounded-sm overflow-hidden border-2 transition-all ${
                      activePreset === preset.name
                        ? 'border-primary shadow-lg shadow-primary/20 scale-[0.98]'
                        : 'border-border hover:border-foreground/40'
                    }`}
                    style={{ background: preset.gradient }}
                  >
                    {/* Swatch overlay with image preview feel */}
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-[9px] uppercase tracking-widest text-white drop-shadow-md font-semibold leading-none">
                        {preset.name}
                      </span>
                    </div>
                    {activePreset === preset.name && (
                      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── BASIC ── */}
          {activeTab === 'basic' && (
            <div className="p-5 space-y-6">
              <Slider label="Brightness" value={filters.brightness} min={0} max={200} unit="%" onChange={(v) => setFilters((f) => ({ ...f, brightness: v }))} />
              <Slider label="Contrast" value={filters.contrast} min={0} max={200} unit="%" onChange={(v) => setFilters((f) => ({ ...f, contrast: v }))} />
              <Slider label="Saturation" value={filters.saturation} min={0} max={200} unit="%" onChange={(v) => setFilters((f) => ({ ...f, saturation: v }))} />
              <Slider label="Warmth" value={filters.warmth} min={-90} max={90} unit="°" onChange={(v) => setFilters((f) => ({ ...f, warmth: v }))} />
              <Slider label="Vintage / Sepia" value={filters.sepia} min={0} max={100} unit="%" onChange={(v) => setFilters((f) => ({ ...f, sepia: v }))} />
            </div>
          )}

          {/* ── TONE ── */}
          {activeTab === 'tone' && (
            <div className="p-5 space-y-6">
              <Slider label="Highlights" value={filters.highlights} min={-100} max={100} onChange={(v) => setFilters((f) => ({ ...f, highlights: v }))} />
              <Slider label="Shadows" value={filters.shadows} min={-100} max={100} onChange={(v) => setFilters((f) => ({ ...f, shadows: v }))} />
              <div className="h-px bg-border" />
              <Slider label="Fade (Lift Blacks)" value={filters.fade} min={0} max={100} onChange={(v) => setFilters((f) => ({ ...f, fade: v }))} />
              <Slider label="Vignette" value={filters.vignette} min={0} max={100} onChange={(v) => setFilters((f) => ({ ...f, vignette: v }))} />

              {/* Tone legend */}
              <div className="mt-2 p-3 bg-background/50 border border-border/50 rounded-sm space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">About Tone</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Fade lifts the blacks for a matte film look. Vignette darkens the edges, drawing focus to the center.
                </p>
              </div>
            </div>
          )}

          {/* ── CROP / ROTATE ── */}
          {activeTab === 'crop' && (
            <div className="p-5 space-y-6">
              {/* Rotation slider */}
              <Slider
                label="Rotation"
                value={filters.rotation}
                min={-180}
                max={180}
                unit="°"
                onChange={(v) => setFilters((f) => ({ ...f, rotation: v }))}
              />

              {/* Quick snap buttons */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Quick Rotate</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '↺ 90°', delta: -90 },
                    { label: '↻ 90°', delta: 90 },
                    { label: '↻ 180°', delta: 180 },
                    { label: '⟳', delta: -filters.rotation },
                  ].map(({ label, delta }) => (
                    <button
                      key={label}
                      onClick={() => delta === -filters.rotation
                        ? setFilters((f) => ({ ...f, rotation: 0 }))
                        : snapRotate(delta)
                      }
                      className="py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flip */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Flip</p>
                <div className="flex gap-3">
                  <ToggleBtn
                    label="⇄ Horizontal"
                    active={filters.flipH}
                    onClick={() => setFilters((f) => ({ ...f, flipH: !f.flipH }))}
                  />
                  <ToggleBtn
                    label="⇅ Vertical"
                    active={filters.flipV}
                    onClick={() => setFilters((f) => ({ ...f, flipV: !f.flipV }))}
                  />
                </div>
              </div>

              {/* Note about free crop */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Crop Zoom</p>
                <Slider label="Zoom" value={Math.round(zoom * 100)} min={100} max={300} unit="%" onChange={(v) => setZoom(v / 100)} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Aspect</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => applyCropAspect(null)}
                    className="py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
                  >
                    Original
                  </button>
                  <button
                    onClick={() => applyCropAspect(1)}
                    className="py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => applyCropAspect(4 / 3)}
                    className="py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
                  >
                    4:3
                  </button>
                  <button
                    onClick={() => applyCropAspect(16 / 9)}
                    className="py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
                  >
                    16:9
                  </button>
                </div>
              </div>

              <button
                onClick={resetCrop}
                className="w-full py-2.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all tracking-wide"
              >
                Reset Crop Framing
              </button>

              <div className="p-3 bg-background/50 border border-border/50 rounded-sm">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Note</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Drag on the image to frame your crop. Crop, rotation, and flip are baked on save.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="p-5 border-t border-border flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3.5 border border-border text-foreground text-[10px] uppercase tracking-widest hover:bg-background transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 relative overflow-hidden"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving…
              </span>
            ) : (
              'Save Copy'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
