'use client'

import { useMemo, useRef, useState } from 'react'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { ProfileShowcase } from '@/components/profile/showcase'
import { canShareFiles, downloadCard, shareCard } from '@/lib/cards/export'
import type { ProfileAlbum, ProfilePhoto } from '@/lib/profile/api'
import type { Card, CardBundle } from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * Someone else's page.
 *
 * Same three movements as the owner's view — masthead, card, showcase — because
 * a profile that rearranges itself for visitors is a profile its owner cannot
 * predict. The differences are only subtractive: no picker, no settings, no
 * remove buttons.
 *
 * A visitor can still save the card as an image. That is deliberate: the card
 * is the shareable object, and someone who followed a link to it wanting to
 * keep it should not have to screenshot.
 */
export function PublicProfileView({
  cards,
  templates,
  styles,
  photos,
  albums,
}: {
  cards: Card[]
  templates: CardBundle['templates']
  styles: CardBundle['styles']
  photos: ProfilePhoto[]
  albums: ProfileAlbum[]
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeId, setActiveId] = useState<string | null>(cards[0]?.id ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(
    () => cards.find((card) => card.id === activeId) ?? cards[0] ?? null,
    [cards, activeId]
  )
  const pinned = active ? templates[`${active.templateId}@${active.templateVersion}`] : null

  async function save() {
    const svg = svgRef.current
    if (!svg || !active || !pinned) return
    setBusy(true)
    setError(null)
    try {
      const options = {
        width: pinned.definition.canvas.width * 2,
        height: pinned.definition.canvas.height * 2,
        format: 'png' as const,
      }
      const shared = canShareFiles() ? await shareCard(svg, active.title, options) : false
      if (!shared) await downloadCard(svg, active.title, options)
    } catch (saveError) {
      setError((saveError as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const hasShowcase = photos.length > 0 || albums.length > 0

  return (
    <>
      {active && pinned ? (
        <section className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-12">
            <div className="mx-auto w-full max-w-[380px] lg:mx-0">
              <div style={{ boxShadow: '0 2px 16px var(--shadow-color)' }}>
                <CardRenderer
                  definition={pinned.definition}
                  style={active.styleId ? styles[active.styleId] : null}
                  profile={active.profileSnapshot}
                  customization={active.customization}
                  svgRef={svgRef}
                  title={active.title}
                />
              </div>

              {cards.length > 1 ? (
                <div className="snap-rail mt-3 flex gap-2 overflow-x-auto pb-2">
                  {cards.map((card) => {
                    const cardTemplate = templates[`${card.templateId}@${card.templateVersion}`]
                    if (!cardTemplate) return null
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setActiveId(card.id)}
                        className={cn(
                          'shrink-0 overflow-hidden outline outline-1 -outline-offset-1 transition-all',
                          card.id === active.id
                            ? 'outline-2 outline-primary'
                            : 'outline-border hover:outline-foreground'
                        )}
                        style={{ width: 58, lineHeight: 0 }}
                        aria-label={`Show ${card.title}`}
                      >
                        <CardRenderer
                          definition={cardTemplate.definition}
                          style={card.styleId ? styles[card.styleId] : null}
                          profile={card.profileSnapshot}
                          customization={card.customization}
                          width={58}
                          title={card.title}
                        />
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              <h2 className="font-serif text-2xl leading-tight text-foreground">
                {active.title}
              </h2>
              <MonoLabel size="xs" className="mt-1.5">
                {pinned.name} · {pinned.definition.canvas.width}×
                {pinned.definition.canvas.height}
              </MonoLabel>

              <div className="mt-5 flex flex-wrap gap-2">
                <StampButton tone="ink" size="sm" onClick={() => void save()} disabled={busy}>
                  {busy ? 'Rendering…' : 'Save as image'}
                </StampButton>
                {active.shareSlug ? (
                  <StampButton tone="ghost" size="sm" href={`/card/${active.shareSlug}`}>
                    Open the card
                  </StampButton>
                ) : null}
              </div>

              {error ? (
                <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasShowcase ? (
        <ProfileShowcase photos={photos} albums={albums} editable={false} />
      ) : null}

      {!active && !hasShowcase ? (
        <div className="mt-12 rounded-[4px] border border-dashed border-border px-6 py-16 text-center">
          <MonoLabel>Nothing published yet</MonoLabel>
        </div>
      ) : null}
    </>
  )
}
