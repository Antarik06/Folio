'use client'

import { MonoLabel, StampButton } from '@/components/folio/primitives'
import {
  ColorField,
  Field,
  PanelSection,
  SliderRow,
  TextField,
} from '@/components/cards/controls'
import type {
  CardCustomization,
  CustomElement,
  TemplateDefinition,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The Add panel — a user's own small additions.
 *
 * Bounded on purpose. A template declares how many elements it will tolerate,
 * and once that budget is spent the buttons go quiet. The alternative is a
 * blank canvas with a sticker drawer, which is a different product and a worse
 * one: the templates stop being designs and start being backgrounds.
 */

const KINDS: { type: CustomElement['type']; label: string; value: string; note: string }[] = [
  { type: 'text', label: 'Text', value: 'A few words', note: 'A line of your own' },
  { type: 'sticker', label: 'Sticker', value: '✦', note: 'An emoji or a mark' },
  { type: 'badge', label: 'Badge', value: 'New', note: 'A stamped label' },
  { type: 'divider', label: 'Rule', value: '', note: 'A short line' },
  { type: 'shape', label: 'Shape', value: '', note: 'A circle behind things' },
]

const STICKERS = ['✦', '✽', '★', '❋', '✺', '❍', '☉', '✎', '☕', '🎞', '📷', '🌤', '🫶', '🎧']

export function ElementsPanel({
  definition,
  customization,
  onCustomizationChange,
  selectedId,
  onSelect,
}: {
  definition: TemplateDefinition
  customization: CardCustomization
  onCustomizationChange(patch: Partial<CardCustomization>): void
  selectedId: string | null
  onSelect(id: string | null): void
}) {
  const budget = definition.capabilities.maxCustomElements
  const elements = customization.elements
  const full = elements.length >= budget

  const add = (kind: (typeof KINDS)[number]) => {
    if (full) return
    const element: CustomElement = {
      id: `el_${Date.now().toString(36)}`,
      type: kind.type,
      value: kind.value,
      // Dropped a little below centre, where it is unlikely to land on a face.
      x: 0.5,
      y: 0.62,
      scale: 1,
      rotate: 0,
    }
    onCustomizationChange({ elements: [...elements, element] })
    onSelect(element.id)
  }

  const update = (id: string, patch: Partial<CustomElement>) =>
    onCustomizationChange({
      elements: elements.map((element) => (element.id === id ? { ...element, ...patch } : element)),
    })

  const remove = (id: string) => {
    onCustomizationChange({ elements: elements.filter((element) => element.id !== id) })
    if (selectedId === id) onSelect(null)
  }

  if (budget === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-border px-6 py-12 text-center">
        <MonoLabel>This template is fixed</MonoLabel>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          It does not take extra elements. Another template will — try Scrapbook.
        </p>
      </div>
    )
  }

  const selected = elements.find((element) => element.id === selectedId) ?? null

  return (
    <div className="space-y-7">
      <PanelSection
        title={`Add — ${elements.length} of ${budget} used`}
        note="Drag anything you add straight on the card."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((kind) => (
            <button
              key={kind.type}
              type="button"
              onClick={() => add(kind)}
              disabled={full}
              className={cn(
                'min-h-[64px] rounded-[2px] border px-3 py-2.5 text-left transition-colors',
                full
                  ? 'cursor-not-allowed border-border opacity-40'
                  : 'border-border bg-card hover:border-foreground'
              )}
            >
              <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-foreground">
                + {kind.label}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                {kind.note}
              </span>
            </button>
          ))}
        </div>
      </PanelSection>

      {elements.length > 0 ? (
        <PanelSection title="On this card">
          <ul className="divide-y divide-border rounded-[2px] border border-border bg-card">
            {elements.map((element) => (
              <li key={element.id}>
                <button
                  type="button"
                  onClick={() => onSelect(element.id === selectedId ? null : element.id)}
                  className={cn(
                    'flex min-h-[48px] w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                    element.id === selectedId ? 'bg-primary/[0.06]' : 'hover:bg-surface-2'
                  )}
                >
                  <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                    {element.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {element.value || '—'}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-ink-soft">
                    {element.id === selectedId ? 'Editing' : 'Edit'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}

      {selected ? (
        <PanelSection
          title={`${selected.type} settings`}
          action={
            <button
              type="button"
              onClick={() => remove(selected.id)}
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
            >
              Delete
            </button>
          }
        >
          <div className="space-y-5">
            {selected.type === 'text' || selected.type === 'badge' ? (
              <Field label="Words">
                <TextField
                  value={selected.value}
                  onChange={(value) => update(selected.id, { value })}
                  maxLength={120}
                  placeholder="Say something"
                />
              </Field>
            ) : null}

            {selected.type === 'sticker' ? (
              <div>
                <MonoLabel size="xs" className="mb-1.5">
                  Pick one
                </MonoLabel>
                <div className="flex flex-wrap gap-1.5">
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker}
                      type="button"
                      onClick={() => update(selected.id, { value: sticker })}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-[2px] border text-lg transition-colors',
                        selected.value === sticker
                          ? 'border-primary bg-primary/[0.07]'
                          : 'border-border bg-card hover:border-foreground'
                      )}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <ColorField
              label="Colour"
              value={selected.color ?? '#B85C38'}
              onChange={(color) => update(selected.id, { color })}
            />

            <SliderRow
              label="Size"
              value={selected.scale}
              min={0.4}
              max={2.5}
              step={0.05}
              suffix="×"
              onChange={(scale) => update(selected.id, { scale })}
            />

            <SliderRow
              label="Angle"
              value={selected.rotate}
              min={-45}
              max={45}
              step={1}
              suffix="°"
              onChange={(rotate) => update(selected.id, { rotate })}
            />

            <div>
              <MonoLabel size="xs" className="mb-1.5">
                Nudge
              </MonoLabel>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['←', -0.02, 0],
                    ['→', 0.02, 0],
                    ['↑', 0, -0.02],
                    ['↓', 0, 0.02],
                  ] as const
                ).map(([label, dx, dy]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      update(selected.id, {
                        x: Math.min(1.2, Math.max(-0.2, selected.x + dx)),
                        y: Math.min(1.2, Math.max(-0.2, selected.y + dy)),
                      })
                    }
                    aria-label={`Nudge ${label}`}
                    className="touch-target flex h-11 w-11 items-center justify-center rounded-[2px] border border-border bg-card text-foreground transition-colors hover:border-foreground"
                  >
                    {label}
                  </button>
                ))}
                <StampButton
                  tone="ghost"
                  size="sm"
                  onClick={() => update(selected.id, { x: 0.5, y: 0.62, rotate: 0, scale: 1 })}
                >
                  Centre
                </StampButton>
              </div>
            </div>
          </div>
        </PanelSection>
      ) : null}
    </div>
  )
}
