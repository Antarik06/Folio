'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { togglePhotoShared, shareAllPhotos, approvePhoto, rejectPhoto, deletePhoto } from '@/lib/actions/events'
import { PhotoLightbox } from './photo-lightbox'

interface Photo {
  id: string
  blob_url: string
  thumbnail_url?: string | null
  is_shared?: boolean
  is_host_photo?: boolean
  status?: string
  uploader_id?: string
  created_at?: string
}

interface PhotoGridProps {
  photos: Photo[]
  eventId: string
  currentUserId?: string
  isOwner?: boolean
  isManager?: boolean
  isGuest?: boolean
}

// Creating a dynamic bento-box masonry feel based on index
function getGridClasses(index: number) {
  const pattern = index % 10;
  switch (pattern) {
    case 0:
      return 'col-span-2 row-span-2' // Large hero
    case 3:
    case 6:
      return 'col-span-2 row-span-1' // Wide landscape
    case 8:
      return 'col-span-1 row-span-2' // Tall portrait
    default:
      return 'col-span-1 row-span-1' // Regular square
  }
}

export function PhotoGrid({ photos, eventId, currentUserId, isOwner, isManager, isGuest }: PhotoGridProps) {
  const [localPhotos, setLocalPhotos] = useState(photos)
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isShareAllPending, startShareAllTransition] = useTransition()
  const [shareAllDone, setShareAllDone] = useState(false)

  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  // Split photos into approved and pending
  const approvedPhotos = localPhotos.filter(p => !p.status || p.status === 'approved')
  const pendingPhotos = localPhotos.filter(p => p.status === 'pending')
  const unsharedApproved = approvedPhotos.filter(p => !p.is_shared)

  function handleToggleShare(photoId: string, currentIsShared: boolean) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, is_shared: !currentIsShared } : p)
    )
    startTransition(async () => {
      const result = await togglePhotoShared(photoId, currentIsShared)
      if (result?.error) {
        // Revert on error
        setLocalPhotos(prev =>
          prev.map(p => p.id === photoId ? { ...p, is_shared: currentIsShared } : p)
        )
      }
    })
  }

  function handleShareAll() {
    setLocalPhotos(prev => prev.map(p =>
      p.status !== 'pending' ? { ...p, is_shared: true } : p
    ))
    startShareAllTransition(async () => {
      const result = await shareAllPhotos(eventId)
      if (!result?.error) {
        setShareAllDone(true)
        setTimeout(() => setShareAllDone(false), 2500)
      }
    })
  }

  function handleApprove(photoId: string) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, status: 'approved' } : p)
    )
    startTransition(async () => {
      const result = await approvePhoto(photoId)
      if (result?.error) {
        setLocalPhotos(prev =>
          prev.map(p => p.id === photoId ? { ...p, status: 'pending' } : p)
        )
      }
    })
  }

  function handleReject(photoId: string) {
    setLocalPhotos(prev => prev.filter(p => p.id !== photoId))
    startTransition(async () => {
      const result = await rejectPhoto(photoId)
      if (result?.error) {
        // Restore if failed
        setLocalPhotos(photos)
      }
    })
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("Are you sure you want to delete this photo forever?")) return
    setLocalPhotos(prev => prev.filter(p => p.id !== photoId))
    startTransition(async () => {
      const result = await deletePhoto(photoId)
      if (result?.error) {
        setLocalPhotos(photos)
      }
    })
  }

  if (localPhotos.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border">
        <svg className="w-16 h-16 mx-auto text-border mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-serif text-xl text-foreground mb-2">No photos yet</p>
        <p className="text-sm text-muted-foreground">
          {isGuest
            ? 'Upload your photos — they\'ll appear here after host approval.'
            : 'Upload the first photos to start the collection.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">

      {/* ── Manager: Pending Approval section ─────────────────────────────── */}
      {isManager && pendingPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm uppercase tracking-wider text-foreground font-medium">
              Pending Approval
            </h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-mono">
              {pendingPhotos.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] grid-flow-dense gap-[2px] bg-black/10">
            {pendingPhotos.map((photo, index) => (
              <div 
                key={photo.id} 
                className={`relative group bg-card overflow-hidden cursor-pointer ${getGridClasses(index)}`}
                onClick={() => setActivePhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnail_url || photo.blob_url}
                  alt=""
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Awaiting</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(photo.id); }}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs uppercase tracking-wider hover:bg-secondary/90 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReject(photo.id); }}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-card border border-border text-muted-foreground text-xs uppercase tracking-wider hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                {/* Pending badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-background/80 text-foreground text-[9px] uppercase tracking-wider">
                  Pending
                </div>
                
                {/* Delete button */}
                {(isManager || photo.uploader_id === currentUserId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    disabled={isPending}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Approved photos ────────────────────────────────────────────────── */}
      {approvedPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
              {isManager && pendingPhotos.length > 0 ? 'Approved Photos' : 'Photos'}
              <span className="ml-2 font-mono text-foreground">{approvedPhotos.length}</span>
            </h3>
            {/* Share All — managers only, only if there are unshared photos */}
            {isManager && unsharedApproved.length > 0 && (
              <button
                onClick={handleShareAll}
                disabled={isShareAllPending}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs uppercase tracking-wider hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {isShareAllPending ? (
                  <span className="w-3 h-3 border border-secondary-foreground/40 border-t-secondary-foreground rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
                {shareAllDone ? 'All Shared!' : isShareAllPending ? 'Sharing…' : `Share All (${unsharedApproved.length})`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] grid-flow-dense gap-[2px] bg-black/10">
            {approvedPhotos.map((photo, index) => (
              <div 
                key={photo.id} 
                className={`relative group bg-card overflow-hidden cursor-zoom-in ${getGridClasses(index)}`}
                onClick={() => setActivePhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnail_url || photo.blob_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Shared indicator */}
                {photo.is_shared && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-secondary flex items-center justify-center">
                    <svg className="w-3 h-3 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Manager overlay: toggle share */}
                {isManager && (
                  <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleShare(photo.id, photo.is_shared ?? false); }}
                      disabled={isPending}
                      className={`pointer-events-auto px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${
                        photo.is_shared
                          ? 'bg-card text-foreground hover:bg-card/90'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                      }`}
                    >
                      {photo.is_shared ? 'Unshare' : 'Share'}
                    </button>
                  </div>
                )}

                {/* Guest: pending own upload label */}
                {isGuest && photo.status === 'pending' && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-background/80 text-foreground text-[9px] uppercase tracking-wider">
                    Pending
                  </div>
                )}

                {/* Delete button */}
                {(isManager || photo.uploader_id === currentUserId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    disabled={isPending}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest info notice */}
      {isGuest && (
        <p className="text-xs text-center text-muted-foreground">
          You can see shared photos and your own uploads. Photos you upload are visible to others after host approval.
        </p>
      )}

      {/* Lightbox Overlay */}
      {activePhoto && (
        <PhotoLightbox
          photo={activePhoto}
          isManager={isManager ?? false}
          isOwner={isOwner ?? false}
          currentUserId={currentUserId}
          onClose={() => setActivePhoto(null)}
          onDelete={handleDelete}
          onFavorite={(id) => console.log('Favorite placeholder:', id)}
          onApprove={isManager ? handleApprove : undefined}
          onToggleShare={isManager ? handleToggleShare : undefined}
          onSaveEdit={async (blob, photoId) => {
            if (!currentUserId) return
            
            const supabase = createClient()
            const filePath = `${eventId}/edited_${photoId}_${Date.now()}.jpg`
            
            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
              .from('photos')
              .upload(filePath, blob, { contentType: 'image/jpeg' })
              
            if (uploadError) {
              console.error('Upload Error:', uploadError)
              alert('Failed to save edited photo to storage.')
              return
            }
            
            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)
            
            // 3. Add record to photos table
            const { error: dbError } = await supabase.from('photos').insert({
              event_id: eventId,
              uploader_id: currentUserId,
              blob_url: publicUrl,
              blob_pathname: filePath,
              thumbnail_url: publicUrl,
              original_filename: `edited_${photoId}.jpg`,
              file_size: blob.size,
              is_host_photo: isManager ?? false,
              status: isManager ? 'approved' : 'pending',
              processing_status: 'pending'
            } as any)
            
            if (dbError) {
              console.error('DB Error:', dbError)
              alert('Failed to save photo record.')
              return
            }
            
            setActivePhoto(null)
            // Trigger server revalidation silently (if any actions) or just refresh
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
