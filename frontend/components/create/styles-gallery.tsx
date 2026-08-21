'use client'

import { useMemo, useState } from 'react'
import {
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  SectionRule,
  StampButton,
} from '@/components/folio/primitives'
import { StyleCard, type StyleSummary } from './style-card'
import { pickFeatures } from './style-idiom'

/**
 * Screen 03 — Styles Gallery. The Create tab's home.
 *
 * Three things happen here, in order of how a person actually decides:
 * first *how* the piece gets made (yourself, an artist, or instant prints),
 * then *what* it looks like. The feature grid is deliberately asymmetric —
 * a catalogue spread, not a uniform card wall — and every style below it
 * carries its own print idiom.
 *
 * This replaces templates-showcase.tsx (42KB), which wrapped every template in
 * one shell decorated with invented star ratings and review counts.
 */
export function StylesGallery({
  templates,
  eventId,
}: {
  templates: StyleSummary[]
  eventId?: string
}) {
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    for (const t of templates) {
      const c = t.category || 'Artist'
      seen.set(c, (seen.get(c) ?? 0) + 1)
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1])
  }, [templates])

  const features = useMemo(() => pickFeatures(templates), [templates])
  const featureIds = useMemo(() => new Set(features.map((f) => f.template.id)), [features])

  const catalogue = useMemo(() => {
    const rest = templates.filter((t) => !featureIds.has(t.id))
    if (category === 'all') return rest
    return rest.filter((t) => (t.category || 'Artist') === category)
  }, [templates, featureIds, category])

  const cover = features.find((f) => f.slot === 'cover')
  const singleA = features.find((f) => f.slot === 'single-a')
  const singleB = features.find((f) => f.slot === 'single-b')
  const wide = features.find((f) => f.slot === 'wide')

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Create"
        title="Pick a style"
        meta={`${templates.length} styles · album, print, or card`}
        actions={
          <StampButton href="/create/orders" tone="ghost" size="sm">
            Orders
          </StampButton>
        }
      />

      {/* ── How it gets made ─────────────────────────────────────────────── */}
      <LabelledBlock label="Ways in" className="mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <WayIn
            href={eventId ? `/create?eventId=${eventId}` : '/create'}
            title="Build it yourself"
            note="Pick a style, drop your photos in, arrange the spreads."
            active
          />
          <WayIn
            href={eventId ? `/create/artist?eventId=${eventId}` : '/create/artist'}
            title="Ask an Artist"
            note="A photographer designs it for you. 12–15 days."
          />
          <WayIn
            href="/create/polaroid"
            title="Polaroid prints"
            note="Instant frames, no album. Straight to print."
          />
        </div>
      </LabelledBlock>

      {/* ── The catalogue spread ─────────────────────────────────────────── */}
      <div className="mt-10 sm:mt-12">
        <SectionRule index="01" title="Featured" aside="Ref — album catalogs, letterpress stationery" />

        {/* Asymmetric on desktop (2fr 1fr 1fr over two rows); a single column
            on phones, where the cover feature still leads. */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr_1fr] lg:grid-rows-[auto_auto]">
          {cover ? (
            <div className="lg:row-span-2">
              <StyleCard template={cover.template} eventId={eventId} size="cover" />
            </div>
          ) : null}
          {singleA ? <StyleCard template={singleA.template} eventId={eventId} /> : null}
          {singleB ? <StyleCard template={singleB.template} eventId={eventId} /> : null}
          {wide ? (
            <div className="lg:col-span-2">
              <StyleCard template={wide.template} eventId={eventId} size="wide" />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Everything else ──────────────────────────────────────────────── */}
      {catalogue.length > 0 || category !== 'all' ? (
        <div className="mt-12">
          <SectionRule index="02" title="All styles" aside={`${catalogue.length} shown`} />

          <div className="-mx-4 mb-6 overflow-x-auto px-4 snap-rail sm:mx-0 sm:px-0">
            <div
              className="flex w-max gap-2"
              role="tablist"
              aria-label="Filter styles by category"
            >
              <CategoryTab
                label="All"
                count={templates.length}
                active={category === 'all'}
                onClick={() => setCategory('all')}
              />
              {categories.map(([name, count]) => (
                <CategoryTab
                  key={name}
                  label={name}
                  count={count}
                  active={category === name}
                  onClick={() => setCategory(name)}
                />
              ))}
            </div>
          </div>

          {catalogue.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-border px-6 py-12 text-center">
              <MonoLabel>No styles in {category}</MonoLabel>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {catalogue.map((template) => (
                <StyleCard key={template.id} template={template} eventId={eventId} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function WayIn({
  href,
  title,
  note,
  active,
}: {
  href: string
  title: string
  note: string
  active?: boolean
}) {
  return (
    <a
      href={href}
      className={`flex min-h-[88px] flex-col justify-center rounded-[4px] border p-4 transition-colors ${
        active
          ? 'border-primary bg-primary/[0.06]'
          : 'border-border bg-card hover:border-foreground'
      }`}
    >
      <span className="font-serif text-lg text-foreground">{title}</span>
      <span className="mt-1 text-[13px] leading-snug text-muted-foreground">{note}</span>
    </a>
  )
}

function CategoryTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[2px] border px-4 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-ink-soft hover:border-foreground hover:text-foreground'
      }`}
    >
      {label}
      <span className={active ? 'opacity-60' : 'opacity-50'}>{count}</span>
    </button>
  )
}
