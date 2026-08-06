'use client'

import { useState } from 'react'
import { Photo } from '@/lib/types/database'

/** Rows carry `is_face_match` from the backend's face matcher. */
type GuestPhoto = Partial<Photo> & { is_face_match?: boolean }

interface GuestPhotoGridProps {
  photos: GuestPhoto[]
  ownPhotos: GuestPhoto[]
  sharedPhotos: GuestPhoto[]
  matchedPhotos?: GuestPhoto[]
  eventId: string
  userId: string
}

export function GuestPhotoGrid({ ownPhotos, sharedPhotos, matchedPhotos = [] }: GuestPhotoGridProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<GuestPhoto | null>(null)

  if (ownPhotos.length === 0 && sharedPhotos.length === 0 && matchedPhotos.length === 0) return null

  return (
    <>
      {/* Photos of You — the payoff for enrolling a face */}
      {matchedPhotos.length > 0 && (
        <PhotoSection
          title="Photos of You"
          count={matchedPhotos.length}
          photos={matchedPhotos}
          badge="match"
          onSelect={setLightboxPhoto}
        />
      )}

      {/* My Uploads */}
      {ownPhotos.length > 0 && (
        <PhotoSection
          title="My Uploads"
          count={ownPhotos.length}
          photos={ownPhotos}
          badge={null}
          onSelect={setLightboxPhoto}
        />
      )}

      {/* Shared Moments */}
      {sharedPhotos.length > 0 && (
        <PhotoSection
          title="Shared Moments"
          count={sharedPhotos.length}
          photos={sharedPhotos}
          badge="shared"
          onSelect={setLightboxPhoto}
        />
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-6 right-6 text-background hover:text-primary transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto.blob_url || lightboxPhoto.thumbnail_url || ''}
            alt="Photo"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

function PhotoSection({
  title,
  count,
  photos,
  badge,
  onSelect,
}: {
  title: string
  count: number
  photos: GuestPhoto[]
  badge: 'shared' | 'match' | null
  onSelect: (photo: GuestPhoto) => void
}) {
  return (
    <section className="mb-14">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">{title}</h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">
          {count} photo{count !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} badge={badge} onClick={() => onSelect(photo)} />
        ))}
      </div>
    </section>
  )
}

function PhotoTile({
  photo,
  badge,
  onClick,
}: {
  photo: GuestPhoto
  badge: 'shared' | 'match' | null
  onClick: () => void
}) {
  return (
    <div
      className="relative aspect-square bg-card border border-border overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.thumbnail_url || photo.blob_url || ''}
        alt="Event photo"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-200 flex items-center justify-center">
        <svg className="w-8 h-8 text-background opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
      {badge === 'shared' && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-secondary/90 text-xs text-background uppercase tracking-wider">
          Shared
        </div>
      )}
      {badge === 'match' && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-xs text-primary-foreground uppercase tracking-wider">
          You
        </div>
      )}
    </div>
  )
}
