'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { canShareFiles, downloadCard, shareCard } from '@/lib/cards/export'
import type { Card, CardBundle } from '@/lib/cards/types'

/**
 * A shared card, opened by someone who may never have signed in.
 *
 * It renders through the same engine and the same pinned template version the
 * owner was editing, so the link keeps showing what they shared even after the
 * template moves on.
 */
export function PublicCardView({
  card,
  templates,
  styles,
  owner,
}: {
  card: Card
  templates: CardBundle['templates']
  styles: CardBundle['styles']
  owner: { name: string | null; handle: string | null }
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const pinned = templates[`${card.templateId}@${card.templateVersion}`]
  const style = card.styleId ? styles[card.styleId] : null

  if (!pinned) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <MonoLabel tone="primary">This card cannot be shown</MonoLabel>
      </div>
    )
  }

  const canvas = pinned.definition.canvas

  async function save(action: 'download' | 'share') {
    const svg = svgRef.current
    if (!svg) return
    setBusy(action)
    try {
      const options = { width: canvas.width, height: canvas.height, format: 'png' as const }
      if (action === 'share') {
        const shared = await shareCard(svg, card.title, options)
        if (!shared) await downloadCard(svg, card.title, options)
      } else {
        await downloadCard(svg, card.title, options)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex max-w-[760px] flex-col items-center px-4 py-10 sm:py-16">
        <div
          className="w-full"
          style={{ maxWidth: `min(100%, calc(78vh * ${canvas.width / canvas.height}))` }}
        >
          <div style={{ boxShadow: '0 2px 14px var(--shadow-color)', lineHeight: 0 }}>
            <CardRenderer
              svgRef={svgRef}
              definition={pinned.definition}
              style={style}
              profile={card.profileSnapshot}
              customization={card.customization}
              title={card.title}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <StampButton tone="primary" size="sm" onClick={() => void save('download')} disabled={busy !== null}>
            {busy === 'download' ? 'Rendering…' : 'Save the image'}
          </StampButton>
          {canShareFiles() ? (
            <StampButton tone="ghost" size="sm" onClick={() => void save('share')} disabled={busy !== null}>
              {busy === 'share' ? 'Preparing…' : 'Share…'}
            </StampButton>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col items-center gap-1.5 border-t border-border pt-6 text-center">
          <MonoLabel size="xs">
            {[owner.name, owner.handle ? `@${owner.handle}` : null].filter(Boolean).join(' · ')}
          </MonoLabel>
          {owner.handle ? (
            <Link
              href={`/p/${owner.handle}`}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
            >
              See their page →
            </Link>
          ) : null}
          <Link
            href="/"
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft hover:text-foreground"
          >
            Made with Folio
          </Link>
        </div>
      </div>
    </div>
  )
}
