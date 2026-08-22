'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  EmptyPlate,
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  SpecPill,
  StampButton,
} from '@/components/folio/primitives'
import { CardRenderer } from '@/components/cards/card-renderer'
import { cardsApi } from '@/lib/cards/api'
import {
  normalizeProfile,
  type Card,
  type CardBundle,
  type CardProfileData,
  type Catalog,
} from '@/lib/cards/types'
import { cn } from '@/lib/utils'

/**
 * Cards — the gallery.
 *
 * Every tile is the live renderer, not a stored thumbnail, so a card is always
 * shown as it is now: restyle a template from the admin panel and this screen
 * tells the truth the next time it loads, without a regeneration job anywhere.
 */
export function CardsClient({
  initial,
  catalog,
  profile,
}: {
  initial: CardBundle
  catalog: Catalog
  profile: CardProfileData
}) {
  const router = useRouter()
  const [bundle, setBundle] = useState(initial)
  const [picking, setPicking] = useState(initial.cards.length === 0)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const data = useMemo(() => normalizeProfile(profile), [profile])

  async function create(templateId: string) {
    setBusy(templateId)
    setError(null)
    try {
      const created = await cardsApi.create({ templateId })
      router.push(`/profile/cards/${created.card.id}`)
    } catch (createError) {
      setError((createError as Error).message)
      setBusy(null)
    }
  }

  async function act(cardId: string, action: 'publish' | 'primary' | 'refresh' | 'upgrade') {
    setBusy(cardId + action)
    setError(null)
    try {
      const card = bundle.cards.find((entry) => entry.id === cardId)
      if (!card) return

      const result =
        action === 'publish'
          ? await cardsApi.update(cardId, { isPublic: !card.isPublic })
          : action === 'primary'
            ? await cardsApi.update(cardId, { isPrimary: true })
            : action === 'refresh'
              ? await cardsApi.regenerate(cardId)
              : await cardsApi.upgrade(cardId)

      setBundle((current) => ({
        cards: current.cards.map((entry) =>
          entry.id === cardId
            ? result.card
            : action === 'primary'
              ? { ...entry, isPrimary: false }
              : entry
        ),
        templates: { ...current.templates, ...result.templates },
        styles: { ...current.styles, ...result.styles },
      }))
      router.refresh()
    } catch (actionError) {
      setError((actionError as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Profile — Cards"
        title="Cards"
        meta={`${bundle.cards.length} card${bundle.cards.length === 1 ? '' : 's'} · ${
          catalog.templates.length
        } templates · ${catalog.styles.length} styles`}
        actions={
          <>
            <StampButton href="/profile" tone="ghost" size="sm">
              ← Profile
            </StampButton>
            <StampButton
              tone="primary"
              size="sm"
              onClick={() => setPicking((value) => !value)}
            >
              {picking ? 'Close' : 'New card'}
            </StampButton>
          </>
        }
      />

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      {picking ? (
        <LabelledBlock
          label="Start from a template"
          className="mt-8 rounded-[4px] border border-border bg-card p-4 sm:p-5"
        >
          {catalog.templates.length === 0 ? (
            <EmptyPlate label="No templates published">
              An administrator publishes templates from the admin panel. Once one
              is live it appears here on its own.
            </EmptyPlate>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {catalog.templates.map((template) => {
                const style =
                  catalog.styles.find((entry) => entry.id === template.defaultStyleId) ?? null
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => void create(template.id)}
                    disabled={busy !== null}
                    className="group block text-left disabled:opacity-50"
                  >
                    <div
                      className="overflow-hidden bg-surface-2 outline outline-1 -outline-offset-1 outline-border transition-all group-hover:outline-foreground"
                      style={{
                        aspectRatio: `${template.definition.canvas.width} / ${template.definition.canvas.height}`,
                      }}
                    >
                      <CardRenderer
                        definition={template.definition}
                        style={style}
                        profile={data}
                        title={template.name}
                      />
                    </div>
                    <div className="mt-2 truncate font-serif text-base text-foreground">
                      {busy === template.id ? 'Making…' : template.name}
                    </div>
                    <MonoLabel size="xs" className="truncate">
                      {template.category}
                    </MonoLabel>
                  </button>
                )
              })}
            </div>
          )}
        </LabelledBlock>
      ) : null}

      <LabelledBlock
        label={`Your cards — ${bundle.cards.length}`}
        className="mt-10"
        action={
          <MonoLabel size="xs">Tap a card to edit it</MonoLabel>
        }
      >
        {bundle.cards.length === 0 ? (
          <EmptyPlate label="No cards yet" action={
            <StampButton tone="primary" size="sm" onClick={() => setPicking(true)}>
              Make one
            </StampButton>
          }>
            A card is your life at a glance — a photograph, your name and the few
            things you would actually mention. Sized for Instagram and WhatsApp.
          </EmptyPlate>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {bundle.cards.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                bundle={bundle}
                catalog={catalog}
                busy={busy}
                onAct={act}
              />
            ))}
          </div>
        )}
      </LabelledBlock>
    </div>
  )
}

