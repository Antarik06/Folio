'use client'

import { useState, useTransition } from 'react'
import { Photo } from '@/lib/types/database'
import { togglePhotoShared, shareAllPhotos } from '@/lib/actions/events'

interface PhotoGridProps {
  photos: Partial<Photo>[]
  eventId: string
  isHost: boolean
}

export function PhotoGrid({ photos, eventId, isHost }: PhotoGridProps) {
  const [localPhotos, setLocalPhotos] = useState(photos)
  const [lightboxPhoto, setLightboxPhoto] = useState<Partial<Photo> | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!localPhotos || localPhotos.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border">
        <svg className="w-16 h-16 mx-auto text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-serif text-xl text-foreground mb-2">No photos yet</p>
        <p className="text-muted-foreground text-sm">Be the first to upload photos to this event.</p>
      </div>
    )
  }

  function handleToggleShare(photoId: string, currentIsShared: boolean) {
    // Optimistic UI update
    setLocalPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, is_shared: !currentIsShared } : p))
    )
    startTransition(async () => {
      const result = await togglePhotoShared(photoId, currentIsShared)
      if (result?.error) {
        // Revert on error
        setLocalPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, is_shared: currentIsShared } : p))
        )
      }
    })
  }

  function handleShareAll() {
    const unsharedCount = localPhotos.filter((p) => !p.is_shared).length
    if (unsharedCount === 0) return

    // Optimistic update
    const previous = [...localPhotos]
    setLocalPhotos((prev) => prev.map((p) => ({ ...p, is_shared: true })))

    startTransition(async () => {
      const result = await shareAllPhotos(eventId)
      if (result?.error) {
        // Revert on error
        setLocalPhotos(previous)
      }
    })
  }

  const unsharedPhotosCount = localPhotos.filter((p) => !p.is_shared).length

  return (
    <>
      {isHost && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 p-4 bg-card border border-border text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-secondary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Click the <strong className="text-foreground">Share</strong> button on any photo to make it visible to guests.</span>
          </div>
          {unsharedPhotosCount > 0 && (
            <button
              onClick={handleShareAll}
              disabled={isPending}
              className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Share All ({unsharedPhotosCount})
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {localPhotos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square bg-card border border-border overflow-hidden group"
          >
            {/* Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbnail_url || photo.blob_url || ''}
              alt="Event photo"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
              onClick={() => setLightboxPhoto(photo)}
            />

            {/* Shared indicator */}
            {photo.is_shared && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-secondary/90 text-xs text-white uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Shared
              </div>
            )}

            {/* Host controls overlay */}
            {isHost && (
              <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-black/80 p-2 flex justify-between items-center">
                <button
                  onClick={() => handleToggleShare(photo.id!, !!photo.is_shared)}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors ${
                    photo.is_shared
                      ? 'bg-secondary/20 text-secondary hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-white/10 text-white hover:bg-secondary/20 hover:text-secondary'
                  }`}
                >
                  {photo.is_shared ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                      Unshare
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </>
                  )}
                </button>
                <button
                  onClick={() => setLightboxPhoto(photo)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
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
