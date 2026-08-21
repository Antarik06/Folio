'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clientFetch } from '@/lib/api-client'
import {
  Frame,
  LabelledBlock,
  MonoLabel,
  SpecPill,
  StampButton,
} from '@/components/folio/primitives'
import { ShareCard, type ShareCardData } from '@/components/profile/share-card'

interface ProfileAlbum {
  id: string
  title: string
  cover_url: string | null
  event_title: string | null
  on_profile: boolean
}

export interface ProfilePageData {
  id: string
  full_name: string | null
  handle: string | null
  bio: string | null
  page_is_public: boolean
  member_since: string
  events_joined: number
  events_hosted: number
  albums: ProfileAlbum[]
  draft_albums: ProfileAlbum[]
  cards: ShareCardData[]
}

/**
 * Screen 07 — Profile & Cards, owner's view.
 *
 * A magazine masthead: name in serif, mono credit line beneath, and the
 * heaviest rule in the system under both. Below it, what's on the page, and a
 * plain list of what could be — because promotion is one explicit decision per
 * album, never a bulk switch.
 */
export function ProfilePageClient({ initial }: { initial: ProfilePageData }) {
  const router = useRouter()
  const [data, setData] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(!initial.handle)

  const memberSince = new Date(data.member_since).getFullYear()
  const creditLine = [
    data.handle ? `@${data.handle}` : 'No handle yet',
    `Guest of ${data.events_joined} event${data.events_joined === 1 ? '' : 's'}`,
    `Member since ${Number.isNaN(memberSince) ? '—' : memberSince}`,
  ].join(' · ')

  async function togglePromotion(album: ProfileAlbum) {
    setError(null)
    const next = !album.on_profile
    try {
      await clientFetch(`/api/profile/albums/${album.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ on_profile: next }),
      })
      setData((d) => {
        const moved = { ...album, on_profile: next }
        return next
          ? {
              ...d,
              albums: [moved, ...d.albums],
              draft_albums: d.draft_albums.filter((a) => a.id !== album.id),
            }
          : {
              ...d,
              albums: d.albums.filter((a) => a.id !== album.id),
              draft_albums: [moved, ...d.draft_albums],
            }
      })
      startTransition(() => router.refresh())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      {/* ── Masthead ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[clamp(2rem,9vw,2.75rem)] leading-none text-foreground">
            {data.full_name || 'Your page'}
          </h1>
          <MonoLabel className="mt-1.5">{creditLine}</MonoLabel>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SpecPill tone={data.page_is_public ? 'secondary' : 'muted'}>
            {data.page_is_public ? 'Page is public' : 'Page is private'}
          </SpecPill>
          <StampButton tone="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Close' : 'Settings'}
          </StampButton>
        </div>
      </div>

      {data.bio ? (
        <p className="mt-5 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-soft">
          {data.bio}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      {editing ? (
        <PageSettings
          data={data}
          onSaved={(next) => {
            setData((d) => ({ ...d, ...next }))
            setEditing(false)
            startTransition(() => router.refresh())
          }}
          onError={setError}
        />
      ) : null}

      {/* ── What's on the page ────────────────────────────────────────────── */}
      <LabelledBlock
        label={`On your page — ${data.albums.length} album${data.albums.length === 1 ? '' : 's'}`}
        className="mt-10"
        action={
          data.handle && data.page_is_public ? (
            <Link
              href={`/p/${data.handle}`}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
            >
              View public page →
            </Link>
          ) : null
        }
      >
        {data.albums.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-border px-6 py-12 text-center">
            <MonoLabel>Nothing promoted yet</MonoLabel>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Albums stay private until you put one here. Promote them one at a
              time from the list below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {data.albums.map((album) => (
              <figure key={album.id} className="group">
                <Link href={`/preview/${album.id}`} className="block">
                  <Frame src={album.cover_url} alt={album.title} ratio="4/5" />
                </Link>
                <figcaption className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-serif text-base text-foreground">
                      {album.title}
                    </div>
                    {album.event_title ? (
                      <MonoLabel size="xs" className="truncate">
                        {album.event_title}
                      </MonoLabel>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePromotion(album)}
                    disabled={pending}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-primary hover:underline"
                  >
                    Remove
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </LabelledBlock>

      {/* ── What could go on it ───────────────────────────────────────────── */}
      {data.draft_albums.length > 0 ? (
        <LabelledBlock
          label={`Private — ${data.draft_albums.length} album${data.draft_albums.length === 1 ? '' : 's'}`}
          className="mt-10"
        >
          <ul className="divide-y divide-border rounded-[4px] border border-border bg-card">
            {data.draft_albums.map((album) => (
              <li
                key={album.id}
                className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden bg-surface-2 sm:h-14 sm:w-14">
                  {album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full border border-dashed border-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-base text-foreground">
                    {album.title}
                  </div>
                  {album.event_title ? (
                    <MonoLabel size="xs" className="truncate">
                      {album.event_title}
                    </MonoLabel>
                  ) : null}
                </div>
                <StampButton
                  tone="ghost"
                  size="sm"
                  onClick={() => togglePromotion(album)}
                  disabled={pending}
                >
                  Promote
                </StampButton>
              </li>
            ))}
          </ul>
        </LabelledBlock>
      ) : null}

      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      <LabelledBlock
        label="Share cards — 1080×1350"
        className="mt-10"
        action={
          <Link
            href="/profile/cards"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
          >
            {data.cards.length > 0 ? 'Manage →' : 'Make one →'}
          </Link>
        }
      >
        {data.cards.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-border px-6 py-10 text-center">
            <MonoLabel>No cards yet</MonoLabel>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A card is one photo and a few words, sized for Instagram and
              WhatsApp — an anniversary, a birthday, a trip you finished.
            </p>
            <div className="mt-5">
              <StampButton href="/profile/cards" tone="primary" size="sm">
                Make a card
              </StampButton>
            </div>
          </div>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-rail sm:mx-0 sm:px-0">
            {data.cards.slice(0, 8).map((card) => (
              <div key={card.id} className="shrink-0">
                <ShareCard card={card} handle={data.handle} name={data.full_name} />
              </div>
            ))}
          </div>
        )}
      </LabelledBlock>
    </div>
  )
}

function PageSettings({
  data,
  onSaved,
  onError,
}: {
  data: ProfilePageData
  onSaved: (next: Partial<ProfilePageData>) => void
  onError: (message: string | null) => void
}) {
  const [handle, setHandle] = useState(data.handle ?? '')
  const [bio, setBio] = useState(data.bio ?? '')
  const [isPublic, setIsPublic] = useState(data.page_is_public)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    onError(null)
    try {
      const next = await clientFetch('/api/profile/page', {
        method: 'PATCH',
        body: JSON.stringify({ handle, bio, page_is_public: isPublic }),
      })
      onSaved({
        handle: next.handle,
        bio: next.bio,
        page_is_public: next.page_is_public,
      })
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 rounded-[4px] border border-border bg-card p-4 sm:p-5">
      <MonoLabel tone="primary" size="xs" className="mb-4">
        Page settings
      </MonoLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <MonoLabel size="xs" className="mb-1.5">
            Handle
          </MonoLabel>
          <div className="flex items-center rounded-[2px] border border-border bg-background">
            <span className="pl-3 font-mono text-sm text-ink-soft">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourname"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-[44px] w-full bg-transparent px-2 font-mono text-sm text-foreground outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            3–30 characters. Lowercase letters, numbers, underscores.
          </p>
        </label>

        <label className="block">
          <MonoLabel size="xs" className="mb-1.5">
            One line about you
          </MonoLabel>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Shoots weddings in Udaipur. Mostly film."
            className="w-full rounded-[2px] border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm text-foreground">
            Make my page public
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            Anyone with the link sees the albums you promoted and the cards you
            marked public. Nothing else — your library and events stay private.
          </span>
        </span>
      </label>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <StampButton tone="primary" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </StampButton>
        {data.handle ? (
          <MonoLabel size="xs">folio.app/p/{data.handle}</MonoLabel>
        ) : null}
      </div>
    </div>
  )
}
