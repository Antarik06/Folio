'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import { 
  togglePhotoShared, 
  shareAllPhotos, 
  approvePhoto, 
  rejectPhoto, 
  deletePhoto,
  createFolderAction,
  deleteFolderAction,
  movePhotoAction,
  updatePhotoTagsAction,
  updatePhotoLocationAction
} from '@/lib/actions/events'
import { PhotoLightbox } from './photo-lightbox'
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  ChevronRight, 
  Trash2, 
  X, 
  Plus, 
  Image as ImageIcon 
} from 'lucide-react'

interface Folder {
  id: string
  event_id: string
  parent_id: string | null
  name: string
  created_at: string
}

interface Photo {
  id: string
  blob_url: string
  thumbnail_url?: string | null
  is_shared?: boolean
  is_host_photo?: boolean
  status?: string
  uploader_id?: string
  created_at?: string
  folder_id?: string | null
  people_tags?: string[]
  location?: string | null
}

interface PhotoGridProps {
  photos: Photo[]
  folders: Folder[]
  eventId: string
  currentUserId?: string
  isOwner?: boolean
  isManager?: boolean
  isGuest?: boolean
}

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

export function PhotoGrid({ photos, folders, eventId, currentUserId, isOwner, isManager, isGuest }: PhotoGridProps) {
  const [localPhotos, setLocalPhotos] = useState(photos)
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isShareAllPending, startShareAllTransition] = useTransition()
  const [shareAllDone, setShareAllDone] = useState(false)

  // Folder Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Filtering States
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  // Extract unique people tags and locations for filter dropdowns
  const allPeople = Array.from(
    new Set(localPhotos.flatMap(p => p.people_tags || []))
  ).filter(Boolean).sort() as string[]

  const allLocations = Array.from(
    new Set(localPhotos.map(p => p.location).filter(Boolean))
  ).sort() as string[]

  // Split photos into approved and pending
  const approvedPhotos = localPhotos.filter(p => !p.status || p.status === 'approved')
  const pendingPhotos = localPhotos.filter(p => p.status === 'pending')

  // Folder Filtering Logic
  const visibleFolders = folders.filter(f => f.parent_id === currentFolderId)
  
  // Decide which photos to display based on selected filters
  let displayedPhotos: Photo[] = []
  const isFiltering = !!selectedPerson || !!selectedLocation

  if (isFiltering) {
    // Global filter search across all folders
    displayedPhotos = approvedPhotos
    if (selectedPerson) {
      displayedPhotos = displayedPhotos.filter(p => p.people_tags && p.people_tags.includes(selectedPerson))
    }
    if (selectedLocation) {
      displayedPhotos = displayedPhotos.filter(p => p.location === selectedLocation)
    }
  } else {
    // Current folder photos only
    displayedPhotos = approvedPhotos.filter(p => p.folder_id === currentFolderId)
  }

  const unsharedApproved = displayedPhotos.filter(p => !p.is_shared)

  // Build Breadcrumbs trail
  const breadcrumbs = []
  if (currentFolderId) {
    let curr: Folder | undefined = folders.find(f => f.id === currentFolderId)
    while (curr) {
      breadcrumbs.unshift({ id: curr.id, name: curr.name })
      const parentId = curr.parent_id
      curr = parentId ? folders.find(f => f.id === parentId) : undefined
    }
  }
  breadcrumbs.unshift({ id: null, name: 'Root Collection' })

  // --- Photo API Actions ---

  function handleToggleShare(photoId: string, currentIsShared: boolean) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, is_shared: !currentIsShared } : p)
    )
    startTransition(async () => {
      const result = await togglePhotoShared(photoId, currentIsShared)
      if (result?.error) {
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

  async function handleUpdateTags(photoId: string, peopleTags: string[]) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, people_tags: peopleTags } : p)
    )
    if (activePhoto && activePhoto.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, people_tags: peopleTags } : null)
    }
    const res = await updatePhotoTagsAction(eventId, photoId, peopleTags)
    if (res?.error) {
      alert("Error updating tags: " + res.error)
    }
  }

  async function handleUpdateLocation(photoId: string, location: string | null) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, location: location } : p)
    )
    if (activePhoto && activePhoto.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, location: location } : null)
    }
    const res = await updatePhotoLocationAction(eventId, photoId, location)
    if (res?.error) {
      alert("Error updating location: " + res.error)
    }
  }

  // --- Folder API Actions ---

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    const res = await createFolderAction(eventId, newFolderName.trim(), currentFolderId)
    if (res?.error) {
      alert("Failed to create folder: " + res.error)
    } else {
      setNewFolderName('')
      setShowCreateFolder(false)
      window.location.reload()
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!window.confirm("Are you sure you want to delete this folder? Nested items will be deleted or unassigned.")) return
    const res = await deleteFolderAction(eventId, folderId)
    if (res?.error) {
      alert("Failed to delete folder: " + res.error)
    } else {
      window.location.reload()
    }
  }

  async function handleMovePhoto(photoId: string, targetFolderId: string | null) {
    setLocalPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, folder_id: targetFolderId } : p)
    )
    const res = await movePhotoAction(eventId, photoId, targetFolderId)
    if (res?.error) {
      alert("Failed to move photo: " + res.error)
    }
  }

  return (
    <div className="space-y-8">
      
      {/* ── BREADCRUMBS, FILTERS & ACTION BAR ──────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Breadcrumbs Path */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono tracking-wider uppercase text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
                <button
                  onClick={() => {
                    setCurrentFolderId(crumb.id)
                    setSelectedPerson(null)
                    setSelectedLocation(null)
                  }}
                  className={`hover:text-foreground transition-colors cursor-pointer ${
                    crumb.id === currentFolderId && !isFiltering
                      ? 'text-foreground font-bold underline decoration-primary underline-offset-4'
                      : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
            {isFiltering && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span className="text-foreground font-bold">Search Filter Active</span>
              </>
            )}
          </div>

          {/* Filtering Dropdowns & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Person Filter */}
            <select
              value={selectedPerson || ''}
              onChange={e => {
                setSelectedPerson(e.target.value || null)
              }}
              className="px-3 py-2 bg-background border border-border text-xs uppercase tracking-wider text-muted-foreground focus:outline-none focus:border-primary font-medium"
            >
              <option value="">All People</option>
              {allPeople.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation || ''}
              onChange={e => {
                setSelectedLocation(e.target.value || null)
              }}
              className="px-3 py-2 bg-background border border-border text-xs uppercase tracking-wider text-muted-foreground focus:outline-none focus:border-primary font-medium"
            >
              <option value="">All Locations</option>
              {allLocations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Clear Filters indicator */}
            {isFiltering && (
              <button
                onClick={() => {
                  setSelectedPerson(null)
                  setSelectedLocation(null)
                }}
                className="p-2 border border-primary/20 bg-primary/5 text-primary text-xs uppercase tracking-wider font-bold hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                title="Clear Filters"
              >
                <X className="w-3.5 h-3.5" />
                Reset Search
              </button>
            )}

            {/* Create Folder button (managers only, disabled when filtering) */}
            {isManager && !isFiltering && (
              <button
                onClick={() => setShowCreateFolder(prev => !prev)}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground text-xs uppercase tracking-wider font-bold hover:bg-secondary/90 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </button>
            )}
          </div>

        </div>

        {/* Inline Create Folder form */}
        {showCreateFolder && (
          <form onSubmit={handleCreateFolder} className="flex gap-2 items-center bg-card border border-border p-4 max-w-md animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder Name (e.g. Travel, Dinner)"
              required
              className="flex-1 px-3 py-2 bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setNewFolderName(''); setShowCreateFolder(false); }}
              className="px-4 py-2 bg-transparent border border-border text-muted-foreground text-xs uppercase tracking-wider hover:bg-secondary/5"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* ── FOLDERS DIRECTORY LISTING (only when not filtering) ──────────── */}
      {!isFiltering && visibleFolders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Sub-folders</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleFolders.map(folder => {
              // Count folder contents
              const subItemsCount = approvedPhotos.filter(p => p.folder_id === folder.id).length
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="group relative flex flex-col items-center justify-center p-5 bg-card border border-border hover:border-primary/45 hover:shadow-md cursor-pointer transition-all aspect-square text-center rounded-sm"
                >
                  <FolderIcon className="w-12 h-12 text-primary/70 mb-2 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-serif text-foreground truncate max-w-full font-bold px-1">{folder.name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 font-mono">{subItemsCount} photo{subItemsCount !== 1 ? 's' : ''}</span>
                  
                  {/* Delete Folder */}
                  {isManager && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteFolder(folder.id)
                      }}
                      className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PENDING APPROVAL PHOTO SECTION (managers only) ────────────────── */}
      {isManager && !isFiltering && pendingPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm uppercase tracking-wider text-foreground font-medium">
              Pending Approval
            </h3>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-mono">
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
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-background/80 text-foreground text-[9px] uppercase tracking-wider font-bold">
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
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── APPROVED PHOTOS GRID ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>{isFiltering ? 'Search Results' : 'Photos'}</span>
            <span className="font-mono text-foreground font-bold px-2 py-0.5 bg-secondary/10 border border-secondary/20">{displayedPhotos.length}</span>
          </h3>

          {/* Share All */}
          {isManager && unsharedApproved.length > 0 && (
            <button
              onClick={handleShareAll}
              disabled={isShareAllPending}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs uppercase tracking-wider font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 cursor-pointer"
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

        {displayedPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] grid-flow-dense gap-[2px] bg-black/10">
            {displayedPhotos.map((photo, index) => (
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
                  <div className="absolute top-2 left-2 w-5 h-5 bg-secondary flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Manager overlay: toggle share & move to folder */}
                {isManager && (
                  <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none gap-2">
                    
                    {/* Share Action */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleShare(photo.id, photo.is_shared ?? false); }}
                      disabled={isPending}
                      className={`pointer-events-auto w-full py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 text-center rounded-sm ${
                        photo.is_shared
                          ? 'bg-card text-foreground hover:bg-card/90'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                      }`}
                    >
                      {photo.is_shared ? 'Unshare' : 'Share'}
                    </button>

                    {/* Move Folder Dropdown selector */}
                    <div className="pointer-events-auto w-full">
                      <select
                        value={photo.folder_id || ''}
                        onClick={e => e.stopPropagation()} // avoid lightbox open
                        onChange={e => handleMovePhoto(photo.id, e.target.value || null)}
                        className="w-full bg-background/95 border border-border text-[9px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1 text-center focus:outline-none"
                        title="Move to folder"
                      >
                        <option value="">Move to Root</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                )}

                {/* Guest: pending own upload label */}
                {isGuest && photo.status === 'pending' && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-background/80 text-foreground text-[9px] uppercase tracking-wider font-bold">
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
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border">
            <ImageIcon className="w-16 h-16 mx-auto text-border mb-4" />
            <p className="font-serif text-xl text-foreground mb-2">No photos in this folder</p>
            <p className="text-sm text-muted-foreground">
              {isFiltering ? 'No photos match your current people/location filters.' : 'Upload photos or move existing ones here to organize.'}
            </p>
          </div>
        )}
      </div>

      {/* Guest notice */}
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
          onUpdateTags={handleUpdateTags}
          onUpdateLocation={handleUpdateLocation}
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
            
            // 3. Add record via backend Express API
            try {
              await apiClient.post('/api/photos', {
                eventId,
                blobUrl: publicUrl,
                status: isManager ? 'approved' : 'pending',
                folderId: currentFolderId
              })
            } catch (err: any) {
              console.error('DB Error:', err)
              alert('Failed to save photo record: ' + err.message)
              return
            }
            
            setActivePhoto(null)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
