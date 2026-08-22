'use client'

import { useMemo, useState } from 'react'
import { MonoLabel, SpecPill, StampButton } from '@/components/folio/primitives'
import { Choice, PanelSection, ToggleRow } from '@/components/cards/controls'
import { cardsApi } from '@/lib/cards/api'
import { canShareFiles, downloadCard, shareCard } from '@/lib/cards/export'
import type { Card, TemplateDefinition } from '@/lib/cards/types'

/**
 * The Share panel — where a card becomes a file.
 *
 * Export sizes are multiples of the template's own canvas rather than a list of
 * arbitrary social presets. Offering "Instagram Story" for a 4:5 card would
 * mean cropping or letterboxing something the user composed, and neither is a
 * choice worth hiding behind a dropdown: the way to get a 9:16 card is to build
 * one on a 9:16 template.
 */

const SCALES = [
  { value: '1', label: 'Standard', note: '1×' },
  { value: '2', label: 'High', note: '2×' },
  { value: '3', label: 'Print', note: '3×' },
]

/** What a given aspect ratio is actually good for, said plainly. */
function suitsFor(width: number, height: number): string {
  const ratio = width / height
  if (Math.abs(ratio - 0.8) < 0.03) return 'Instagram posts, WhatsApp, Facebook'
  if (Math.abs(ratio - 1) < 0.03) return 'LinkedIn, Instagram squares, avatars'
  if (Math.abs(ratio - 0.5625) < 0.03) return 'Instagram stories, WhatsApp status, Reels covers'
  if (ratio > 1) return 'Banners and headers'
  return 'Posts and stories'
}

export function SharePanel({
  card,
  definition,
  svgRef,
  isPublic,
  onPublicChange,
  onDeleted,
}: {
  card: Pick<Card, 'id' | 'title' | 'shareSlug'>
  definition: TemplateDefinition
  svgRef: React.RefObject<SVGSVGElement | null>
  isPublic: boolean
  onPublicChange(next: boolean): void
  onDeleted(): void
}) {
  const [scale, setScale] = useState('2')
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const size = useMemo(
    () => ({
      width: Math.round(definition.canvas.width * Number(scale)),
      height: Math.round(definition.canvas.height * Number(scale)),
    }),
    [definition.canvas, scale]
  )

  const shareUrl =
    card.shareSlug && typeof window !== 'undefined'
      ? `${window.location.origin}/card/${card.shareSlug}`
      : null

  async function run(action: 'download' | 'share') {
    const svg = svgRef.current
    if (!svg) return
    setBusy(action)
    setError(null)
    try {
      const options = { ...size, format }
      if (action === 'share') {
        const shared = await shareCard(svg, card.title, options)
        if (!shared) await downloadCard(svg, card.title, options)
      } else {
        await downloadCard(svg, card.title, options)
      }
    } catch (exportError) {
      setError((exportError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this card? This cannot be undone.')) return
    setBusy('delete')
    setError(null)
    try {
      await cardsApi.remove(card.id)
      onDeleted()
    } catch (deleteError) {
      setError((deleteError as Error).message)
      setBusy(null)
    }
  }

  return (
    <div className="space-y-7">
      <PanelSection
        title="Save the image"
        note={`${definition.canvas.width}×${definition.canvas.height} — ${suitsFor(
          definition.canvas.width,
          definition.canvas.height
        )}.`}
      >
        <div className="space-y-4">
          <div>
            <MonoLabel size="xs" className="mb-1.5">
              Resolution
            </MonoLabel>
            <Choice
              columns={3}
              value={scale}
              onChange={setScale}
              options={SCALES.map((entry) => ({
                value: entry.value,
                label: entry.label,
                note: `${Math.round(definition.canvas.width * Number(entry.value))}×${Math.round(
                  definition.canvas.height * Number(entry.value)
                )}`,
              }))}
            />
          </div>

          <div>
            <MonoLabel size="xs" className="mb-1.5">
              Format
            </MonoLabel>
            <Choice
              columns={2}
              value={format}
              onChange={(value) => setFormat(value as 'png' | 'jpeg')}
              options={[
                { value: 'png', label: 'PNG', note: 'Sharpest type' },
                { value: 'jpeg', label: 'JPEG', note: 'Smaller file' },
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <StampButton tone="primary" onClick={() => void run('download')} disabled={busy !== null}>
              {busy === 'download' ? 'Rendering…' : 'Download'}
            </StampButton>
            {canShareFiles() ? (
              <StampButton tone="ghost" onClick={() => void run('share')} disabled={busy !== null}>
                {busy === 'share' ? 'Preparing…' : 'Share…'}
              </StampButton>
            ) : null}
          </div>

          {error ? (
            <p className="border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
              {error}
            </p>
          ) : null}
        </div>
      </PanelSection>

      <PanelSection
        title="A link to this card"
        note="Turning it on puts the card on your public page too. Your page has to be public for the link to open."
      >
        <ToggleRow
          label="Anyone with the link can see it"
          checked={isPublic}
          onChange={onPublicChange}
        />

        {isPublic && shareUrl ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[2px] border border-border bg-card px-3 py-2.5 font-mono text-[12px] text-foreground">
              {shareUrl}
            </code>
            <StampButton
              tone="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </StampButton>
          </div>
        ) : null}

        {isPublic && !shareUrl ? (
          <MonoLabel size="xs" className="mt-3">
            The link appears once this saves
          </MonoLabel>
        ) : null}
      </PanelSection>

      <PanelSection title="Danger">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SpecPill tone="muted">Deleting is permanent</SpecPill>
          <StampButton tone="outline" size="sm" onClick={() => void remove()} disabled={busy !== null}>
            {busy === 'delete' ? 'Deleting…' : 'Delete this card'}
          </StampButton>
        </div>
      </PanelSection>
    </div>
  )
}
