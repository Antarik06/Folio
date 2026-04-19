'use client'

import React, { useState } from 'react'
import { PhotoEditor } from './photo-editor'

interface PhotoLightboxProps {
  photo: {
    id: string
    blob_url: string
    thumbnail_url?: string | null
    uploader_id?: string
    status?: string
    is_shared?: boolean
  }
  isManager: boolean
  isOwner: boolean
  currentUserId?: string
  onClose: () => void
  onDelete: (id: string) => void
  onFavorite: (id: string) => void
  onApprove?: (id: string) => void
  onToggleShare?: (id: string, currentlyShared: boolean) => void
  onSaveEdit: (file: Blob, photoId: string) => Promise<void>
}

export function PhotoLightbox({
  photo,
  isManager,
  currentUserId,
  onClose,
  onDelete,
  onFavorite,
  onApprove,
  onToggleShare,
  onSaveEdit
}: PhotoLightboxProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  if (mode === 'edit') {
    return (
      <PhotoEditor
        imageUrl={photo.blob_url}
        onCancel={() => setMode('view')}
        onSave={async (blob) => {
          await onSaveEdit(blob, photo.id)
          setMode('view')
        }}
      />
    )
  }

  const canDelete = isManager || photo.uploader_id === currentUserId
  const isPending = photo.status === 'pending'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-3xl animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 md:p-6 z-10 w-full">
        <button 
          onClick={onClose}
          className="p-3 bg-card border border-border rounded-full hover:bg-surface transition-colors"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {isPending && isManager && onApprove && (
          <button 
            onClick={() => onApprove(photo.id)}
            className="px-6 py-2.5 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            Approve Photo
          </button>
        )}
      </div>

      {/* Main Image View */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={photo.blob_url} 
          alt="Expanded view"
          className="max-w-full max-h-[85vh] object-contain shadow-2xl"
        />
        
        {isPending && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/80 text-foreground text-xs uppercase tracking-widest border border-border">
            Pending Approval
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full max-w-lg mx-auto mb-6 p-2 bg-card/80 backdrop-blur-md border border-border rounded-full flex items-center justify-evenly animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Favorite (Placeholder) */}
        <button 
          onClick={() => onFavorite(photo.id)}
          className="p-3 text-muted-foreground hover:text-red-500 transition-colors flex flex-col items-center gap-1"
          title="Favorite"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Edit */}
        <button 
          onClick={() => setMode('edit')}
          className="p-3 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1"
          title="Edit Photo"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Manager: Share/Unshare */}
        {isManager && !isPending && onToggleShare && (
           <button 
             onClick={() => onToggleShare(photo.id, photo.is_shared ?? false)}
             className={`p-3 transition-colors flex flex-col items-center gap-1 ${photo.is_shared ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
             title={photo.is_shared ? 'Unshare' : 'Share'}
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
             </svg>
           </button>
        )}

        {/* Delete */}
        {canDelete && (
           <button 
             onClick={() => {
               onClose() // close lightbox first
               onDelete(photo.id)
             }}
             className="p-3 text-muted-foreground hover:text-red-500 transition-colors flex flex-col items-center gap-1"
             title="Delete"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
        )}
      </div>
    </div>
  )
}
