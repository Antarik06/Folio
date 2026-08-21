'use client'

import React from 'react'
import { Images, Type, Palette, LayoutTemplate, X, Upload } from 'lucide-react'
import { ALBUM_STYLES, styleOfTemplate, type MagazineTemplate } from '@/lib/magazine-templates'
import { AlbumMiniature } from '@/components/create/album-miniature'
import type { AlbumElement } from './types'

/**
 * The editor's left panel.
 *
 * Rebuilt from nine tabs down to four. The old set — Templates, Design,
 * Elements, Photos, Uploads, Text, AI, Draw, Projects — put nine unrelated
 * jobs at the same level and made the simplest task (drop a photo in) compete
 * with the rarest (freehand drawing). Anyone wanting that much control should
 * be commissioning an artist instead, which is what the Create tab now offers.
 *
 * What is left is the four things making an album actually needs:
 *
 *   Photos   your own pictures, tap to place
 *   Text     three sizes, nothing else
 *   Colour   page background and plain colour blocks
 *   Layout   swap the whole template
 *
 * There is no simple/advanced split any more. This is the editor.
 */

export type SidebarPanel = 'photos' | 'text' | 'colour' | 'layout'

const TABS: { id: SidebarPanel; label: string; icon: any }[] = [
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'colour', label: 'Colour', icon: Palette },
  { id: 'layout', label: 'Layout', icon: LayoutTemplate },
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

interface SidebarProps {
  activePanel: SidebarPanel
  onChangePanel: (p: SidebarPanel) => void
  onAddElement: (el: any) => void
  photos?: any[]
  onGoBack: () => void
  spreadBackground?: string
  onSetSpreadBackground?: (color: string, applyToAll?: boolean) => void
  onUploadPhotos?: (files: FileList) => void
  uploading?: boolean

  templates?: MagazineTemplate[]
  activeTemplateId?: string | null
  onApplyTemplate?: (templateId: string) => Promise<boolean> | boolean

  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  activePanel,
  onChangePanel,
  onAddElement,
  photos = [],
  onGoBack,
  spreadBackground,
  onSetSpreadBackground,
  onUploadPhotos,
  uploading,
  templates = [],
  activeTemplateId,
  onApplyTemplate,
  isMobile,
  isOpen,
  onClose,
}: SidebarProps) {
  const [applying, setApplying] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const addPhoto = React.useCallback(
    (photo: any) => {
      onAddElement({
        type: 'image',
        name: 'Photo',
        src: photo.blob_url || photo.thumbnail_url,
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

  const addBlock = React.useCallback(
    (colour: string) => {
      onAddElement({
        type: 'shape',
        name: 'Colour block',
        shapeType: 'rectangle',
        fill: colour,
        width: 240,
        height: 160,
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
        'z-25 flex h-full flex-shrink-0 border-r border-border bg-card transition-transform duration-300',
        isMobile ? 'fixed inset-y-0 left-0' : '',
        isMobile && !isOpen ? '-translate-x-full' : isMobile ? 'translate-x-0 shadow-2xl' : '',
      ].join(' ')}
    >
      {/* ── Tab rail ─────────────────────────────────────────────────── */}
      <div className="flex h-full w-[72px] flex-col items-center border-r border-border bg-surface-2 pt-4">
        <button
          type="button"
          onClick={onGoBack}
          title="Back"
          aria-label="Back"
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-border font-serif text-lg text-foreground transition-colors hover:border-foreground"
        >
          F
        </button>

        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activePanel === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangePanel(tab.id)}
              aria-current={active ? 'true' : undefined}
              className={`mb-1 flex h-[58px] w-[58px] flex-col items-center justify-center gap-1 rounded-[4px] transition-colors ${
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-ink-soft hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.06em]">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Panel ────────────────────────────────────────────────────── */}
      <div className="flex h-full w-[264px] flex-col sm:w-[300px]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
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

        <div className="flex-1 overflow-y-auto p-4">
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
                  className="mb-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[2px] border border-dashed border-border font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload photos'}
                </button>
              ) : null}

              {photos.length === 0 ? (
                <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
                  Photos from this event show up here. Tap one to place it on the
                  page.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => addPhoto(photo)}
                      title="Place on page"
                      className="group relative aspect-square overflow-hidden bg-surface-2 ring-1 ring-inset ring-border transition-all hover:ring-2 hover:ring-primary"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbnail_url || photo.blob_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
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
              <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted-foreground">
                Select any text on the page to change its font, size and colour.
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
                  <button
                    type="button"
                    onClick={() => onSetSpreadBackground(spreadBackground || '#FDFAF5', true)}
                    className="mt-2.5 min-h-[40px] w-full rounded-[2px] border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground"
                  >
                    Apply to every page
                  </button>
                ) : null}
              </section>

              <section>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Colour blocks
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {BLOCK_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => addBlock(c)}
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
        </div>
      </div>
    </div>
  )
}
