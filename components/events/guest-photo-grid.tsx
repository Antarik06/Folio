'use client'

import { useState } from 'react'
import { Photo } from '@/lib/types/database'

interface GuestPhotoGridProps {
  photos: Partial<Photo>[]
  ownPhotos: Partial<Photo>[]
  sharedPhotos: Partial<Photo>[]
  eventId: string
  userId: string
}

export function GuestPhotoGrid({ ownPhotos, sharedPhotos }: GuestPhotoGridProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Partial<Photo> | null>(null)

  if (ownPhotos.length === 0 && sharedPhotos.length === 0) return null

  return (
    <>
      {/* My Uploads */}
      {ownPhotos.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">My Uploads</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">{ownPhotos.length} photo{ownPhotos.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ownPhotos.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                badge={null}
                onClick={() => setLightboxPhoto(photo)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Shared Moments */}
      {sharedPhotos.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Shared Moments</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">{sharedPhotos.length} photo{sharedPhotos.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sharedPhotos.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                badge="shared"
                onClick={() => setLightboxPhoto(photo)}
              />
            ))}
          </div>
        </section>
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

function PhotoTile({
  photo,
  badge,
  onClick,
}: {
  photo: Partial<Photo>
  badge: 'shared' | null
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
      {/* Shared badge */}
      {badge === 'shared' && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-secondary/90 text-xs text-background uppercase tracking-wider">
          Shared
        </div>
      )}
    </div>
  )
}
