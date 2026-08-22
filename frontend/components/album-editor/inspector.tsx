'use client'

import React from 'react'
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowUp,
  Bold,
  Crop,
  Eye,
  EyeOff,
  FlipHorizontal2,
  FlipVertical2,
  Image as ImageIcon,
  Lock,
  MousePointerSquareDashed,
  Scissors,
  Trash2,
  Type as TypeIcon,
  Unlock,
  X,
} from 'lucide-react'
import type { AlbumElement, ImageElement, TextElement } from './types'

/**
 * The inspector: everything about the thing in your hand.
 *
 * Split out from the top bar, which used to carry a second row of object
 * controls squeezed between the album's own buttons. A photograph has a dozen
 * useful properties — fit, crop, corner, shadow, opacity, flip, order, lock —
 * and none of them belong on the same rule as "Save album".
 *
 * Nothing here appears unless something is selected. With nothing selected the
 * panel says what to do instead of showing disabled controls.
 */

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

interface InspectorProps {
  selected: AlbumElement[]
  onUpdate: (id: string, partial: Partial<AlbumElement>, options?: { historyGroup?: string }) => void
  onDelete: () => void
  onDuplicate: () => void
  onAlign: (mode: AlignMode) => void
  onDistribute: (axis: 'horizontal' | 'vertical') => void
  onMoveLayer: (id: string, direction: 'up' | 'down') => void
  onToggleLock: (id: string) => void
  onToggleHidden: (id: string) => void
  onReplacePhoto: () => void
  onReframe: (id: string) => void
  onRemoveBackground: () => Promise<boolean> | boolean
  /** Page coordinate space, so position readouts are in page units. */
  pageWidth: number
  pageHeight: number

  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const FONTS = [
  { label: 'Serif', value: 'serif' },
  { label: 'Sans', value: 'sans-serif' },
  { label: 'Mono', value: 'monospace' },
  { label: 'Cormorant', value: 'Cormorant Garamond, serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
]

const INK_COLOURS = [
  '#1C1814', '#FDFAF5', '#B85C38', '#3A7D6E', '#7A6F64',
  '#C4A882', '#8B9E8B', '#A08060', '#E8B4A0', '#0E0E0E',
]

export function Inspector({
  selected,
  onUpdate,
  onDelete,
  onDuplicate,
  onAlign,
  onDistribute,
  onMoveLayer,
  onToggleLock,
  onToggleHidden,
  onReplacePhoto,
  onReframe,
  onRemoveBackground,
  pageWidth,
  pageHeight,
  isMobile,
  isOpen,
  onClose,
}: InspectorProps) {
  const single = selected.length === 1 ? selected[0] : null
  const image = single?.type === 'image' ? (single as ImageElement) : null
  const text = single?.type === 'text' ? (single as TextElement) : null
  const shape = single?.type === 'shape' ? single : null
  const [removingBg, setRemovingBg] = React.useState(false)

  const kind = image ? 'Photo' : text ? 'Text' : shape ? 'Shape' : single ? 'Sketch' : 'Selection'

  return (
    <aside
      className={[
        'z-30 flex h-full w-[280px] shrink-0 flex-col border-l border-border bg-card transition-transform duration-300',
        isMobile ? 'fixed inset-y-0 right-0 shadow-2xl' : '',
        isMobile && !isOpen ? 'translate-x-full' : '',
      ].join(' ')}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
            {selected.length > 1 ? `${selected.length} selected` : kind}
          </span>
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="flex h-9 w-9 items-center justify-center text-ink-soft"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selected.length === 0 ? (
          <EmptyInspector />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {/* ── Arrange ────────────────────────────────────────── */}
            <Group label="Arrange">
              <div className="grid grid-cols-6 gap-1">
                <Tool label="Align left" onClick={() => onAlign('left')}>
                  <AlignLeft className="h-4 w-4" />
                </Tool>
                <Tool label="Align centre" onClick={() => onAlign('center')}>
                  <AlignCenter className="h-4 w-4" />
                </Tool>
                <Tool label="Align right" onClick={() => onAlign('right')}>
                  <AlignRight className="h-4 w-4" />
                </Tool>
                <Tool label="Align top" onClick={() => onAlign('top')}>
                  <AlignStartHorizontal className="h-4 w-4" />
                </Tool>
                <Tool label="Align middle" onClick={() => onAlign('middle')}>
                  <MousePointerSquareDashed className="h-4 w-4" />
                </Tool>
                <Tool label="Align bottom" onClick={() => onAlign('bottom')}>
                  <AlignEndHorizontal className="h-4 w-4" />
                </Tool>
              </div>

              {selected.length >= 3 ? (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <MiniButton
                    onClick={() => onDistribute('horizontal')}
                    icon={<AlignHorizontalSpaceAround className="h-3.5 w-3.5" />}
                  >
                    Spread across
                  </MiniButton>
                  <MiniButton
                    onClick={() => onDistribute('vertical')}
                    icon={<AlignVerticalSpaceAround className="h-3.5 w-3.5" />}
                  >
                    Spread down
                  </MiniButton>
                </div>
              ) : null}

              {single ? (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <MiniButton
                    onClick={() => onMoveLayer(single.id, 'up')}
                    icon={<ArrowUp className="h-3.5 w-3.5" />}
                  >
                    Bring forward
                  </MiniButton>
                  <MiniButton
                    onClick={() => onMoveLayer(single.id, 'down')}
                    icon={<ArrowDown className="h-3.5 w-3.5" />}
                  >
                    Send back
                  </MiniButton>
                </div>
              ) : null}
            </Group>

            {/* ── Position & size ────────────────────────────────── */}
            {single ? (
              <Group label="Position & size">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="X"
                    value={Math.round(single.x)}
                    max={pageWidth}
                    onChange={(v) => onUpdate(single.id, { x: v }, { historyGroup: 'nudge' })}
                  />
                  <NumberField
                    label="Y"
                    value={Math.round(single.y)}
                    max={pageHeight}
                    onChange={(v) => onUpdate(single.id, { y: v }, { historyGroup: 'nudge' })}
                  />
                  <NumberField
                    label="W"
                    value={Math.round(single.width)}
                    min={5}
                    max={pageWidth * 2}
                    onChange={(v) => onUpdate(single.id, { width: v }, { historyGroup: 'resize' })}
                  />
                  <NumberField
                    label="H"
                    value={Math.round(single.height)}
                    min={5}
                    max={pageHeight * 2}
                    onChange={(v) => onUpdate(single.id, { height: v }, { historyGroup: 'resize' })}
                  />
                </div>
                <Slider
                  label="Rotation"
                  suffix="°"
                  min={-180}
                  max={180}
                  value={Math.round(single.rotation || 0)}
                  onChange={(v) => onUpdate(single.id, { rotation: v }, { historyGroup: 'rotate' })}
                />
              </Group>
            ) : null}

            {/* ── Photo ──────────────────────────────────────────── */}
            {image ? (
              <Group label="Photo">
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniButton onClick={onReplacePhoto} icon={<ImageIcon className="h-3.5 w-3.5" />}>
                    Replace
                  </MiniButton>
                  <MiniButton
                    onClick={() => onReframe(image.id)}
                    icon={<Crop className="h-3.5 w-3.5" />}
                    disabled={!image.src}
                  >
                    Reframe
                  </MiniButton>
                  <MiniButton
                    onClick={() =>
                      onUpdate(
                        image.id,
                        { fitMode: image.fitMode === 'fill' ? 'fit' : 'fill' },
                        { historyGroup: 'image-style' }
                      )
                    }
                    active={image.fitMode === 'fill'}
                  >
                    {image.fitMode === 'fill' ? 'Fills frame' : 'Fits frame'}
                  </MiniButton>
                  <MiniButton
                    onClick={() => {
                      setRemovingBg(true)
                      void Promise.resolve(onRemoveBackground()).finally(() => setRemovingBg(false))
                    }}
                    disabled={removingBg || !image.src}
                    icon={<Scissors className="h-3.5 w-3.5" />}
                  >
                    {removingBg ? 'Working…' : 'Cut out'}
                  </MiniButton>
                  <MiniButton
                    onClick={() => onUpdate(image.id, { flipX: !image.flipX }, { historyGroup: 'image-style' })}
                    active={Boolean(image.flipX)}
                    icon={<FlipHorizontal2 className="h-3.5 w-3.5" />}
                  >
                    Flip H
                  </MiniButton>
                  <MiniButton
                    onClick={() => onUpdate(image.id, { flipY: !image.flipY }, { historyGroup: 'image-style' })}
                    active={Boolean(image.flipY)}
                    icon={<FlipVertical2 className="h-3.5 w-3.5" />}
                  >
                    Flip V
                  </MiniButton>
                </div>

                <Slider
                  label="Opacity"
                  suffix="%"
                  min={10}
                  max={100}
                  value={Math.round((image.opacity ?? 1) * 100)}
                  onChange={(v) => onUpdate(image.id, { opacity: v / 100 }, { historyGroup: 'image-style' })}
                />
                <Slider
                  label="Corner"
                  min={0}
                  max={120}
                  value={image.cornerRadius ?? 0}
                  onChange={(v) => onUpdate(image.id, { cornerRadius: v }, { historyGroup: 'image-style' })}
                />
                <Slider
                  label="Shadow"
                  min={0}
                  max={80}
                  value={image.shadowBlur ?? 0}
                  onChange={(v) =>
                    onUpdate(
                      image.id,
                      {
                        shadowBlur: v,
                        // A blur with no opacity paints nothing, so the one
                        // slider has to set both or it reads as broken.
                        shadowOpacity: v > 0 ? Math.max(0.25, image.shadowOpacity ?? 0.35) : 0,
                      },
                      { historyGroup: 'image-style' }
                    )
                  }
                />
              </Group>
            ) : null}

            {/* ── Text ───────────────────────────────────────────── */}
            {text ? (
              <Group label="Text">
                <textarea
                  value={text.text}
                  onChange={(e) => onUpdate(text.id, { text: e.target.value }, { historyGroup: 'text' })}
                  rows={3}
                  aria-label="Text content"
                  className="w-full resize-y rounded-[2px] border border-border bg-background px-2 py-1.5 text-[13px] leading-snug text-foreground outline-none focus:border-primary"
                />

                <div className="mt-2 flex gap-1.5">
                  <select
                    value={text.fontFamily || 'serif'}
                    onChange={(e) => onUpdate(text.id, { fontFamily: e.target.value }, { historyGroup: 'text-style' })}
                    aria-label="Font"
                    className="min-h-[34px] flex-1 rounded-[2px] border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-primary"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <Tool
                    label="Bold"
                    active={text.fontWeight === 'bold'}
                    onClick={() =>
                      onUpdate(
                        text.id,
                        { fontWeight: text.fontWeight === 'bold' ? 'normal' : 'bold' },
                        { historyGroup: 'text-style' }
                      )
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </Tool>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(
                    [
                      ['left', AlignLeft],
                      ['center', AlignCenter],
                      ['right', AlignRight],
                    ] as const
                  ).map(([mode, Icon]) => (
                    <Tool
                      key={mode}
                      label={`Align ${mode}`}
                      active={text.textAlign === mode}
                      onClick={() => onUpdate(text.id, { textAlign: mode }, { historyGroup: 'text-style' })}
                    >
                      <Icon className="h-4 w-4" />
                    </Tool>
                  ))}
                </div>

                <Slider
                  label="Size"
                  suffix="pt"
                  min={8}
                  max={180}
                  value={text.fontSize}
                  onChange={(v) => onUpdate(text.id, { fontSize: v }, { historyGroup: 'text-style' })}
                />
                <Slider
                  label="Line height"
                  min={80}
                  max={220}
                  value={Math.round((text.lineHeight ?? 1.2) * 100)}
                  format={(v) => (v / 100).toFixed(2)}
                  onChange={(v) => onUpdate(text.id, { lineHeight: v / 100 }, { historyGroup: 'text-style' })}
                />
                <Slider
                  label="Tracking"
                  min={-10}
                  max={40}
                  value={Math.round(text.letterSpacing ?? 0)}
                  onChange={(v) => onUpdate(text.id, { letterSpacing: v }, { historyGroup: 'text-style' })}
                />

                <Swatches
                  label="Ink"
                  value={text.fill}
                  onPick={(c) => onUpdate(text.id, { fill: c }, { historyGroup: 'text-style' })}
                />
              </Group>
            ) : null}

            {/* ── Shape ──────────────────────────────────────────── */}
            {shape ? (
              <Group label="Shape">
                <Swatches
                  label="Fill"
                  value={shape.fill}
                  onPick={(c) => onUpdate(shape.id, { fill: c }, { historyGroup: 'shape-style' })}
                />
              </Group>
            ) : null}

            {/* ── The layer ──────────────────────────────────────── */}
            {single ? (
              <Group label="Layer">
                <input
                  value={single.name ?? ''}
                  onChange={(e) => onUpdate(single.id, { name: e.target.value }, { historyGroup: 'rename-layer' })}
                  placeholder="Layer name"
                  aria-label="Layer name"
                  className="mb-2 w-full rounded-[2px] border border-border bg-background px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniButton
                    onClick={() => onToggleLock(single.id)}
                    active={Boolean(single.locked)}
                    icon={single.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  >
                    {single.locked ? 'Locked' : 'Lock'}
                  </MiniButton>
                  <MiniButton
                    onClick={() => onToggleHidden(single.id)}
                    active={Boolean(single.hidden)}
                    icon={single.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  >
                    {single.hidden ? 'Hidden' : 'Visible'}
                  </MiniButton>
                </div>
              </Group>
            ) : null}

            <Group label={null}>
              <div className="grid grid-cols-2 gap-1.5">
                <MiniButton onClick={onDuplicate}>Duplicate</MiniButton>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-[2px] border border-border px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-primary transition-colors hover:border-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </Group>
          </div>
        )}
      </div>
    </aside>
  )
}

function EmptyInspector() {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto mb-5 flex h-16 w-12 items-center justify-center border border-dashed border-border">
        <TypeIcon className="h-4 w-4 text-ink-soft/40" />
      </div>
      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
        Tap something on the page and its controls appear here.
      </p>
      <ul className="mt-5 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.06em] leading-relaxed text-ink-soft">
        <li>Drag to move · corners to resize</li>
        <li>Double-tap type to edit it</li>
        <li>Drag a photo onto a slot to swap it</li>
        <li>⌘Z undo · Delete removes</li>
      </ul>
    </div>
  )
}

function Group({ label, children }: { label: string | null; children: React.ReactNode }) {
  return (
    <section className="px-4 py-3.5">
      {label ? (
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          {label}
        </div>
      ) : null}
      {children}
    </section>
  )
}

function Tool({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 items-center justify-center rounded-[2px] border transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function MiniButton({
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
      className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors disabled:opacity-35 ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-foreground hover:border-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-[2px] border border-border bg-background px-2">
      <span className="font-mono text-[10px] uppercase text-ink-soft">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="min-h-[34px] w-full bg-transparent text-right font-mono text-[12px] tabular-nums text-foreground outline-none"
      />
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="mt-3 block">
      <span className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
        <span className="tabular-nums text-foreground">
          {format ? format(value) : value}
          {suffix ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-7 w-full accent-[var(--primary)]"
      />
    </label>
  )
}

function Swatches({
  label,
  value,
  onPick,
}: {
  label: string
  value?: string
  onPick: (colour: string) => void
}) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
        <label className="cursor-pointer text-primary hover:underline">
          Custom
          <input
            type="color"
            value={value || '#1C1814'}
            onChange={(e) => onPick(e.target.value)}
            className="sr-only"
            aria-label={`${label} colour`}
          />
        </label>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {INK_COLOURS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            title={c}
            aria-label={`${label} ${c}`}
            className={`aspect-square rounded-[2px] ring-1 ring-inset transition-all ${
              value?.toUpperCase() === c.toUpperCase()
                ? 'ring-2 ring-primary'
                : 'ring-border hover:ring-foreground'
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  )
}
