'use client'

import { useMemo } from 'react'
import { MonoLabel } from '@/components/folio/primitives'
import {
  Choice,
  ColorField,
  PanelSection,
  ToggleRow,
} from '@/components/cards/controls'
import { collectEditableFields } from '@/lib/cards/layout'
import { createResolver } from '@/lib/cards/resolver'
import type {
  CardCustomization,
  CardProfileData,
  CardStyle,
  FontKey,
  ImageTreatment,
  TemplateDefinition,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The Style panel.
 *
 * Every control here is gated by the template's own capability declaration, so
 * a template that must keep its palette simply does not offer a colour picker.
 * That is the designer's call, made once in the template, rather than a rule
 * the editor has to remember.
 */

const FONT_OPTIONS: { value: FontKey; label: string; note: string }[] = [
  { value: 'serif', label: 'Serif', note: 'Warm, editorial' },
  { value: 'sans', label: 'Sans', note: 'Plain, modern' },
  { value: 'display', label: 'Display', note: 'High contrast' },
  { value: 'mono', label: 'Mono', note: 'Technical' },
]

const TREATMENTS: { value: ImageTreatment; label: string }[] = [
  { value: 'none', label: 'As shot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'grayscale', label: 'Black & white' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'fade', label: 'Faded' },
]

export function StylePanel({
  definition,
  styles,
  styleId,
  onStyleChange,
  customization,
  onCustomizationChange,
  profile,
}: {
  definition: TemplateDefinition
  styles: CardStyle[]
  styleId: string | null
  onStyleChange(styleId: string): void
  customization: CardCustomization
  onCustomizationChange(patch: Partial<CardCustomization>): void
  profile: CardProfileData
}) {
  const caps = definition.capabilities
  const active = styles.find((style) => style.id === styleId) ?? styles[0] ?? null

  const hideable = useMemo(
    () => collectEditableFields(definition, createResolver(profile)).filter((field) => field.canHide),
    [definition, profile]
  )

  const accentSwatches = useMemo(
    () => [...new Set(styles.map((style) => style.tokens?.colors?.accent).filter(Boolean))] as string[],
    [styles]
  )

  const backgroundSwatches = useMemo(
    () =>
      [...new Set(styles.map((style) => style.tokens?.colors?.background).filter(Boolean))] as string[],
    [styles]
  )

  const setColor = (key: string, value: string) =>
    onCustomizationChange({ colors: { ...customization.colors, [key]: value } })

  const resetColors = () => onCustomizationChange({ colors: {} })

  return (
    <div className="space-y-7">
      {caps.styleSwap && styles.length > 1 ? (
        <PanelSection
          title="Base style"
          note="The palette, the type and the film treatment. The layout stays exactly where it is."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {styles.map((style) => {
              const selected = style.id === active?.id
              const colors = style.tokens?.colors
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onStyleChange(style.id)}
                  aria-pressed={selected}
                  className={cn(
                    'overflow-hidden rounded-[2px] border text-left transition-colors',
                    selected ? 'border-primary' : 'border-border hover:border-foreground'
                  )}
                >
                  <div className="flex h-14" aria-hidden="true">
                    <span className="flex-[3]" style={{ background: colors?.background }} />
                    <span className="flex-1" style={{ background: colors?.ink }} />
                    <span className="flex-1" style={{ background: colors?.accent }} />
                    <span className="flex-1" style={{ background: colors?.highlight }} />
                  </div>
                  <div className="px-2.5 py-2">
                    <span className="block truncate font-serif text-sm text-foreground">
                      {style.name}
                    </span>
                    {selected ? (
                      <MonoLabel size="xs" tone="primary">
                        In use
                      </MonoLabel>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </PanelSection>
      ) : null}

      {caps.accentColor || caps.backgroundColor || caps.inkColor ? (
        <PanelSection
          title="Colour"
          action={
            Object.keys(customization.colors).length > 0 ? (
              <button
                type="button"
                onClick={resetColors}
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
              >
                Reset
              </button>
            ) : null
          }
        >
          <div className="space-y-5">
            {caps.accentColor ? (
              <ColorField
                label="Accent"
                value={customization.colors.accent ?? active?.tokens?.colors?.accent ?? '#B85C38'}
                onChange={(value) => setColor('accent', value)}
                swatches={accentSwatches}
              />
            ) : null}
            {caps.backgroundColor ? (
              <ColorField
                label="Background"
                value={
                  customization.colors.background ?? active?.tokens?.colors?.background ?? '#F5F0E8'
                }
                onChange={(value) => setColor('background', value)}
                swatches={backgroundSwatches}
              />
            ) : null}
            {caps.inkColor ? (
              <ColorField
                label="Type"
                value={customization.colors.ink ?? active?.tokens?.colors?.ink ?? '#1C1814'}
                onChange={(value) => setColor('ink', value)}
              />
            ) : null}
          </div>
        </PanelSection>
      ) : null}

      {caps.fontChange ? (
        <PanelSection title="Type" note="Headings and body, swapped by role.">
          <div className="space-y-4">
            <div>
              <MonoLabel size="xs" className="mb-1.5">
                Headings
              </MonoLabel>
              <Choice
                columns={2}
                value={customization.fonts.heading ?? active?.tokens?.fonts?.heading ?? 'serif'}
                onChange={(value) =>
                  onCustomizationChange({
                    fonts: { ...customization.fonts, heading: value as FontKey },
                  })
                }
                options={FONT_OPTIONS}
              />
            </div>
            <div>
              <MonoLabel size="xs" className="mb-1.5">
                Body
              </MonoLabel>
              <Choice
                columns={2}
                value={customization.fonts.body ?? active?.tokens?.fonts?.body ?? 'sans'}
                onChange={(value) =>
                  onCustomizationChange({
                    fonts: { ...customization.fonts, body: value as FontKey },
                  })
                }
                options={FONT_OPTIONS}
              />
            </div>
          </div>
        </PanelSection>
      ) : null}

      {caps.imageTreatment ? (
        <PanelSection title="Photographs" note="Applied when the card is rendered. Your originals are untouched.">
          <Choice
            columns={2}
            value={customization.effects.imageTreatment ?? active?.tokens?.effects?.imageTreatment ?? 'none'}
            onChange={(value) =>
              onCustomizationChange({
                effects: { ...customization.effects, imageTreatment: value as ImageTreatment },
              })
            }
            options={TREATMENTS.map((treatment) => ({
              value: treatment.value,
              label: treatment.label,
            }))}
          />
        </PanelSection>
      ) : null}

      {caps.decorations ? (
        <PanelSection title="Finish">
          <ToggleRow
            label="Film grain"
            note="A little texture over the whole card."
            checked={customization.effects.grain !== false}
            onChange={(checked) =>
              onCustomizationChange({ effects: { ...customization.effects, grain: checked } })
            }
          />
          <ToggleRow
            label="Vignette"
            note="Darkens the corners, the way a lens does."
            checked={customization.effects.vignette !== false}
            onChange={(checked) =>
              onCustomizationChange({ effects: { ...customization.effects, vignette: checked } })
            }
          />
        </PanelSection>
      ) : null}

      {caps.sectionVisibility && hideable.length > 0 ? (
        <PanelSection title="What shows" note="Turn off anything this card does not need.">
          <div>
            {hideable.map((field) => (
              <ToggleRow
                key={field.id}
                label={field.label}
                checked={customization.visibility[field.id] !== false}
                onChange={(checked) => {
                  const visibility = { ...customization.visibility }
                  if (checked) delete visibility[field.id]
                  else visibility[field.id] = false
                  onCustomizationChange({ visibility })
                }}
              />
            ))}
          </div>
        </PanelSection>
      ) : null}
    </div>
  )
}
