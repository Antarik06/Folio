'use client'

import { useMemo, useState } from 'react'
import { MonoLabel } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { PanelSection } from '@/components/cards/controls'
import type {
  CardCustomization,
  CardProfileData,
  CardStyle,
  Catalog,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The template picker.
 *
 * Every tile is the real renderer running the real card, with the user's own
 * photograph and their own name in it. There are no thumbnail images to
 * generate, upload or keep in step — which is also why a template added from
 * the admin panel appears here, correctly previewed, with nothing deployed.
 */
export function TemplatePanel({
  catalog,
  templateId,
  onPick,
  profile,
  customization,
  styles,
  currentStyleId,
}: {
  catalog: Catalog
  templateId: string
  onPick(id: string): void
  profile: CardProfileData
  customization: CardCustomization
  styles: CardStyle[]
  currentStyleId: string | null
}) {
  const [category, setCategory] = useState<string>('all')

  const categories = useMemo(
    () => ['all', ...catalog.categories.filter(Boolean).sort()],
    [catalog.categories]
  )

  const shown = useMemo(
    () =>
      category === 'all'
        ? catalog.templates
        : catalog.templates.filter((template) => template.category === category),
    [catalog.templates, category]
  )

  const styleFor = (id: string | null | undefined) =>
    styles.find((style) => style.id === id) ?? null

  if (catalog.templates.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-border px-6 py-12 text-center">
        <MonoLabel>No templates published</MonoLabel>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          The catalogue is empty. An administrator publishes templates from the
          admin panel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.length > 2 ? (
        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              className={cn(
                'shrink-0 rounded-[2px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                entry === category
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
              )}
            >
              {entry}
            </button>
          ))}
        </div>
      ) : null}

      <PanelSection
        title={`${shown.length} template${shown.length === 1 ? '' : 's'}`}
        note="Your words and photographs move across when you switch. Each one keeps whatever it can use."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {shown.map((template) => {
            const active = template.id === templateId
            // A template previews under the style you are already using when it
            // permits it, so switching is a change of layout, not of palette.
            const allowed = template.allowedStyleIds ?? []
            const previewStyleId =
              currentStyleId && (allowed.length === 0 || allowed.includes(currentStyleId))
                ? currentStyleId
                : template.defaultStyleId

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onPick(template.id)}
                aria-pressed={active}
                className="group block text-left"
              >
                <div
                  className={cn(
                    'relative overflow-hidden bg-surface-2 transition-all',
                    active
                      ? 'outline outline-2 -outline-offset-2 outline-primary'
                      : 'outline outline-1 -outline-offset-1 outline-border group-hover:outline-foreground'
                  )}
                  style={{ aspectRatio: `${template.definition.canvas.width} / ${template.definition.canvas.height}` }}
                >
                  <CardRenderer
                    definition={template.definition}
                    style={styleFor(previewStyleId)}
                    profile={profile}
                    customization={customization}
                    title={template.name}
                  />
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="truncate font-serif text-base text-foreground">
                    {template.name}
                  </span>
                  {active ? (
                    <MonoLabel size="xs" tone="primary">
                      In use
                    </MonoLabel>
                  ) : null}
                </div>
                {template.description ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                    {template.description}
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
      </PanelSection>
    </div>
  )
}
