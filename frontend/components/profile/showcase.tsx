'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { profileApi, type ProfileAlbum, type ProfilePhoto } from '@/lib/profile/api'
import { cn } from '@/lib/utils'

/**
 * The showcase — what sits under the card.
 *
 * Two things live here and they are shown the same way on purpose: a square,
 * gapless grid, which is the grammar everyone already reads as "a body of
 * work". An album is one tile with a count on it, a photograph is one tile;
 * beyond that the grid makes no argument about which matters more.
 *
 * What it does insist on is that nothing arrives here by itself. Both tabs are
 * empty until something is explicitly added, through the same picker, one item
 * at a time — the album half of that rule has been the design since the profile
 * shipped, and extending it to single frames is what lets the Photos tab exist
 * at all without turning a shared event into a publication.
 */

type Tab = 'photos' | 'albums'

export function ProfileShowcase({
  photos,
  albums,
  draftAlbums = [],
  onPhotosChanged,
  onAlbumsChanged,
  editable = true,
}: {
  photos: ProfilePhoto[]
  albums: ProfileAlbum[]
  /** Owner's view only — what could still be promoted. */
  draftAlbums?: ProfileAlbum[]
  onPhotosChanged?(next: ProfilePhoto[]): void
  onAlbumsChanged?(promoted: ProfileAlbum[], drafts: ProfileAlbum[]): void
  /** False on someone else's page: same grid, no controls. */
  editable?: boolean
}) {
  // Opening on an empty tab when the other one is full reads as a broken page,
  // so the first tab with anything in it wins.
  const [tab, setTab] = useState<Tab>(() =>
    photos.length === 0 && albums.length > 0 ? 'albums' : 'photos'
  )
  const [picking, setPicking] = useState<Tab | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function removePhoto(photo: ProfilePhoto) {
    if (!onPhotosChanged) return
    setError(null)
    const previous = photos
    onPhotosChanged(photos.filter((entry) => entry.id !== photo.id))
    try {
      await profileApi.setPhoto(photo.id, false)
    } catch (removeError) {
      onPhotosChanged(previous)
      setError((removeError as Error).message)
    }
  }

  async function removeAlbum(album: ProfileAlbum) {
    if (!onAlbumsChanged) return
    setError(null)
    const previousPromoted = albums
    const previousDrafts = draftAlbums
    onAlbumsChanged(
      albums.filter((entry) => entry.id !== album.id),
      [{ ...album, on_profile: false }, ...draftAlbums]
    )
    try {
      await profileApi.setAlbum(album.id, false)
    } catch (removeError) {
      onAlbumsChanged(previousPromoted, previousDrafts)
      setError((removeError as Error).message)
    }
  }

  const count = tab === 'photos' ? photos.length : albums.length

  return (
    <section className="mt-12">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2">
        <div className="flex gap-1">
          <TabButton active={tab === 'photos'} onClick={() => setTab('photos')}>
            Images — {photos.length}
          </TabButton>
          <TabButton active={tab === 'albums'} onClick={() => setTab('albums')}>
            Albums — {albums.length}
          </TabButton>
        </div>

        {editable ? (
          <StampButton tone="ghost" size="sm" onClick={() => setPicking(tab)}>
            + Add to profile
          </StampButton>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 border border-primary px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}

      {/* ── The grid ─────────────────────────────────────────────────────── */}
      <div className="mt-4">
        {count === 0 ? (
          <EmptyShowcase
            tab={tab}
            editable={editable}
            onAdd={() => setPicking(tab)}
            hasDrafts={draftAlbums.length > 0}
          />
        ) : (
          <div className="grid grid-cols-3 gap-[2px] bg-border sm:grid-cols-4 lg:grid-cols-6">
            {tab === 'photos'
              ? photos.map((photo) => (
                  <ShowcaseTile
                    key={photo.id}
                    src={photo.url}
                    caption={photo.event_title}
                    editable={editable}
                    onRemove={() => void removePhoto(photo)}
                  />
                ))
              : albums.map((album) => (
                  <ShowcaseTile
                    key={album.id}
                    src={album.cover_url}
                    caption={album.title}
                    href={`/preview/${album.id}`}
                    badge="Album"
                    editable={editable}
                    onRemove={() => void removeAlbum(album)}
                  />
                ))}
          </div>
        )}
      </div>

      {/* ── The picker ───────────────────────────────────────────────────── */}
      {picking === 'photos' && onPhotosChanged ? (
        <PhotoPickerSheet
          promoted={photos}
          onClose={() => setPicking(null)}
          onChanged={onPhotosChanged}
        />
      ) : null}

      {picking === 'albums' && onAlbumsChanged ? (
        <AlbumPickerSheet
          promoted={albums}
          drafts={draftAlbums}
          onClose={() => setPicking(null)}
          onChanged={onAlbumsChanged}
        />
      ) : null}
    </section>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick(): void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[40px] border-b-2 px-3 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
        active
          ? 'border-foreground text-foreground'
          : 'border-transparent text-ink-soft hover:text-foreground'
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function ShowcaseTile({
  src,
  caption,
  href,
  badge,
  editable,
  onRemove,
}: {
  src: string | null
  caption: string | null
  href?: string
  badge?: string
  editable?: boolean
  onRemove?(): void
}) {
  const frame = (
    <div className="relative aspect-square overflow-hidden bg-surface-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={caption ?? ''} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full border border-dashed border-border" />
      )}

      {/* One overlay carries the caption and the badge, so a tile is never
          decorated at rest — the grid stays flat until it is pointed at. */}
      <span className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/35 via-transparent to-black/55 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {badge ? (
          <span className="self-start font-mono text-[9px] uppercase tracking-[0.08em] text-white/90">
            {badge}
          </span>
        ) : (
          <span />
        )}
        {caption ? (
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.06em] text-white/95">
            {caption}
          </span>
        ) : null}
      </span>
    </div>
  )

  return (
    <figure className="group relative">
      {href ? (
        <Link href={href} className="block focus-visible:z-10">
          {frame}
        </Link>
      ) : (
        frame
      )}

      {editable && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title="Take off the page"
          aria-label="Take off the page"
          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-[2px] bg-background/85 font-mono text-[13px] leading-none text-foreground opacity-0 transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </figure>
  )
}

function EmptyShowcase({
  tab,
  editable,
  onAdd,
  hasDrafts,
}: {
  tab: Tab
  editable: boolean
  onAdd(): void
  hasDrafts: boolean
}) {
  if (!editable) {
    return (
      <div className="rounded-[4px] border border-dashed border-border px-6 py-14 text-center">
        <MonoLabel>{tab === 'photos' ? 'No images here' : 'No albums here'}</MonoLabel>
      </div>
    )
  }

  return (
    <div className="rounded-[4px] border border-dashed border-border px-6 py-14 text-center">
      <MonoLabel>{tab === 'photos' ? 'No images on your page' : 'No albums on your page'}</MonoLabel>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {tab === 'photos'
          ? 'Frames stay in your library until you put one here. Add them one at a time — only photographs you uploaded yourself can go on a page.'
          : hasDrafts
            ? 'Albums stay private until you promote one. Add them one at a time.'
            : 'Albums you make will be offered here once you have one.'}
      </p>
      <div className="mt-5">
        <StampButton tone="primary" size="sm" onClick={onAdd}>
          Add to profile
        </StampButton>
      </div>
    </div>
  )
}

/* ── Pickers ──────────────────────────────────────────────────────────────── */

function Sheet({
  title,
  note,
  onClose,
  children,
  footer,
}: {
  title: string
  note: string
  onClose(): void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />
      <div className="relative flex max-h-[88dvh] w-full max-w-[900px] flex-col rounded-t-[4px] border border-border bg-card sm:rounded-[4px]">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="font-serif text-xl leading-tight text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note}</p>
          </div>
          <StampButton tone="ghost" size="sm" onClick={onClose}>
            Done
          </StampButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>

        {footer ? <div className="border-t border-border p-4 sm:p-5">{footer}</div> : null}
      </div>
    </div>
  )
}
