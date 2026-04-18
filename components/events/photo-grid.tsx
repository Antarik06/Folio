'use client'

import { Photo } from '@/lib/types/database'

export function PhotoGrid({ photos, eventId, isHost }: { photos: Partial<Photo>[], eventId: string, isHost: boolean }) {
  if (!photos || photos.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No photos uploaded yet. Begin the event by uploading photos!</p>
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map(photo => (
        <div key={photo.id} className="aspect-square bg-surface border border-border relative overflow-hidden group rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={photo.thumbnail_url || photo.blob_url} 
            alt="Event photo" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  )
}
