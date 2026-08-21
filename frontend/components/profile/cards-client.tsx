'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clientFetch } from '@/lib/api-client'
import {
  Frame,
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  SpecPill,
  StampButton,
} from '@/components/folio/primitives'
import { ShareCard, type ShareCardData } from '@/components/profile/share-card'

interface PickablePhoto {
  id: string
  url: string
  event_title?: string
}

/**
 * Cards — the Share stage's output.
 *
 * The whole screen is a live proof: you pick a photo, type the words, and the
 * card next to you *is* the card, at the same 4:5 crop it will export at.
 * There is no separate preview step, because the card is small enough to be
 * its own form.
 */
export function CardsClient({
  initialCards,
  photos,
  handle,
  name,
}: {
  initialCards: ShareCardData[]
  photos: PickablePhoto[]
  handle: string | null
  name: string | null
}) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [kind, setKind] = useState<'occasion' | 'profile'>('occasion')
  const [headline, setHeadline] = useState('2 Years')
  const [subline, setSubline] = useState('')
  const [occasionDate, setOccasionDate] = useState('')
  const [photoId, setPhotoId] = useState<string | null>(photos[0]?.id ?? null)
  const [isPublic, setIsPublic] = useState(false)

  const selectedPhoto = useMemo(
    () => photos.find((p) => p.id === photoId) ?? null,
    [photos, photoId]
  )

  const draft: ShareCardData = {
    id: 'draft',
    kind,
    headline: headline || 'Your headline',
    subline: subline || null,
    occasion_date: occasionDate || null,
    photo_url: selectedPhoto?.url ?? null,
  }

  async function create() {
    setError(null)
    setSaving(true)
    try {
      const created = await clientFetch('/api/profile/cards', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          headline,
          subline: subline || null,
          occasion_date: occasionDate || null,
          photo_id: photoId,
          photo_url: selectedPhoto?.url ?? null,
          is_public: isPublic,
        }),
      })
      setCards((c) => [created, ...c])
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePublic(card: ShareCardData) {
    setError(null)
    try {
      const next = await clientFetch(`/api/profile/cards/${card.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_public: !card.is_public }),
      })
      setCards((c) => c.map((x) => (x.id === card.id ? next : x)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function remove(card: ShareCardData) {
    setError(null)
    try {
      await clientFetch(`/api/profile/cards/${card.id}`, { method: 'DELETE' })
      setCards((c) => c.filter((x) => x.id !== card.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Profile — Cards"
        title="Cards"
        meta={`${cards.length} made · 1080×1350 · instagram & whatsapp`}
        actions={
          <StampButton href="/profile" tone="ghost" size="sm">
            ← Profile
          </StampButton>
        }
      />

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      {/* ── The proof, and the words on it ─────────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <div className="flex justify-center lg:sticky lg:top-24 lg:block lg:self-start">
          <ShareCard card={draft} handle={handle} name={name} width={230} />
        </div>

        <div className="min-w-0">
          <LabelledBlock label="Card type">
            <div className="grid gap-3 sm:grid-cols-2">
              <TypeChoice
                active={kind === 'occasion'}
                onClick={() => setKind('occasion')}
                title="Occasion"
                note="Terracotta field, photo set like a locket. For anniversaries, birthdays, milestones."
              />
              <TypeChoice
                active={kind === 'profile'}
                onClick={() => setKind('profile')}
                title="Profile"
                note="Paper field, one photo bleeding to the edges, your handle beneath."
              />
            </div>
          </LabelledBlock>

          <LabelledBlock label="Words" className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <MonoLabel size="xs" className="mb-1.5">
                  Headline
                </MonoLabel>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={60}
                  placeholder="2 Years"
                  className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 font-serif text-lg text-foreground outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <MonoLabel size="xs" className="mb-1.5">
                  {kind === 'occasion' ? 'Date' : 'Caption'}
                </MonoLabel>
                {kind === 'occasion' ? (
                  <input
                    type="date"
                    value={occasionDate}
                    onChange={(e) => setOccasionDate(e.target.value)}
                    className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                  />
                ) : (
                  <input
                    value={subline}
                    onChange={(e) => setSubline(e.target.value)}
                    maxLength={60}
                    placeholder="Udaipur, November"
                    className="min-h-[44px] w-full rounded-[2px] border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                  />
                )}
              </label>
            </div>
          </LabelledBlock>

          <LabelledBlock
            label={`Photo — ${photos.length} to choose from`}
            className="mt-7"
          >
            {photos.length === 0 ? (
              <div className="rounded-[4px] border border-dashed border-border px-6 py-10 text-center">
                <MonoLabel>No photos yet</MonoLabel>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  A card centres one photo from your library. Join or host an
                  event first.
                </p>
              </div>
            ) : (
              <div className="grid max-h-[280px] grid-cols-4 gap-[3px] overflow-y-auto rounded-[4px] border border-border bg-card p-[3px] sm:grid-cols-6 lg:grid-cols-8">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPhotoId(photo.id)}
                    aria-pressed={photo.id === photoId}
                    aria-label={photo.event_title ?? 'Photo'}
                    className="block"
                  >
                    <Frame
                      src={photo.url}
                      alt=""
                      ratio="1/1"
                      selected={photo.id === photoId}
                    />
                  </button>
                ))}
              </div>
            )}
          </LabelledBlock>

          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              <span className="text-sm text-foreground">Show on my public page</span>
            </label>
            <StampButton
              tone="primary"
              onClick={create}
              disabled={saving || !headline.trim()}
              className="ml-auto"
            >
              {saving ? 'Saving…' : 'Save card'}
            </StampButton>
          </div>
        </div>
      </div>

      {/* ── Cards already made ─────────────────────────────────────────────── */}
      {cards.length > 0 ? (
        <LabelledBlock label={`Your cards — ${cards.length}`} className="mt-12">
          <div className="flex flex-wrap gap-5">
            {cards.map((card) => (
              <div key={card.id} className="w-[230px]">
                <ShareCard card={card} handle={handle} name={name} />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <SpecPill tone={card.is_public ? 'secondary' : 'muted'}>
                    {card.is_public ? 'Public' : 'Private'}
                  </SpecPill>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => togglePublic(card)}
                      className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {card.is_public ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(card)}
                      className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-primary hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LabelledBlock>
      ) : null}
    </div>
  )
}

function TypeChoice({
  active,
  onClick,
  title,
  note,
}: {
  active: boolean
  onClick: () => void
  title: string
  note: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[88px] flex-col justify-center rounded-[4px] border p-4 text-left transition-colors ${
        active ? 'border-primary bg-primary/[0.06]' : 'border-border bg-card hover:border-foreground'
      }`}
    >
      <span className="font-serif text-lg text-foreground">{title}</span>
      <span className="mt-1 text-[13px] leading-snug text-muted-foreground">{note}</span>
    </button>
  )
}
