'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { MonoLabel, SpecPill, StampButton } from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { cardsApi } from '@/lib/cards/api'
import { canShareFiles, downloadCard, shareCard } from '@/lib/cards/export'
import type { Card, CardBundle } from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * The centrepiece.
 *
 * The profile used to open with a list of albums and keep the card in a rail at
 * the bottom, which had it exactly backwards: the albums are things you made,
 * the card is *you*. So this sits directly under the masthead at the largest
 * size the column allows, and everything else on the page reads as what is
 * underneath it.
 *
 * The three actions beside it are the three things anyone actually wants from a
 * card — change it, save it, send it — and they are deliberately flat rather
 * than nested in a menu. Export renders from the live SVG on this page, so the
 * file is exactly the card being looked at, at whatever size was asked for.
 */

const SCALES = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3×' },
]

export function ProfileCardStage({
  cards,
  templates,
  styles,
  onCardsChanged,
}: {
  cards: Card[]
  templates: CardBundle['templates']
  styles: CardBundle['styles']
  onCardsChanged(next: Card[]): void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const primary = useMemo(
    () => cards.find((card) => card.isPrimary) ?? cards[0] ?? null,
    [cards]
  )
  const [activeId, setActiveId] = useState<string | null>(primary?.id ?? null)
  const active = useMemo(
    () => cards.find((card) => card.id === activeId) ?? primary,
    [cards, activeId, primary]
  )

  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const pinned = active ? templates[`${active.templateId}@${active.templateVersion}`] : null
  const style = active?.styleId ? styles[active.styleId] : null

  const size = useMemo(() => {
    const canvas = pinned?.definition.canvas
    if (!canvas) return { width: 1080, height: 1350 }
    return {
      width: Math.round(canvas.width * scale),
      height: Math.round(canvas.height * scale),
    }
  }, [pinned, scale])

  const shareUrl =
    active?.shareSlug && typeof window !== 'undefined'
      ? `${window.location.origin}/card/${active.shareSlug}`
      : null

  /* ── Actions ───────────────────────────────────────────────────────────── */

  async function exportImage() {
    const svg = svgRef.current
    if (!svg || !active) return
    setBusy('export')
    setError(null)
    try {
      const options = { ...size, format: 'png' as const }
      // On a phone the share sheet is the useful destination — it hands the
      // file straight to Instagram or WhatsApp. Everywhere else, a download.
      const shared = canShareFiles() ? await shareCard(svg, active.title, options) : false
      if (!shared) await downloadCard(svg, active.title, options)
    } catch (exportError) {
      setError((exportError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function publish() {
    if (!active) return
    setBusy('publish')
    setError(null)
    try {
      const result = await cardsApi.update(active.id, { isPublic: !active.isPublic })
      onCardsChanged(cards.map((card) => (card.id === active.id ? result.card : card)))
    } catch (publishError) {
      setError((publishError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function makePrimary(cardId: string) {
    setBusy('primary')
    setError(null)
    try {
      const result = await cardsApi.update(cardId, { isPrimary: true })
      onCardsChanged(
        cards.map((card) =>
          card.id === cardId ? result.card : { ...card, isPrimary: false }
        )
      )
    } catch (primaryError) {
      setError((primaryError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not reach the clipboard. Copy the link by hand.')
    }
  }

  /* ── Nothing to show ───────────────────────────────────────────────────── */

  if (!active || !pinned) {
    return (
      <div className="rounded-[4px] border border-dashed border-border px-6 py-14 text-center">
        <MonoLabel>No card yet</MonoLabel>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          A card is your page in one image — a photograph, your name, and the few
          things you would actually mention.
        </p>
        <div className="mt-5">
          <StampButton href="/profile/cards" tone="primary" size="sm">
            Make one
          </StampButton>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,400px)_1fr] lg:gap-12">
      {/* ── The card ───────────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[400px] lg:mx-0">
        <div style={{ boxShadow: '0 2px 16px var(--shadow-color)' }}>
          <CardRenderer
            definition={pinned.definition}
            style={style}
            profile={active.profileSnapshot}
            customization={active.customization}
            svgRef={svgRef}
            title={active.title}
          />
        </div>

        {cards.length > 1 ? (
          <div className="mt-4">
            <MonoLabel size="xs" className="mb-2">
              Your other cards
            </MonoLabel>
            <div className="snap-rail flex gap-2 overflow-x-auto pb-2">
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
                    style={{ width: 62, lineHeight: 0 }}
                    aria-label={`Show ${card.title}`}
                    aria-pressed={card.id === active.id}
                  >
                    <CardRenderer
                      definition={cardTemplate.definition}
                      style={card.styleId ? styles[card.styleId] : null}
                      profile={card.profileSnapshot}
                      customization={card.customization}
                      width={62}
                      title={card.title}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── What you can do with it ────────────────────────────────────────── */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl leading-tight text-foreground">{active.title}</h2>
          {active.isPrimary ? (
            <SpecPill tone="primary" className="px-2 py-1">
              Main card
            </SpecPill>
          ) : null}
        </div>
        <MonoLabel size="xs" className="mt-1.5">
          {pinned.name}
          {style ? ` · ${style.name}` : ''} · {pinned.definition.canvas.width}×
          {pinned.definition.canvas.height}
        </MonoLabel>

        <div className="mt-5 flex flex-wrap gap-2">
          <StampButton href={`/profile/cards/${active.id}`} tone="primary" size="sm">
            Customize
          </StampButton>
          <StampButton
            tone="ink"
            size="sm"
            onClick={() => void exportImage()}
            disabled={busy === 'export'}
          >
            {busy === 'export' ? 'Rendering…' : 'Save as image'}
          </StampButton>
          <StampButton
            tone="ghost"
            size="sm"
            onClick={() => void publish()}
            disabled={busy === 'publish'}
          >
            {active.isPublic ? 'Unpublish' : 'Publish card'}
          </StampButton>
        </div>

        {/* ── Export size ─────────────────────────────────────────────────── */}
        <div className="mt-5 border-t border-border pt-4">
          <MonoLabel size="xs" className="mb-2">
            Export size
          </MonoLabel>
          <div className="flex flex-wrap items-center gap-2">
            {SCALES.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => setScale(entry.value)}
                className={cn(
                  'min-h-[36px] rounded-[2px] border px-3 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
                  scale === entry.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
                )}
              >
                {entry.label}
              </button>
            ))}
            <MonoLabel size="xs">
              {size.width}×{size.height} PNG
            </MonoLabel>
          </div>
        </div>

        {/* ── The card's own link ─────────────────────────────────────────── */}
        <div className="mt-5 border-t border-border pt-4">
          <MonoLabel size="xs" className="mb-2">
            Card link
          </MonoLabel>
          {active.isPublic && shareUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[2px] border border-border bg-card px-3 py-2.5 font-mono text-xs text-ink-soft">
                {shareUrl}
              </code>
              <StampButton tone="ghost" size="sm" onClick={() => void copyLink()}>
                {copied ? 'Copied' : 'Copy'}
              </StampButton>
              <Link
                href={`/card/${active.shareSlug}`}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
              >
                Open →
              </Link>
            </div>
          ) : (
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              This card has no link yet. Publish it and anyone you send the
              address to can open it — no account needed.
            </p>
          )}
        </div>

        {!active.isPrimary ? (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => void makePrimary(active.id)}
              disabled={busy === 'primary'}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
            >
              {busy === 'primary' ? 'Setting…' : 'Make this my main card'}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
