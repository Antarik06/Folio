'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MonoLabel, SpecPill, StampButton } from '@/components/folio/primitives'
import { ProfileCardStage } from '@/components/profile/card-stage'
import { ProfileShowcase } from '@/components/profile/showcase'
import { ShareProfileDialog } from '@/components/profile/share-profile'
import { ProfileOnboarding, type OnboardingPhoto } from '@/components/profile/onboarding'
import { profileApi, type ProfileAlbum, type ProfilePhoto } from '@/lib/profile/api'
import type { Card, CardBundle, Catalog } from '@/lib/cards/types'

export interface ProfilePageData {
  id: string
  full_name: string | null
  handle: string | null
  bio: string | null
  page_is_public: boolean
  member_since: string
  events_joined: number
  events_hosted: number
  onboarded_at: string | null
  albums: ProfileAlbum[]
  draft_albums: ProfileAlbum[]
  photos: ProfilePhoto[]
  cards: Card[]
  card_templates: CardBundle['templates']
  card_styles: CardBundle['styles']
}

/**
 * Screen 07 — the Profile tab.
 *
 * Read top to bottom it is one claim, made three times at decreasing volume:
 * the masthead says who, the card says what that is like, and the showcase
 * says what came of it. The card being the largest thing on the page is the
 * whole point of the rearrangement — a profile made of album thumbnails
 * describes a filing cabinet, not a person.
 *
 * The first visit interrupts all of that with a questionnaire, because the
 * alternative is a centrepiece built from a name and nothing else. It is asked
 * exactly once and can be walked out of at any point.
 */
export function ProfilePageClient({
  initial,
  catalog,
  onboardingPhotos,
}: {
  initial: ProfilePageData
  catalog: Catalog
  onboardingPhotos: OnboardingPhoto[]
}) {
  const router = useRouter()
  const [data, setData] = useState(initial)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [onboarding, setOnboarding] = useState(!initial.onboarded_at)

  const memberSince = new Date(data.member_since).getFullYear()
  const creditLine = [
    data.handle ? `@${data.handle}` : 'No handle yet',
    `Guest of ${data.events_joined} event${data.events_joined === 1 ? '' : 's'}`,
    `Member since ${Number.isNaN(memberSince) ? '—' : memberSince}`,
  ].join(' · ')

  function refresh() {
    startTransition(() => router.refresh())
  }

  if (onboarding) {
    return (
      <ProfileOnboarding
        catalog={catalog}
        photos={onboardingPhotos}
        initial={{ name: data.full_name, handle: data.handle, bio: data.bio }}
        onDone={() => {
          setOnboarding(false)
          // The questionnaire wrote a card, a handle and a bio server-side, so
          // the page is re-fetched rather than patched from the response.
          refresh()
        }}
        onSkip={() => {
          setOnboarding(false)
          setData((current) => ({ ...current, onboarded_at: new Date().toISOString() }))
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-12">
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
          <StampButton tone="ink" size="sm" onClick={() => setSharing(true)}>
            Share page
          </StampButton>
          <StampButton tone="ghost" size="sm" onClick={() => setEditing((value) => !value)}>
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
            setData((current) => ({ ...current, ...next }))
            setEditing(false)
            refresh()
          }}
          onError={setError}
          onRerunOnboarding={() => {
            setEditing(false)
            setOnboarding(true)
          }}
        />
      ) : null}

      {/* ── The centrepiece ───────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <MonoLabel tone="primary">Your card</MonoLabel>
          <Link
            href="/profile/cards"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
          >
            All cards →
          </Link>
        </div>

        <ProfileCardStage
          cards={data.cards}
          templates={data.card_templates}
          styles={data.card_styles}
          onCardsChanged={(cards) => setData((current) => ({ ...current, cards }))}
        />
      </section>

      {/* ── What is under it ──────────────────────────────────────────────── */}
      <ProfileShowcase
        photos={data.photos}
        albums={data.albums}
        draftAlbums={data.draft_albums}
        onPhotosChanged={(photos) => setData((current) => ({ ...current, photos }))}
        onAlbumsChanged={(albums, draftAlbums) =>
          setData((current) => ({ ...current, albums, draft_albums: draftAlbums }))
        }
      />

      {sharing ? (
        <ShareProfileDialog
          handle={data.handle}
          isPublic={data.page_is_public}
          onClose={() => setSharing(false)}
          onPublished={(next) => {
            setData((current) => ({ ...current, ...next }))
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

function PageSettings({
  data,
  onSaved,
  onError,
  onRerunOnboarding,
}: {
  data: ProfilePageData
  onSaved: (next: Partial<ProfilePageData>) => void
  onError: (message: string | null) => void
  onRerunOnboarding: () => void
}) {
  const [handle, setHandle] = useState(data.handle ?? '')
  const [bio, setBio] = useState(data.bio ?? '')
  const [isPublic, setIsPublic] = useState(data.page_is_public)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    onError(null)
    try {
      const next = await profileApi.updatePage({ handle, bio, page_is_public: isPublic })
      onSaved({
        handle: next.handle,
        bio: next.bio,
        page_is_public: next.page_is_public,
      })
    } catch (saveError) {
      onError((saveError as Error).message)
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
              onChange={(event) => setHandle(event.target.value)}
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
            onChange={(event) => setBio(event.target.value)}
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
          onChange={(event) => setIsPublic(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm text-foreground">Make my page public</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            Anyone with the link sees your card, the images and albums you added,
            and nothing else — your library and events stay private.
          </span>
        </span>
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <StampButton tone="primary" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </StampButton>
        {data.handle ? <MonoLabel size="xs">folio.app/p/{data.handle}</MonoLabel> : null}
        <button
          type="button"
          onClick={onRerunOnboarding}
          className="ml-auto font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft underline-offset-4 hover:text-primary hover:underline"
        >
          Answer the questions again
        </button>
      </div>
    </div>
  )
}
