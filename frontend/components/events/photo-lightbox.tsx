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
    people_tags?: string[]
    location?: string | null
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
  onUpdateTags?: (photoId: string, peopleTags: string[]) => Promise<void>
  onUpdateLocation?: (photoId: string, location: string | null) => Promise<void>
}

export function PhotoLightbox({
  photo,
  isManager,
  isOwner,
  currentUserId,
  onClose,
  onDelete,
  onFavorite,
  onApprove,
  onToggleShare,
  onSaveEdit,
  onUpdateTags,
  onUpdateLocation
}: PhotoLightboxProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [tags, setTags] = useState<string[]>(photo.people_tags || [])
  const [location, setLocation] = useState<string>(photo.location || '')
  const [newTagInput, setNewTagInput] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [locEditing, setLocEditing] = useState(false)

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
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-background/95 backdrop-blur-3xl animate-in fade-in duration-200">
      
      {/* Left side: Image and Actions */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Close Button Top-Left */}
        <div className="absolute top-4 left-4 z-20">
          <button 
            onClick={onClose}
            className="p-3 bg-card/60 backdrop-blur-md border border-border rounded-full hover:bg-card transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image View */}
        <div className="flex-1 relative flex items-center justify-center p-6 min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={photo.blob_url} 
            alt="Expanded view"
            className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-sm border border-border/20"
          />
          
          {isPending && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] uppercase tracking-widest font-bold">
              Pending Approval
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="w-full max-w-md mx-auto mb-6 p-2 bg-card/85 backdrop-blur-md border border-border rounded-full flex items-center justify-evenly shadow-xl animate-in slide-in-from-bottom-8 duration-300">
          {/* Favorite */}
          <button 
            onClick={() => onFavorite(photo.id)}
            className="p-3 text-muted-foreground hover:text-red-500 transition-colors flex flex-col items-center"
            title="Favorite"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Edit */}
          <button 
            onClick={() => setMode('edit')}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center"
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
               className={`p-3 transition-colors flex flex-col items-center ${photo.is_shared ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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
                 onClose()
                 onDelete(photo.id)
               }}
               className="p-3 text-muted-foreground hover:text-red-500 transition-colors flex flex-col items-center"
               title="Delete"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </button>
          )}
        </div>
      </div>

      {/* Right side: Metadata, Tags & Location Panel */}
      <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-border bg-card/60 backdrop-blur-md p-8 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-8">
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-2">Publish Status</h4>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${photo.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <p className="text-sm font-medium text-foreground">
                {photo.status === 'pending' ? 'Awaiting Approval' : 'Approved'} {photo.is_shared ? '· Shared with guests' : '· Private to managers'}
              </p>
            </div>
          </div>

          {/* Place/Location */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location / Place
            </h4>
            {isManager ? (
              locEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        setLocEditing(false)
                        if (onUpdateLocation) await onUpdateLocation(photo.id, location.trim() || null)
                      }
                    }}
                    placeholder="E.g. Tuscany, Italy"
                    className="flex-1 px-3 py-1.5 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      setLocEditing(false)
                      if (onUpdateLocation) await onUpdateLocation(photo.id, location.trim() || null)
                    }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-sm hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setLocEditing(true)}
                  className="text-sm font-serif text-foreground cursor-pointer hover:text-primary transition-colors flex items-center justify-between border-b border-dashed border-border py-1"
                >
                  <span className={location ? 'text-foreground' : 'text-muted-foreground/60 italic'}>
                    {location || 'Add location...'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )
            ) : (
              <p className="text-sm text-foreground font-serif">{location || 'No location specified'}</p>
            )}
          </div>

          {/* People Tagging */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              People Tagged
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full font-medium"
                >
                  {tag}
                  {isManager && (
                    <button 
                      onClick={async () => {
                        const nextTags = tags.filter(t => t !== tag)
                        setTags(nextTags)
                        if (onUpdateTags) await onUpdateTags(photo.id, nextTags)
                      }}
                      className="text-primary hover:text-primary/70 font-bold ml-0.5 text-sm"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              
              {isManager && (
                showAddTag ? (
                  <div className="flex gap-1.5 w-full mt-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          const tag = newTagInput.trim()
                          if (!tags.includes(tag)) {
                            const nextTags = [...tags, tag]
                            setTags(nextTags)
                            if (onUpdateTags) await onUpdateTags(photo.id, nextTags)
                          }
                          setNewTagInput('')
                          setShowAddTag(false)
                        }
                      }}
                      placeholder="Enter name..."
                      className="flex-1 px-3 py-1 bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        if (newTagInput.trim()) {
                          const tag = newTagInput.trim()
                          if (!tags.includes(tag)) {
                            const nextTags = [...tags, tag]
                            setTags(nextTags)
                            if (onUpdateTags) await onUpdateTags(photo.id, nextTags)
                          }
                        }
                        setNewTagInput('')
                        setShowAddTag(false)
                      }}
                      className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-sm hover:opacity-90"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setNewTagInput(''); setShowAddTag(false); }}
                      className="px-3 py-1 bg-card border border-border text-muted-foreground text-xs rounded-sm hover:bg-surface"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddTag(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 text-xs rounded-full transition-colors cursor-pointer"
                  >
                    + Tag Person
                  </button>
                )
              )}
              {tags.length === 0 && !showAddTag && (
                <p className="text-xs text-muted-foreground italic py-1">No people tagged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Action Buttons */}
        {isPending && isManager && onApprove && (
          <div className="pt-6 border-t border-border mt-auto">
            <button 
              onClick={() => onApprove(photo.id)}
              className="w-full py-3 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold hover:opacity-95 transition-opacity rounded-sm shadow-lg shadow-primary/10"
            >
              Approve Photo
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