function CardTile({
  card,
  bundle,
  catalog,
  busy,
  onAct,
}: {
  card: Card
  bundle: CardBundle
  catalog: Catalog
  busy: string | null
  onAct(cardId: string, action: 'publish' | 'primary' | 'refresh' | 'upgrade'): void
}) {
  const pinned = bundle.templates[`${card.templateId}@${card.templateVersion}`]
  const style = card.styleId ? bundle.styles[card.styleId] : null
  const catalogTemplate = catalog.templates.find((entry) => entry.id === card.templateId)
  const outdated = !!catalogTemplate && catalogTemplate.version > card.templateVersion

  if (!pinned) {
    return (
      <div className="rounded-[4px] border border-dashed border-border p-4">
        <MonoLabel size="xs" tone="primary">
          Template missing
        </MonoLabel>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {card.title} was built on a template that is no longer available.
        </p>
      </div>
    )
  }

  return (
    <figure className="min-w-0">
      <Link href={`/profile/cards/${card.id}`} className="block">
        <div
          className="overflow-hidden bg-surface-2 outline outline-1 -outline-offset-1 outline-border transition-all hover:outline-foreground"
          style={{
            aspectRatio: `${pinned.definition.canvas.width} / ${pinned.definition.canvas.height}`,
          }}
        >
          <CardRenderer
            definition={pinned.definition}
            style={style}
            profile={card.profileSnapshot}
            customization={card.customization}
            title={card.title}
          />
        </div>
      </Link>

      <figcaption className="mt-2">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/profile/cards/${card.id}`}
            className="min-w-0 truncate font-serif text-base text-foreground hover:underline"
          >
            {card.title}
          </Link>
          {card.isPrimary ? (
            <MonoLabel size="xs" tone="primary">
              Main
            </MonoLabel>
          ) : null}
        </div>

        <MonoLabel size="xs" className="mt-0.5 truncate">
          {pinned.name} v{card.templateVersion}
          {style ? ` · ${style.name}` : ''}
        </MonoLabel>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <SpecPill tone={card.isPublic ? 'secondary' : 'muted'} className="px-2 py-1">
            {card.isPublic ? 'Public' : 'Private'}
          </SpecPill>

          <TileAction
            label={card.isPublic ? 'Hide' : 'Publish'}
            busy={busy === card.id + 'publish'}
            onClick={() => onAct(card.id, 'publish')}
          />
          {!card.isPrimary ? (
            <TileAction
              label="Make main"
              busy={busy === card.id + 'primary'}
              onClick={() => onAct(card.id, 'primary')}
            />
          ) : null}
          <TileAction
            label="Refresh"
            title="Rebuild this card from your details as they are now"
            busy={busy === card.id + 'refresh'}
            onClick={() => onAct(card.id, 'refresh')}
          />
        </div>

        {outdated ? (
          <div className="mt-2 border-l-2 border-primary pl-2.5">
            <MonoLabel size="xs" tone="primary">
              v{catalogTemplate!.version} available
            </MonoLabel>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              This card still renders as it always has.{' '}
              <button
                type="button"
                onClick={() => onAct(card.id, 'upgrade')}
                disabled={busy === card.id + 'upgrade'}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
              >
                {busy === card.id + 'upgrade' ? 'Updating…' : 'Update'}
              </button>
            </p>
          </div>
        ) : null}
      </figcaption>
    </figure>
  )
}

function TileAction({
  label,
  onClick,
  busy,
  title,
}: {
  label: string
  onClick(): void
  busy?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className={cn(
        'font-mono text-[10px] uppercase tracking-[0.06em] underline-offset-4 transition-colors',
        busy ? 'text-ink-soft' : 'text-ink-soft hover:text-primary hover:underline'
      )}
    >
      {busy ? '…' : label}
    </button>
  )
}
