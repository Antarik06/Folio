'use client'

import React from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Images,
  Layers,
  LayoutTemplate,
  Lock,
  Palette,
  Search,
  Square,
  Type,
  Unlock,
  Upload,
  X,
} from 'lucide-react'
import { ALBUM_STYLES, styleOfTemplate, type MagazineTemplate } from '@/lib/magazine-templates'
import { AlbumMiniature } from '@/components/create/album-miniature'
import type { AlbumElement } from './types'

/**
 * The editor's left rail: things you can put on the page.
 *
 * Five jobs, in the order they come up — your photographs, type, colour, the
 * whole layout, and the stack of what is already there. Everything that acts
 * on a *selected* object lives in the inspector on the right instead, so this
 * rail is only ever about adding.
 */

export type SidebarPanel = 'photos' | 'text' | 'colour' | 'layout' | 'layers'

const TABS: { id: SidebarPanel; label: string; icon: any }[] = [
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'colour', label: 'Colour', icon: Palette },
  { id: 'layout', label: 'Layout', icon: LayoutTemplate },
  { id: 'layers', label: 'Layers', icon: Layers },
]

/** Page background swatches — the app's own stocks, plus a few warm papers. */
const PAGE_COLOURS = [
  '#FDFAF5', '#F5F0E8', '#F7F1E7', '#FFFFFF', '#F2F2F0',
  '#1C1814', '#2B2118', '#242019', '#0E0E0E', '#3A342B',
]

/** Colour blocks you can drop on a page. Deliberately a small, warm set. */
const BLOCK_COLOURS = [
  '#B85C38', '#3A7D6E', '#C4A882', '#7A6F64', '#DDD8CE',
  '#1C1814', '#FDFAF5', '#8B9E8B', '#A08060', '#E8B4A0',
]

const TEXT_PRESETS = [
  { label: 'Title', size: 56, weight: 'bold' as const, family: 'serif', sample: 'Add a title' },
  { label: 'Subtitle', size: 28, weight: 'normal' as const, family: 'serif', sample: 'Add a subtitle' },
  { label: 'Caption', size: 16, weight: 'normal' as const, family: 'sans-serif', sample: 'Add a caption' },
]

const SHAPES: { label: string; shapeType: 'rectangle' | 'circle' | 'line' }[] = [
  { label: 'Block', shapeType: 'rectangle' },
  { label: 'Circle', shapeType: 'circle' },
  { label: 'Rule', shapeType: 'line' },
]

const DRAG_MIME = 'application/x-folio-album-element'

interface SidebarProps {
  activePanel: SidebarPanel
  onChangePanel: (p: SidebarPanel) => void
  onAddElement: (el: any) => void
  photos?: any[]
  spreadBackground?: string
  onSetSpreadBackground?: (color: string, applyToAll?: boolean) => void
  onUploadPhotos?: (files: FileList) => void
  uploading?: boolean

  templates?: MagazineTemplate[]
  activeTemplateId?: string | null
  onApplyTemplate?: (templateId: string) => Promise<boolean> | boolean

