'use client'

import Link from 'next/link'
import { CardRenderer } from '@/components/cards/card-renderer'
import { MonoLabel } from '@/components/folio/primitives'
import type { Card, CardBundle } from '@/lib/cards/types'

/**
 * A row of cards, scrolled sideways on a phone.
 *
 * Used by both the owner's profile page and the public one, so the two never
 * drift apart in how a card is shown. Each tile is the live renderer at the
 * card's own aspect ratio, which is why a 9:16 story card sits taller in the
 * row than a 4:5 post — the shape is information.
 */
export function CardRail({
  cards,
  templates,
  styles,
  width = 216,
  hrefFor,
}: {
  cards: Card[]
  templates: CardBundle['templates']
  styles: CardBundle['styles']
  width?: number
  hrefFor?(card: Card): string | null
}) {
  if (cards.length === 0) return null

  return (
    <div className="snap-rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {cards.map((card) => {
        const pinned = templates[`${card.templateId}@${card.templateVersion}`]
        if (!pinned) return null
        const style = card.styleId ? styles[card.styleId] : null
        const href = hrefFor?.(card) ?? null

        const tile = (
          <div style={{ width, lineHeight: 0, boxShadow: '0 1px 4px var(--shadow-color)' }}>
            <CardRenderer
              definition={pinned.definition}
              style={style}
              profile={card.profileSnapshot}
              customization={card.customization}
              width={width}
              title={card.title}
            />
          </div>
        )

        return (
          <figure key={card.id} className="shrink-0">
            {href ? (
              <Link href={href} className="block transition-opacity hover:opacity-90">
                {tile}
              </Link>
            ) : (
              tile
            )}
            <figcaption className="mt-2" style={{ width }}>
              <div className="truncate font-serif text-sm text-foreground">{card.title}</div>
              <MonoLabel size="xs" className="truncate">
                {pinned.name}
                {style ? ` · ${style.name}` : ''}
              </MonoLabel>
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
