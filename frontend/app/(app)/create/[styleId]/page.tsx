'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { autoFillAlbum } from '@/lib/template-engine-utils'
import { Upload, Image as ImageIcon, Calendar, ArrowRight, Loader2, Layers } from 'lucide-react'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function resolveCreatedAlbumId(payload: any) {
  const candidates = [payload?.id, payload?.album?.id, payload?.data?.id]

  for (const candidate of candidates) {
    if (isUuid(candidate)) {
      return candidate
    }
  }

  return null
}

export default function UseTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const eventIdFromUrl = searchParams.get('eventId')
  
  const [template, setTemplate] = useState<any>(() => ALL_MAGAZINE_TEMPLATES.find(t => t.id === id) || null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hostedEvents, setHostedEvents] = useState<any[]>([])
  const [view, setView] = useState<'selection' | 'upload' | 'event' | 'folder' | 'event-curation'>('selection')
  const [eventFolders, setEventFolders] = useState<any[]>([])
  const autoCreateTriggeredRef = useRef(false)

  // Event Photo Curation states
  const [selectedEventForCuration, setSelectedEventForCuration] = useState<any | null>(null)
  const [selectedEventForFolders, setSelectedEventForFolders] = useState<any | null>(null)
  const [curationPhotos, setCurationPhotos] = useState<any[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [folderIdForCuration, setFolderIdForCuration] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/events')
      if (data && (data.hostedEvents || data.guestEvents)) {
        const allEvents = [
          ...(data.hostedEvents || []),
          ...(data.guestEvents || [])
        ]
        setHostedEvents(allEvents)
      } else {
        setHostedEvents(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to load hosted events:', e)
    }
  }, [])

  const startEventCuration = async (eventId: string, folderId: string | null = null) => {
    if (!isUuid(eventId)) {
      console.warn('Ignoring invalid event id for curation:', eventId)
      return
    }

    setLoading(true)
    try {
      // Fetch photos from the event
      const photos = await apiClient.get(`/api/photos/event/${eventId}`)
      const filteredPhotos = folderId
        ? (photos || []).filter((p: any) => p.folder_id === folderId)
        : (photos || [])
      
      const eventRes = await apiClient.get('/api/events')
      const eventList = eventRes ? [
        ...(eventRes.hostedEvents || []),
        ...(eventRes.guestEvents || [])
      ] : []
      const event = eventList.find((e: any) => e.id === eventId) || { id: eventId, title: 'Selected Event' }

      setSelectedEventForCuration(event)
      setFolderIdForCuration(folderId)
      setCurationPhotos(filteredPhotos)
      setSelectedPhotoIds(new Set(filteredPhotos.map((p: any) => p.id)))
      setView('event-curation')
    } catch (e) {
      console.error('Failed to load photos for curation:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!template && id) {
      apiClient.get(`/api/albums/${id}`)
        .then(album => {
          if (album) {
            setTemplate({
              id: album.id,
              name: album.title,
              description: album.description || 'Curated template by independent artist.',
              thumbnail: album.cover_photo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
              category: 'Artist',
              spreads: album.layout_data?.spreads || [],
              layout_schema: album.layout_schema || album.layout_data?.layout_schema || null,
              page_previews_urls: album.page_previews_urls || album.layout_data?.page_previews_urls || []
            })
          }
        })
        .catch(err => {
          console.error('Failed to load dynamic template:', err)
        })
    }
  }, [id, template])

  useEffect(() => {
    const validEventId = isUuid(eventIdFromUrl) ? eventIdFromUrl : null

    if (validEventId) {
      void loadEvents().then(() => setView('event'))
    } else if (eventIdFromUrl) {
      console.warn('Ignoring invalid eventId query param:', eventIdFromUrl)
    }
  }, [eventIdFromUrl, loadEvents])

  useEffect(() => {
    const autoSelect = async () => {
      const validEventId = isUuid(eventIdFromUrl) ? eventIdFromUrl : null

      if (!validEventId || autoCreateTriggeredRef.current) return
      autoCreateTriggeredRef.current = true
      
      setLoading(true)
      try {
        const folders = await apiClient.get(`/api/events/${validEventId}/folders`)
        if (folders && folders.length > 0) {
          // Fetch event details to show name
          const eventsData = await apiClient.get('/api/events')
          const eventList = eventsData ? [
            ...(eventsData.hostedEvents || []),
            ...(eventsData.guestEvents || [])
          ] : []
          const event = eventList.find((e: any) => e.id === validEventId)
          setSelectedEventForFolders(event || { id: validEventId, title: 'Selected Event' })
          setEventFolders(folders)
          setView('folder')
        } else {
          await startEventCuration(validEventId, null)
        }
      } catch (err) {
        console.error('Auto select event error:', err)
        await startEventCuration(validEventId, null)
      } finally {
        setLoading(false)
      }
    }
    
    autoSelect()
  }, [eventIdFromUrl])

  if (!template) {
    return (
      <div className="min-h-screen bg-paper text-foreground dark:bg-[#110f0d] flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-serif italic text-sm text-pencil dark:text-zinc-400">Retrieving artist layout...</p>
      </div>
    )
  }

  const templateSpreads = template.spreads.length > 0 ? template.spreads : [
    {
      id: `${template.id}-cover`,
      isCover: true,
      background: '#f8f4ec',
      elements: [],
      front: { background: '#f8f4ec', elements: [] },
      back: { background: '#ffffff', elements: [] },
    },
    {
      id: `${template.id}-spread-1`,
      isCover: false,
      background: '#ffffff',
      elements: [],
      front: { background: '#ffffff', elements: [] },
      back: { background: '#ffffff', elements: [] },
    },
  ]

  const handleEventSelect = async (selectedEventId: string, folderId: string | null = null) => {
    if (!isUuid(selectedEventId)) {
      console.warn('Ignoring invalid event id for template flow:', selectedEventId)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch some photos from the event to auto-layout via Backend
      const photos = await apiClient.get(`/api/photos/event/${selectedEventId}`)
      
      // Filter by folder if specified
      const filteredPhotos = folderId
        ? (photos || []).filter((p: any) => p.folder_id === folderId)
        : (photos || [])

      const photoUrls = filteredPhotos.map((p: any) => p.blob_url || p.thumbnail_url).filter(Boolean)

      // Auto-fill template elements/slots
      const templateSchema = template.layout_schema || template.layoutSchema || template.spreads || []
      const autoFilledSpreads = autoFillAlbum(
        filteredPhotos.map((p: any) => ({
          id: p.id,
          blob_url: p.blob_url || p.thumbnail_url,
          width: p.width,
          height: p.height,
          taken_at: p.taken_at,
          created_at: p.created_at
        })),
        templateSchema,
        template.page_previews_urls || []
      )
      const finalSpreads = autoFilledSpreads.length > 0 ? autoFilledSpreads : templateSpreads

      // Create album via Backend
      const album = await apiClient.post('/api/albums', {
        eventId: selectedEventId,
        title: `${template.name} - Volume I`,
        layoutData: { 
          productType: 'magazine',
          templateId: template.id,
          autoGenerated: true,
          initialPhotos: photoUrls,
          spreads: finalSpreads,
        }
      })

      const createdAlbumId = resolveCreatedAlbumId(album)

      if (createdAlbumId) {
        router.push(`/dashboard/templates/editor/${createdAlbumId}`)
        return
      }
      console.error('Album creation did not return a valid album id:', album)
    } catch (err) {
      console.error('Failed to setup templates from event:', err)
    }
    setLoading(false)
  }

  const handleEventClick = async (event: any) => {
    if (!isUuid(event?.id)) {
      console.warn('Ignoring event card with invalid id:', event?.id)
      return
    }

    setLoading(true)
    try {
      const folders = await apiClient.get(`/api/events/${event.id}/folders`)
      if (folders && folders.length > 0) {
        setSelectedEventForFolders(event)
        setEventFolders(folders)
        setView('folder')
      } else {
        await startEventCuration(event.id, null)
      }
    } catch (e) {
      console.error('Failed to load event folders:', e)
      await startEventCuration(event.id, null)
    } finally {
      setLoading(false)
    }
  }

  const handleCurationPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedEventForCuration) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploading(false)
        return
      }

      const eventId = selectedEventForCuration.id

      // Upload files
      const newUploadedPhotos: any[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `${user.id}/${eventId}/${Math.random().toString(36).slice(2)}.jpg`
        const { data } = await supabase.storage.from('photos').upload(path, file)
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
          
          // Register in DB via Backend API
          const photoRow = await apiClient.post('/api/photos', {
            eventId,
            blobUrl: publicUrl,
            folderId: folderIdForCuration || null,
            status: 'approved'
          })

          if (photoRow) {
            newUploadedPhotos.push(photoRow)
          }
        }
      }

      // Add uploaded photos to local list and select them
      setCurationPhotos(prev => [...prev, ...newUploadedPhotos])
      setSelectedPhotoIds(prev => {
        const updated = new Set(prev)
        newUploadedPhotos.forEach(p => updated.add(p.id))
        return updated
      })
    } catch (err) {
      console.error('Curation upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateAlbumFromCuration = async () => {
    if (!selectedEventForCuration) return
    
    setLoading(true)
    try {
      const filteredPhotos = curationPhotos.filter(p => selectedPhotoIds.has(p.id))
      const photoUrls = filteredPhotos.map((p: any) => p.blob_url || p.thumbnail_url).filter(Boolean)

      // Auto-fill template elements/slots
      const templateSchema = template.layout_schema || template.layoutSchema || template.spreads || []
      const autoFilledSpreads = autoFillAlbum(
        filteredPhotos.map((p: any) => ({
          id: p.id,
          blob_url: p.blob_url || p.thumbnail_url,
          width: p.width,
          height: p.height,
          taken_at: p.taken_at,
          created_at: p.created_at
        })),
        templateSchema,
        template.page_previews_urls || []
      )
      const finalSpreads = autoFilledSpreads.length > 0 ? autoFilledSpreads : templateSpreads

      // Create album via Backend
      const album = await apiClient.post('/api/albums', {
        eventId: selectedEventForCuration.id,
        title: `${template.name} - Volume I`,
        layoutData: { 
          productType: 'magazine',
          templateId: template.id,
          autoGenerated: true,
          initialPhotos: photoUrls,
          spreads: finalSpreads,
        }
      })

      const createdAlbumId = resolveCreatedAlbumId(album)

      if (createdAlbumId) {
        router.push(`/dashboard/templates/editor/${createdAlbumId}`)
        return
      }
      console.error('Album creation from curated photos did not return a valid album id:', album)
    } catch (err) {
      console.error('Failed to setup templates from curation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploading(false)
        return
      }

      // 1. Create a "Shadow Event" for these photos via Backend API
      const event = await apiClient.post('/api/events', {
        title: `Upload: ${new Date().toLocaleDateString()}`,
        settings: { status: 'draft' }
      })

      if (!event || !event.id) {
        setUploading(false)
        return
      }

      // 2. Upload photos to Supabase Storage client-side
      const uploadedUrls: string[] = []
      for (let i = 0; i < Math.min(files.length, 20); i++) {
        const file = files[i]
        const path = `${user.id}/${event.id}/${Math.random().toString(36).slice(2)}.jpg`
        const { data } = await supabase.storage.from('photos').upload(path, file)
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
          uploadedUrls.push(publicUrl)
          
          // Register in DB via Backend API
          await apiClient.post('/api/photos', {
            eventId: event.id,
            blobUrl: publicUrl,
            status: 'approved'
          })
        }
      }

      // Auto-fill template elements/slots
      const mockPhotos = uploadedUrls.map((url, idx) => ({
        id: `upload_${idx}`,
        blob_url: url
      }))
      const templateSchema = template.layout_schema || template.layoutSchema || template.spreads || []
      const autoFilledSpreads = autoFillAlbum(mockPhotos, templateSchema, template.page_previews_urls || [])
      const finalSpreads = autoFilledSpreads.length > 0 ? autoFilledSpreads : templateSpreads

      // 3. Create album and redirect to builder via Backend API
      const album = await apiClient.post('/api/albums', {
        eventId: event.id,
        title: `${template.name} Volume`,
        layoutData: { 
          productType: 'magazine',
          templateId: template.id,
          autoGenerated: true,
          initialPhotos: uploadedUrls,
          spreads: finalSpreads,
        }
      })

      const createdAlbumId = resolveCreatedAlbumId(album)

      if (createdAlbumId) {
        router.push(`/dashboard/templates/editor/${createdAlbumId}`)
        return
      }
      console.error('Album creation from upload did not return a valid album id:', album)
    } catch (err) {
      console.error('Curation upload error:', err)
    }
    setUploading(false)
  }


  const selectEventSource = () => {
    setView('event')
    loadEvents()
  }

  return (
    <div className="min-h-screen bg-paper text-foreground dark:bg-[#110f0d] transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-20 pb-32">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[1px] w-8 bg-primary/30" />
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Curation Step 02</span>
            <div className="h-[1px] w-8 bg-primary/30" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-ink dark:text-zinc-100 mb-6 tracking-tight">Source Your <span className="italic text-terracotta">Story</span></h1>
          <p className="text-pencil dark:text-zinc-400 font-serif italic text-xl max-w-xl mx-auto leading-relaxed">
            Select a curated gallery from your events or upload fresh moments to begin your editorial journey with <span className="text-ink dark:text-zinc-100 font-semibold not-italic">{template.name}</span>.
          </p>
        </div>

      {view === 'selection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Option A: Events */}
          <button 
            onClick={selectEventSource}
            className="group relative p-12 transition-all duration-700 text-center flex flex-col items-center justify-center gap-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 rounded-lg overflow-hidden border border-[#DDD8CE] bg-[#F5F0E8] text-[#1C1814] dark:border-white/10 dark:bg-[#1b1713] dark:text-[#f5efe6]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 border border-primary/10">
                <Calendar className="w-10 h-10 text-primary font-thin" strokeWidth={1} />
              </div>
              <h3 className="font-serif text-3xl mb-4 tracking-tight">Connect an Event</h3>
              <p className="text-sm font-light leading-relaxed max-w-[240px] mx-auto opacity-70">
                Access curated galleries from your hosted events and weddings.
              </p>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-primary opacity-60 group-hover:opacity-100 transition-all">
              Select Gallery <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>

          {/* Option B: Direct Upload */}
          <button 
             onClick={() => setView('upload')}
             className="group relative p-12 transition-all duration-700 text-center flex flex-col items-center justify-center gap-8 shadow-2xl shadow-ink/20 rounded-lg overflow-hidden border border-[#1C1814] bg-[#1C1814] text-[#F5F0E8] dark:border-white/10 dark:bg-[#0f0d0b] dark:text-[#f7efe2]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-0 film-grain opacity-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 border border-white/10">
                <Upload className="w-10 h-10 font-thin" strokeWidth={1} />
              </div>
              <h3 className="font-serif text-3xl mb-4 tracking-tight">Instant Upload</h3>
              <p className="text-sm font-light leading-relaxed max-w-[240px] mx-auto opacity-60">
                Start from scratch with high-resolution photos from your device.
              </p>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-all">
              Upload Now <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {view === 'event' && (
        <div className="bg-card border border-border p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
            <h2 className="font-serif text-2xl">Select Event</h2>
            <button onClick={() => setView('selection')} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          
          <div className="space-y-3">
            {hostedEvents.length > 0 ? (
              hostedEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-6 bg-background border border-border hover:border-primary/40 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-serif text-xl group-hover:text-primary transition-colors">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4 font-light italic">No events found.</p>
                <Link href="/dashboard/events/new" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">Create an event first</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'folder' && selectedEventForFolders && (
        <div className="bg-card border border-border p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-primary font-mono block mb-1">Curation Step 03</span>
              <h2 className="font-serif text-2xl">Select Folder in {selectedEventForFolders.title}</h2>
            </div>
            <button 
              onClick={() => {
                if (eventIdFromUrl) {
                  setView('selection')
                } else {
                  setView('event')
                }
              }} 
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Option to use all photos in the event */}
            <button
              onClick={() => startEventCuration(selectedEventForFolders.id, null)}
              disabled={loading}
              className="p-8 bg-[#252019]/5 border border-border hover:border-primary/45 hover:bg-primary/5 transition-all text-left flex flex-col justify-between group rounded min-h-[160px]"
            >
              <div>
                <Calendar className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif text-xl font-bold">Use All Event Photos</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light leading-relaxed">Includes all photos uploaded to the event gallery.</p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-primary mt-6 inline-flex items-center gap-1">
                Start Design →
              </span>
            </button>

            {/* List folders */}
            {eventFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => startEventCuration(selectedEventForFolders.id, folder.id)}
                disabled={loading}
                className="p-8 bg-background border border-border hover:border-secondary/45 hover:bg-secondary/5 transition-all text-left flex flex-col justify-between group rounded min-h-[160px]"
              >
                <div>
                  <Layers className="w-8 h-8 text-secondary mb-4" />
                  <h3 className="font-serif text-xl font-bold">{folder.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 font-light leading-relaxed">Use only photos cataloged inside the "{folder.name}" folder.</p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-secondary mt-6 inline-flex items-center gap-1">
                  Start Design →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'event-curation' && selectedEventForCuration && (
        <div className="bg-card border border-[#DDD8CE] dark:border-white/10 dark:bg-[#16120f] p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 space-y-8 rounded transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EBE6DD] dark:border-white/10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-primary font-mono block mb-1">Curation Step 03</span>
              <h2 className="font-serif text-3xl text-ink dark:text-zinc-100 font-bold">Curate & Upload Photos</h2>
              <p className="text-xs text-pencil dark:text-zinc-400 mt-1">Select event moments and upload new files to design your editorial layout.</p>
            </div>
            <button 
              onClick={() => {
                if (eventFolders.length > 0) {
                  setView('folder')
                } else {
                  setView('event')
                }
              }} 
              className="px-4 py-2 border border-border text-pencil dark:text-zinc-400 text-xs font-mono rounded hover:text-ink dark:hover:text-zinc-100 hover:border-ink dark:hover:border-zinc-300 transition-colors w-fit shrink-0 uppercase tracking-widest"
            >
              Back
            </button>
          </div>

          {/* Photo Uploader Dropzone */}
          <div className="border-2 border-dashed border-[#DDD8CE] dark:border-white/10 rounded-lg p-6 bg-[#FAF9F6] dark:bg-[#110f0d] text-center relative hover:border-primary/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={uploading}
              onChange={handleCurationPhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-pencil/60 dark:text-zinc-500" />
              <p className="text-sm text-ink dark:text-zinc-100 font-semibold">Upload Additional Photos to {selectedEventForCuration.title}</p>
              <p className="text-xs text-pencil dark:text-zinc-400 font-light">Supports JPEG and PNG formats. Images are saved to the event gallery.</p>
              {uploading && (
                <div className="flex items-center gap-2 mt-4 text-xs font-mono text-primary font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading files...</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo Selection Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-pencil dark:text-zinc-400 uppercase tracking-wider">
              <span>{selectedPhotoIds.size} of {curationPhotos.length} photos selected</span>
              <div className="space-x-3">
                <button 
                  onClick={() => setSelectedPhotoIds(new Set(curationPhotos.map(p => p.id)))} 
                  className="hover:text-ink dark:hover:text-zinc-100 font-bold"
                >
                  Select All
                </button>
                <span>/</span>
                <button 
                  onClick={() => setSelectedPhotoIds(new Set())} 
                  className="hover:text-ink dark:hover:text-zinc-100 font-bold"
                >
                  Clear All
                </button>
              </div>
            </div>

            {curationPhotos.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#110f0d] border border-[#EBE6DD] dark:border-white/10 rounded transition-colors">
                <p className="text-xs text-pencil dark:text-zinc-400 italic">This event gallery does not contain any photos. Upload photos above to begin!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {curationPhotos.map(photo => {
                  const isChecked = selectedPhotoIds.has(photo.id)
                  return (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedPhotoIds(prev => {
                          const next = new Set(prev)
                          if (next.has(photo.id)) {
                            next.delete(photo.id)
                          } else {
                            next.add(photo.id)
                          }
                          return next
                        })
                      }}
                      className={`relative aspect-square overflow-hidden border transition-all duration-300 rounded ${
                        isChecked ? 'border-primary ring-2 ring-primary/20 scale-95 opacity-100' : 'border-border opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={photo.blob_url || photo.thumbnail_url} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                      {isChecked && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg border border-white">
                            ✓
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-6 border-t border-[#EBE6DD] dark:border-white/10 flex justify-end">
            <button
              onClick={handleCreateAlbumFromCuration}
              disabled={loading || selectedPhotoIds.size === 0}
              className="px-10 py-4.5 bg-ink dark:bg-zinc-100 dark:text-zinc-950 text-white font-sans text-xs font-bold uppercase tracking-[0.25em] shadow-xl hover:bg-ink/90 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded active:scale-95 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating spreads...
                </>
              ) : (
                <>
                  Create Album with {selectedPhotoIds.size} Photos →
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {view === 'upload' && (
        <div className="bg-card border border-border p-12 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-8">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-3xl mb-4 italic">Choose your moments</h2>
          <p className="text-muted-foreground font-light mb-10 max-w-sm mx-auto leading-relaxed">
            Select up to 10 photos. We'll automatically place them into the {template.name} spreads for you.
          </p>

          <div className="relative">
             <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-ink dark:bg-zinc-100 dark:text-zinc-950 text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 inline-flex items-center gap-4 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Gallery...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Pick Photos
                  </>
                )}
              </div>
          </div>
          
          <button 
            onClick={() => setView('selection')} 
            disabled={uploading}
            className="block mx-auto mt-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
          >
            ← Change selection method
          </button>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin mb-6" />
            <p className="font-serif text-2xl animate-pulse">Designing your publication...</p>
        </div>
      )}
      </div>
    </div>
  )
}
