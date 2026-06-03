'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PhotoUploader } from '@/components/events/photo-uploader'
import { PhotoGrid } from '@/components/events/photo-grid'
import { Image as ImageIcon, Layout, Plus, Trash2, Globe, Eye, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Photo {
  id: string
  blob_url: string
  thumbnail_url?: string
  width?: number
  height?: number
}

interface Folder {
  id: string
  name: string
  parent_id: string | null
}

interface Album {
  id: string
  title: string
  description?: string
  is_published: boolean
  created_at: string
  cover_photo_id?: string
  layout_data?: any
}

interface ArtistDashboardClientProps {
  portfolioEventId: string
  initialPhotos: Photo[]
  initialFolders: Folder[]
  initialAlbums: Album[]
  currentUserId: string
}

export function ArtistDashboardClient({
  portfolioEventId,
  initialPhotos,
  initialFolders,
  initialAlbums,
  currentUserId
}: ArtistDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'media' | 'templates'>('templates')
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Handle template creation
  const handleCreateTemplate = async () => {
    setCreating(true)
    try {
      const newAlbum = await apiClient.post('/api/albums', {
        eventId: portfolioEventId,
        title: `Untitled Template ${albums.length + 1}`,
        layoutData: {
          productType: 'magazine',
          spreads: [
            {
              id: 'spread-cover',
              isCover: true,
              background: '#FAF9F6',
              elements: [],
              front: {
                background: '#FAF9F6',
                elements: [
                  {
                    id: 'cover-title',
                    type: 'text',
                    text: 'EDITORIAL TITLE',
                    fontSize: 48,
                    fontFamily: 'serif',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fill: '#1C1814',
                    x: 50,
                    y: 700,
                    width: 600,
                    height: 80,
                    zIndex: 1,
                    rotation: 0
                  }
                ]
              }
            },
            {
              id: 'spread-1',
              isCover: false,
              background: '#FFFFFF',
              elements: [],
              front: {
                background: '#FFFFFF',
                elements: []
              },
              back: {
                background: '#FFFFFF',
                elements: []
              }
            }
          ]
        }
      })
      if (newAlbum && newAlbum.id) {
        router.push(`/editor/${newAlbum.id}`)
      }
    } catch (err) {
      console.error('Failed to create new template:', err)
    } finally {
      setCreating(false)
    }
  }

  // Toggle publish state
  const handleTogglePublish = async (albumId: string, currentStatus: boolean) => {
    setUpdatingId(albumId)
    try {
      const nextStatus = !currentStatus
      const result = await apiClient.patch(`/api/albums/${albumId}/publish`, {
        isPublished: nextStatus
      })
      if (result && result.success) {
        setAlbums(prev =>
          prev.map(a => (a.id === albumId ? { ...a, is_published: nextStatus } : a))
        )
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete template
  const handleDeleteTemplate = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    setDeletingId(albumId)
    try {
      await apiClient.delete(`/api/albums/${albumId}`)
      setAlbums(prev => prev.filter(a => a.id !== albumId))
    } catch (err) {
      console.error('Failed to delete template:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[#EBE6DD] pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] tracking-[0.3em] font-mono uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">Artist Mode</span>
          </div>
          <h1 className="font-serif text-4xl text-ink mb-2">Independent Artist Studio</h1>
          <p className="text-pencil font-serif italic text-lg">Curate designs and publish editorial templates for users across the platform.</p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={handleCreateTemplate}
            disabled={creating}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-ink hover:bg-ink/90 text-paper font-sans text-xs uppercase tracking-widest transition-all shadow-xl shadow-ink/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Crafting Canvas...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create New Template
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#EBE6DD] mb-8">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-4 px-2 text-xs font-sans uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'templates' ? 'text-primary font-bold' : 'text-pencil hover:text-ink'
          }`}
        >
          <span className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            My Templates ({albums.length})
          </span>
          {activeTab === 'templates' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary animate-in fade-in duration-300" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`pb-4 px-2 text-xs font-sans uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'media' ? 'text-primary font-bold' : 'text-pencil hover:text-ink'
          }`}
        >
          <span className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Portfolio Media Library
          </span>
          {activeTab === 'media' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary animate-in fade-in duration-300" />
          )}
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {albums.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[#DDD8CE] rounded-lg bg-card/20">
              <Layout className="w-12 h-12 text-pencil/40 mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-ink mb-2">No templates yet</h3>
              <p className="text-pencil text-sm max-w-sm mx-auto mb-6">Create your first magazine or photo book design. Add pages, style typography, place placeholders, and publish.</p>
              <button
                onClick={handleCreateTemplate}
                className="px-6 py-3 bg-ink text-paper text-xs uppercase tracking-widest font-sans hover:bg-ink/90 transition-colors"
              >
                Start Designing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map(album => {
                const isPublished = album.is_published
                const isUpdating = updatingId === album.id
                const isDeleting = deletingId === album.id
                const pageCount = Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads.length * 2 : 2

                return (
                  <div
                    key={album.id}
                    className="group relative flex flex-col justify-between border border-[#DDD8CE] hover:border-ink bg-paper p-6 transition-all duration-500 shadow-sm hover:shadow-2xl rounded"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-serif text-2xl text-ink group-hover:text-primary transition-colors truncate">{album.title}</h3>
                        <span className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                          isPublished
                            ? 'bg-secondary/10 border-secondary/20 text-secondary'
                            : 'bg-muted border-border text-pencil'
                        }`}>
                          <Globe className="w-2.5 h-2.5" />
                          {isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className="font-sans text-xs text-pencil mb-6 flex items-center gap-3">
                        <span>{pageCount} Pages</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 border-t border-[#EBE6DD] pt-4 mt-4">
                      <Link
                        href={`/editor/${album.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold uppercase tracking-widest border border-ink text-ink hover:bg-ink hover:text-paper transition-all text-center rounded active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Edit Template
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(album.id, isPublished)}
                        disabled={isUpdating}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all rounded active:scale-95 ${
                          isPublished
                            ? 'border-secondary bg-secondary/5 text-secondary hover:bg-secondary hover:text-white'
                            : 'border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            {isPublished ? 'Unpublish' : 'Publish'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(album.id)}
                        disabled={isDeleting}
                        className="p-3 text-pencil hover:text-red-500 border border-transparent hover:border-red-100 hover:bg-red-50 transition-all rounded active:scale-95"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          <div className="bg-[#FAF9F6] border border-[#DDD8CE] p-6 rounded">
            <h3 className="font-serif text-xl mb-2 text-ink">Upload Portfolio Media</h3>
            <p className="text-pencil text-sm mb-6">These images will serve as placeholder assets in your design templates. Drop your high-res photos and organize them in folders.</p>
            
            <PhotoUploader
              eventId={portfolioEventId}
              isManager={true}
              isGuest={false}
              allowGuestUploads={false}
              autoApproveGuestUploads={true}
              requireGuestFaceEnrollment={false}
            />
          </div>

          <div className="border border-[#EBE6DD] p-6 bg-paper rounded">
            <PhotoGrid
              photos={photos}
              folders={folders}
              eventId={portfolioEventId}
              currentUserId={currentUserId}
              isOwner={true}
              isManager={true}
              isGuest={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