  /** The current page's stack, topmost last. */
  elements?: AlbumElement[]
  selection?: string[]
  onSelect?: (ids: string[]) => void
  onToggleLock?: (id: string) => void
  onToggleHidden?: (id: string) => void
  onMoveLayer?: (id: string, direction: 'up' | 'down') => void

  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  activePanel,
  onChangePanel,
  onAddElement,
  photos = [],
  spreadBackground,
  onSetSpreadBackground,
  onUploadPhotos,
  uploading,
  templates = [],
  activeTemplateId,
  onApplyTemplate,
  elements = [],
  selection = [],
  onSelect,
  onToggleLock,
  onToggleHidden,
  onMoveLayer,
  isMobile,
  isOpen,
  onClose,
}: SidebarProps) {
  const [applying, setApplying] = React.useState<string | null>(null)
  const [photoQuery, setPhotoQuery] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)

  const visiblePhotos = React.useMemo(() => {
    const needle = photoQuery.trim().toLowerCase()
    if (!needle) return photos
    return photos.filter((p: any) =>
      [p.original_filename, p.event_title, p.location]
        .filter(Boolean)
        .some((field: string) => field.toLowerCase().includes(needle))
    )
  }, [photos, photoQuery])

  const addPhoto = React.useCallback(
    (photo: any) => {
      onAddElement({
        type: 'image',
        name: 'Photo',
        src: photo.blob_url || photo.thumbnail_url || photo.url,
        width: 320,
        height: 240,
        rotation: 0,
        fitMode: 'fill',
      })
      if (isMobile) onClose?.()
    },
    [onAddElement, isMobile, onClose]
  )

  const addText = React.useCallback(
    (preset: (typeof TEXT_PRESETS)[number]) => {
      onAddElement({
        type: 'text',
        name: preset.label,
        text: preset.sample,
        fontSize: preset.size,
        fontFamily: preset.family,
        fontWeight: preset.weight,
        textAlign: 'left',
        fill: '#1C1814',
        width: Math.max(240, preset.size * 8),
        height: Math.round(preset.size * 1.4),
        rotation: 0,
      })
      if (isMobile) onClose?.()
    },
    [onAddElement, isMobile, onClose]
  )

  const addShape = React.useCallback(
    (shapeType: 'rectangle' | 'circle' | 'line', colour: string) => {
      onAddElement({
        type: 'shape',
        name: shapeType === 'line' ? 'Rule' : 'Colour block',
        shapeType,
        fill: colour,
        width: shapeType === 'line' ? 320 : 240,
        height: shapeType === 'line' ? 4 : 160,
        rotation: 0,
      })
      if (isMobile) onClose?.()
    },
    [onAddElement, isMobile, onClose]
  )

  async function applyTemplate(id: string) {
    if (!onApplyTemplate) return
    setApplying(id)
    try {
      await onApplyTemplate(id)
      if (isMobile) onClose?.()
    } finally {
      setApplying(null)
    }
  }

  return (
    <div
      className={[
        'z-30 flex h-full flex-shrink-0 border-r border-border bg-card transition-transform duration-300',
        isMobile ? 'fixed inset-y-0 left-0' : '',
        isMobile && !isOpen ? '-translate-x-full' : isMobile ? 'translate-x-0 shadow-2xl' : '',
      ].join(' ')}
    >
      {/* ── Tab rail ─────────────────────────────────────────────────── */}
      <div className="flex h-full w-[64px] flex-col items-center gap-1 border-r border-border bg-surface-2 py-3">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activePanel === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangePanel(tab.id)}
              aria-current={active ? 'true' : undefined}
              className={`flex h-[54px] w-[54px] flex-col items-center justify-center gap-1 rounded-[4px] transition-colors ${
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-ink-soft hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.04em]">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Panel ────────────────────────────────────────────────────── */}
      <div className="flex h-full w-[258px] flex-col sm:w-[288px]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-serif text-lg text-foreground">
            {TABS.find((t) => t.id === activePanel)?.label}
          </h2>
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex h-9 w-9 items-center justify-center text-ink-soft"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {/* ── Photos ───────────────────────────────────────────────── */}
          {activePanel === 'photos' ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onUploadPhotos?.(e.target.files)
                  e.target.value = ''
                }}
              />
              {onUploadPhotos ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mb-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[2px] border border-dashed border-border font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload photos'}
                </button>
              ) : null}

              {photos.length > 12 ? (
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                  <input
                    value={photoQuery}
                    onChange={(e) => setPhotoQuery(e.target.value)}
                    placeholder="Find a photo"
                    aria-label="Find a photo"
                    className="min-h-[30px] w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.06em] text-foreground placeholder:text-ink-soft/60 focus:outline-none"
                  />
                </div>
              ) : null}

              {photos.length === 0 ? (
                <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
                  Photos from this event show up here. Tap one to place it on the
                  page, or drag it straight onto a slot.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {visiblePhotos.map((photo: any) => {
                    const src = photo.blob_url || photo.thumbnail_url || photo.url
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          const payload = JSON.stringify({
                            type: 'image',
                            name: 'Photo',
                            src,
                            width: 320,
                            height: 240,
                            rotation: 0,
                            fitMode: 'fill',
                          })
                          event.dataTransfer.effectAllowed = 'copy'
                          event.dataTransfer.setData(DRAG_MIME, payload)
                          event.dataTransfer.setData('text/plain', payload)
                        }}
                        onClick={() => addPhoto(photo)}
                        title="Place on page — or drag onto a slot"
                        className="group relative aspect-square overflow-hidden bg-surface-2 ring-1 ring-inset ring-border transition-all hover:ring-2 hover:ring-primary"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnail_url || photo.blob_url || photo.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : null}

          {/* ── Text ─────────────────────────────────────────────────── */}
          {activePanel === 'text' ? (
            <div className="flex flex-col gap-2.5">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => addText(preset)}
                  className="rounded-[4px] border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-primary"
                >
                  <div
                    className="truncate text-foreground"
                    style={{
                      fontFamily: preset.family,
                      fontWeight: preset.weight,
                      fontSize: Math.min(preset.size / 2, 24),
                    }}
                  >
                    {preset.sample}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                    {preset.label} · {preset.size}pt
                  </div>
                </button>
              ))}
              <p className="mt-1 px-1 text-[12px] leading-relaxed text-muted-foreground">
                Double-tap type on the page to edit the words; the inspector on
                the right sets the font, size and colour.
              </p>
            </div>
          ) : null}

          {/* ── Colour ───────────────────────────────────────────────── */}
          {activePanel === 'colour' ? (
            <div className="flex flex-col gap-6">
              <section>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Page background
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {PAGE_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onSetSpreadBackground?.(c)}
                      title={c}
                      aria-label={`Page background ${c}`}
                      className={`aspect-square rounded-[2px] ring-1 ring-inset transition-all ${
                        spreadBackground?.toUpperCase() === c.toUpperCase()
                          ? 'ring-2 ring-primary'
                          : 'ring-border hover:ring-foreground'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                {onSetSpreadBackground ? (
                  <div className="mt-2 flex gap-1.5">
                    <label className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-[2px] border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground">
                      Custom
                      <input
                        type="color"
                        value={spreadBackground || '#FDFAF5'}
                        onChange={(e) => onSetSpreadBackground(e.target.value)}
                        className="sr-only"
                        aria-label="Custom page background"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => onSetSpreadBackground(spreadBackground || '#FDFAF5', true)}
                      className="min-h-[40px] flex-1 rounded-[2px] border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground"
                    >
                      All pages
                    </button>
                  </div>
                ) : null}
              </section>

              <section>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Shapes
                </div>
                <div className="mb-2 grid grid-cols-3 gap-1.5">
                  {SHAPES.map((shape) => (
                    <button
                      key={shape.shapeType}
                      type="button"
                      onClick={() => addShape(shape.shapeType, BLOCK_COLOURS[0])}
                      className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[2px] border border-border font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
                    >
                      <Square
                        className="h-4 w-4"
                        style={{ borderRadius: shape.shapeType === 'circle' ? '50%' : undefined }}
                      />
                      {shape.label}
                    </button>
                  ))}
                </div>

                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Colour blocks
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {BLOCK_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => addShape('rectangle', c)}
                      title={`Add ${c} block`}
                      aria-label={`Add colour block ${c}`}
                      className="aspect-square rounded-[2px] ring-1 ring-inset ring-border transition-all hover:ring-2 hover:ring-primary"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted-foreground">
                  Blocks sit behind or beside photos — useful for a band of
                  colour under a title.
                </p>
              </section>
            </div>
          ) : null}

          {/* ── Layout ───────────────────────────────────────────────── */}
          {activePanel === 'layout' ? (
            templates.length === 0 ? (
              <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
                No layouts available for this album.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
                  Switching a layout keeps your photos and rearranges them.
                </p>
                {templates.map((template) => {
                  const active = template.id === activeTemplateId
                  const busy = applying === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => void applyTemplate(template.id)}
                      disabled={busy}
                      className={`rounded-[4px] border p-2.5 text-left transition-colors ${
                        active ? 'border-primary bg-primary/[0.06]' : 'border-border hover:border-foreground'
                      }`}
                    >
                      <AlbumMiniature
                        spreads={template.spreads}
                        palette={(styleOfTemplate(template.id) ?? ALBUM_STYLES[0]).palette}
                        pages={3}
                      />
                      <div className="mt-2 flex items-baseline justify-between gap-2">
                        <span className="truncate font-serif text-[15px] italic text-foreground">
                          {template.name}
                        </span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-primary">
                          {busy ? 'Applying' : active ? 'Current' : ''}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          ) : null}

          {/* ── Layers ───────────────────────────────────────────────── */}
          {activePanel === 'layers' ? (
            elements.length === 0 ? (
              <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
                This page is empty. Add a photo, some type or a colour block.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
                  Top of the stack first
                </p>
                {[...elements]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el) => {
                    const active = selection.includes(el.id)
                    return (
                      <div
                        key={el.id}
                        className={`flex items-center gap-1.5 rounded-[2px] border px-2 py-1.5 transition-colors ${
                          active ? 'border-primary bg-primary/[0.06]' : 'border-transparent hover:border-border'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect?.([el.id])}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <LayerChip el={el} />
                          <span
                            className={`truncate text-[12px] ${
                              el.hidden ? 'text-ink-soft/50 line-through' : 'text-foreground'
                            }`}
                          >
                            {el.name || el.type}
                          </span>
                        </button>

                        <IconChip
                          label="Bring forward"
                          onClick={() => onMoveLayer?.(el.id, 'up')}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconChip>
                        <IconChip label="Send back" onClick={() => onMoveLayer?.(el.id, 'down')}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconChip>
                        <IconChip
                          label={el.hidden ? 'Show' : 'Hide'}
                          onClick={() => onToggleHidden?.(el.id)}
                        >
                          {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </IconChip>
                        <IconChip
                          label={el.locked ? 'Unlock' : 'Lock'}
                          onClick={() => onToggleLock?.(el.id)}
                        >
                          {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </IconChip>
                      </div>
                    )
                  })}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}

function LayerChip({ el }: { el: AlbumElement }) {
  if (el.type === 'image') {
    return el.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt=""
        loading="lazy"
        className="h-7 w-7 shrink-0 object-cover ring-1 ring-inset ring-border"
      />
    ) : (
      <span className="h-7 w-7 shrink-0 border border-dashed border-border" />
    )
  }

  if (el.type === 'shape') {
    return (
      <span
        className="h-7 w-7 shrink-0 ring-1 ring-inset ring-border"
        style={{ background: el.fill, borderRadius: el.shapeType === 'circle' ? '50%' : 0 }}
      />
    )
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center ring-1 ring-inset ring-border">
      <Type className="h-3.5 w-3.5 text-ink-soft" />
    </span>
  )
}

function IconChip({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] text-ink-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {children}
    </button>
  )
}
