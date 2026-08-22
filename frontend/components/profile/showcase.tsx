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
