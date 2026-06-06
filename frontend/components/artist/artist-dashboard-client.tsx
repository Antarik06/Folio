'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PhotoUploader } from '@/components/events/photo-uploader'
import { PhotoGrid } from '@/components/events/photo-grid'
import { PremiumDashboardClient } from '@/components/premium/premium-dashboard-client'
import { SlotDrawingCanvas, SlotDefinition } from './slot-drawing-canvas'
import {
  Image as ImageIcon, Layout, Plus, Trash2, Globe, Eye, Loader2,
  ClipboardList, BarChart3, Upload, BookOpen, AlertCircle, CheckCircle,
  Menu, X, ArrowLeft, Palette, Clock, ChevronRight, Zap, Sparkles,
  Check, Heart, Gift, Users, GraduationCap, Briefcase, LogOut
} from 'lucide-react'
import { apiClient, BACKEND_URL } from '@/lib/api-client'
import { parsePSDFile } from '@/lib/psd-parser'
import { signOut } from '@/lib/actions/auth'

/* ─── Types ─────────────────────────────────────────────────────── */

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
  thumbnail_url?: string
  background_pdf_path?: string
  page_count?: number
}

interface ReviewOrder {
  id: string
  user_name: string
  user_email: string
  album_title: string
  product_type: string
  quantity: number
  total_price: number
  status: string
  submitted_at: string
  image_references: string[]
  album_layout_json?: any
  special_instructions?: string
}

interface ArtistDashboardClientProps {
  portfolioEventId: string
  initialPhotos: Photo[]
  initialFolders: Folder[]
  initialTemplates: Album[]
  currentUserId: string
  initialConciergeProjects: any[]
  conciergePackages: any[]
}

/* ─── Constants ─────────────────────────────────────────────────── */

const CARD_GRADIENTS = [
  'from-amber-100/60 to-orange-50/40',
  'from-sky-100/60 to-indigo-50/40',
  'from-emerald-50/60 to-teal-100/40',
  'from-violet-100/60 to-purple-50/40',
  'from-rose-100/60 to-pink-50/40',
  'from-teal-100/60 to-cyan-50/40',
]

const REVIEW_FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending-review', label: 'Awaiting Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'changes-requested', label: 'Revision' },
]

function cleanExternalUrl(url: string): string {
  if (!url) return ''

  // 1. Google Docs / Sheets / Slides Export URLs
  if (url.includes('docs.google.com/document/d/')) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://docs.google.com/document/d/${match[1]}/export?format=pdf`
    }
  }
  if (url.includes('docs.google.com/presentation/d/')) {
    const match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://docs.google.com/presentation/d/${match[1]}/export/pdf`
    }
  }

  // 2. Standard Google Drive Files
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const regexes = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/
    ]
    for (const regex of regexes) {
      const match = url.match(regex)
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`
      }
    }
  }

  // 3. Dropbox Links
  if (url.includes('dropbox.com')) {
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'raw=1')
    } else if (!url.includes('dl=1') && !url.includes('raw=1')) {
      return url + (url.includes('?') ? '&raw=1' : '?raw=1')
    }
  }

  return url
}

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  templates: { title: 'Templates', subtitle: 'Design and publish editorial layouts' },
  reviews:   { title: 'Order Queue', subtitle: 'Review and approve print submissions' },
  media:     { title: 'Media Library', subtitle: 'Manage your portfolio assets' },
  stats:     { title: 'Analytics', subtitle: 'Track your performance metrics' },
  concierge: { title: 'Concierge', subtitle: 'Manage premium concierge projects from the studio' },
}

/* ─── Component ─────────────────────────────────────────────────── */

export function ArtistDashboardClient({
  portfolioEventId,
  initialPhotos,
  initialFolders,
  initialTemplates,
  currentUserId,
  initialConciergeProjects,
  conciergePackages
}: ArtistDashboardClientProps) {
  const router = useRouter()

  /* ── Core State ── */
  const [activeTab, setActiveTab] = useState<'templates' | 'media' | 'reviews' | 'stats' | 'concierge'>('templates')
  const [albums, setAlbums] = useState<Album[]>(initialTemplates)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [folders] = useState<Folder[]>(initialFolders)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  /* ── Reviews & Stats State ── */
  const [reviewOrders, setReviewOrders] = useState<ReviewOrder[]>([])
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<ReviewOrder | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewActionLoading, setReviewActionLoading] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')

  const [stats, setStats] = useState({
    templatesPublished: 0,
    ordersFulfilled: 0,
    avgReviewHours: 0
  })

  /* ── Wizard State ── */
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'wedding',
    tags: [] as string[],
    background_pdf_path: '',
    thumbnail_url: '',
    price_tier: 'free',
    available_sizes: ['A4'] as string[],
    paper_options: ['matte'] as string[],
    cover_options: ['softcover'] as string[],
    layout_schema: { pages: [] } as any
  })
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [pdfUploadMethod, setPdfUploadMethod] = useState<'upload' | 'link'>('upload')
  const [pdfLinkUrl, setPdfLinkUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbUploadMethod, setThumbUploadMethod] = useState<'upload' | 'link'>('upload')
  const [thumbLinkUrl, setThumbLinkUrl] = useState('')
  const [idmlFile, setIdmlFile] = useState<File | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const [pdfState, setPdfState] = useState<{
    status: 'idle' | 'uploading' | 'verifying' | 'success' | 'error'
    url: string
    errorMsg?: string
  }>({ status: 'idle', url: '' })

  const [pdfPagePreviews, setPdfPagePreviews] = useState<string[]>([])
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number }>({ width: 210, height: 297 })

  const [thumbState, setThumbState] = useState<{
    status: 'idle' | 'uploading' | 'verifying' | 'success' | 'error'
    url: string
    errorMsg?: string
  }>({ status: 'idle', url: '' })

  const [idmlState, setIdmlState] = useState<{
    status: 'idle' | 'parsing' | 'success' | 'error'
    slotsCount?: number
    errorMsg?: string
  }>({ status: 'idle' })


  const openWizard = () => {
    setNewTemplate({
      name: '',
      description: '',
      category: 'wedding',
      tags: [] as string[],
      background_pdf_path: '',
      thumbnail_url: '',
      price_tier: 'free',
      available_sizes: ['A4'] as string[],
      paper_options: ['matte'] as string[],
      cover_options: ['softcover'] as string[],
      layout_schema: { pages: [] } as any
    })
    setBackgroundFile(null)
    setPdfLinkUrl('')
    setPdfState({ status: 'idle', url: '' })
    setPdfPagePreviews([])
    setPdfDimensions({ width: 210, height: 297 })
    setThumbnailFile(null)
    setThumbLinkUrl('')
    setThumbState({ status: 'idle', url: '' })
    setIdmlFile(null)
    setIdmlState({ status: 'idle' })
    setWizardStep(1)
    setIsWizardOpen(true)
  }

  const loadPdfjs = async () => {
    if (!(window as any).pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        script.onload = () => resolve()
        script.onerror = (e) => reject(new Error('Failed to load PDF.js library'))
        document.head.appendChild(script)
      })
    }
    const pdfjsLib = (window as any).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    return pdfjsLib
  }

  const renderPdfToDataUrl = async (file: File): Promise<{ pages: { dataUrl: string; widthMm: number; heightMm: number }[] }> => {
    const pdfjsLib = await loadPdfjs()
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    const pagesData = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const originalViewport = page.getViewport({ scale: 1.0 })
      const widthPts = originalViewport.width
      const heightPts = originalViewport.height
      const widthMm = Math.round((widthPts / 72) * 25.4)
      const heightMm = Math.round((heightPts / 72) * 25.4)
      
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D context not supported')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      pagesData.push({
        dataUrl: canvas.toDataURL('image/png'),
        widthMm,
        heightMm
      })
    }
    return { pages: pagesData }
  }

  const renderPdfUrlToDataUrl = async (pdfUrl: string): Promise<{ pages: { dataUrl: string; widthMm: number; heightMm: number }[] }> => {
    const pdfjsLib = await loadPdfjs()
    
    let token = ''
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      token = data?.session?.access_token || ''
      
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const artistCookie = cookies.find(c => c.trim().startsWith('artist_session='))
        const adminCookie = cookies.find(c => c.trim().startsWith('admin_session='))
        if (artistCookie) {
          token = artistCookie.split('=')[1].trim()
        } else if (adminCookie) {
          token = adminCookie.split('=')[1].trim()
        }
      }
    } catch (err) {
      console.warn('Failed to retrieve session token for PDF proxy:', err)
    }

    const proxyUrl = `${BACKEND_URL}/api/artists/templates/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(proxyUrl, { headers })
    if (!res.ok) {
      let errMsg = `Failed to fetch PDF via proxy: ${res.statusText}`
      try {
        const errorData = await res.json()
        if (errorData?.error) {
          errMsg = errorData.error
        }
      } catch (_) {}
      throw new Error(errMsg)
    }
    const blob = await res.blob()
    const arrayBuffer = await blob.arrayBuffer()
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    const pagesData = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const originalViewport = page.getViewport({ scale: 1.0 })
      const widthPts = originalViewport.width
      const heightPts = originalViewport.height
      const widthMm = Math.round((widthPts / 72) * 25.4)
      const heightMm = Math.round((heightPts / 72) * 25.4)
      
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D context not supported')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      pagesData.push({
        dataUrl: canvas.toDataURL('image/png'),
        widthMm,
        heightMm
      })
    }
    return { pages: pagesData }
  }

  const fetchAndDetectFormat = async (externalUrl: string): Promise<{ arrayBuffer: ArrayBuffer; isPsd: boolean }> => {
    let token = ''
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      token = data?.session?.access_token || ''
      
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const artistCookie = cookies.find(c => c.trim().startsWith('artist_session='))
        const adminCookie = cookies.find(c => c.trim().startsWith('admin_session='))
        if (artistCookie) {
          token = artistCookie.split('=')[1].trim()
        } else if (adminCookie) {
          token = adminCookie.split('=')[1].trim()
        }
      }
    } catch (err) {
      console.warn('Failed to retrieve session token for proxy:', err)
    }

    const proxyUrl = `${BACKEND_URL}/api/artists/templates/proxy-pdf?url=${encodeURIComponent(externalUrl)}`

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(proxyUrl, { headers })
    if (!res.ok) {
      let errMsg = `Failed to fetch file via proxy: ${res.statusText}`
      try {
        const errorData = await res.json()
        if (errorData?.error) {
          errMsg = errorData.error
        }
      } catch (_) {}
      throw new Error(errMsg)
    }
    const blob = await res.blob()
    const arrayBuffer = await blob.arrayBuffer()
    
    // Check magic bytes:
    const uint8 = new Uint8Array(arrayBuffer.slice(0, 4))
    const signature = String.fromCharCode(...uint8)
    const isPsd = signature === '8BPS'
    
    return { arrayBuffer, isPsd }
  }

  const handleUploadPdf = async () => {
    if (pdfUploadMethod === 'upload' && !backgroundFile) {
      alert('Please select a PDF or PSD file first.')
      return
    }
    if (pdfUploadMethod === 'link' && !pdfLinkUrl.trim()) {
      alert('Please enter a Google Drive or external PDF/PSD link first.')
      return
    }

    const isPsd = backgroundFile?.name.toLowerCase().endsWith('.psd')
    setPdfState({ status: pdfUploadMethod === 'upload' ? 'uploading' : 'verifying', url: '' })
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const randomId = Math.random().toString(36).substring(2, 10)

      let pdfUrl = ''
      if (pdfUploadMethod === 'upload' && backgroundFile) {
        if (isPsd) {
          try {
            const parsedLayout = await parsePSDFile(backgroundFile, randomId)
            setPdfPagePreviews(parsedLayout.previews)
            setPdfDimensions({ width: parsedLayout.page_size.width_mm, height: parsedLayout.page_size.height_mm })
            setNewTemplate(prev => ({
              ...prev,
              layout_schema: parsedLayout
            }))
          } catch (e: any) {
            console.error('Failed to parse PSD template:', e)
            throw new Error(e.message || 'Failed to verify and parse PSD file.')
          }

          const psdPath = `templates/${randomId}_bg.psd`
          const { error: psdErr } = await supabase.storage.from('photos').upload(psdPath, backgroundFile)
          if (psdErr) throw psdErr
          const { data: { publicUrl: fetchedUrl } } = supabase.storage.from('photos').getPublicUrl(psdPath)
          pdfUrl = fetchedUrl
        } else {
          try {
            const result = await renderPdfToDataUrl(backgroundFile)
            const previews = result.pages.map(p => p.dataUrl)
            setPdfPagePreviews(previews)
            if (result.pages.length > 0) {
              setPdfDimensions({ width: result.pages[0].widthMm, height: result.pages[0].heightMm })
            }
          } catch (e: any) {
            console.error('Failed to render local PDF layout preview:', e)
            throw new Error(e.message || 'Failed to verify local PDF file.')
          }

          const pdfPath = `templates/${randomId}_bg.pdf`
          const { error: pdfErr } = await supabase.storage.from('photos').upload(pdfPath, backgroundFile)
          if (pdfErr) throw pdfErr
          const { data: { publicUrl: fetchedUrl } } = supabase.storage.from('photos').getPublicUrl(pdfPath)
          pdfUrl = fetchedUrl
        }
      } else {
        pdfUrl = cleanExternalUrl(pdfLinkUrl.trim())
        if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
          throw new Error('Invalid URL format. Must start with http:// or https://')
        }

        try {
          const { arrayBuffer, isPsd: isPsdLink } = await fetchAndDetectFormat(pdfUrl)
          if (isPsdLink) {
            const fileFromBuffer = new File([arrayBuffer], 'temp.psd', { type: 'image/vnd.adobe.photoshop' })
            const parsedLayout = await parsePSDFile(fileFromBuffer, randomId)
            setPdfPagePreviews(parsedLayout.previews)
            setPdfDimensions({ width: parsedLayout.page_size.width_mm, height: parsedLayout.page_size.height_mm })
            setNewTemplate(prev => ({
              ...prev,
              layout_schema: parsedLayout
            }))
          } else {
            const pdfjsLib = await loadPdfjs()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise
            
            const pagesData = []
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum)
              const originalViewport = page.getViewport({ scale: 1.0 })
              const widthPts = originalViewport.width
              const heightPts = originalViewport.height
              const widthMm = Math.round((widthPts / 72) * 25.4)
              const heightMm = Math.round((heightPts / 72) * 25.4)
              
              const viewport = page.getViewport({ scale: 1.5 })
              const canvas = document.createElement('canvas')
              const context = canvas.getContext('2d')
              if (!context) throw new Error('Canvas 2D context not supported')
              
              canvas.height = viewport.height
              canvas.width = viewport.width
              await page.render({ canvasContext: context, viewport }).promise
              pagesData.push({
                dataUrl: canvas.toDataURL('image/png'),
                widthMm,
                heightMm
              })
            }
            const previews = pagesData.map(p => p.dataUrl)
            setPdfPagePreviews(previews)
            if (pagesData.length > 0) {
              setPdfDimensions({ width: pagesData[0].widthMm, height: pagesData[0].heightMm })
            }
          }
        } catch (e: any) {
          console.error('Failed to parse remote PDF/PSD layout preview:', e)
          throw new Error(e.message || 'Failed to verify remote layout URL.')
        }
      }

      setNewTemplate(prev => ({ ...prev, background_pdf_path: pdfUrl }))
      setPdfState({ status: 'success', url: pdfUrl })
    } catch (err: any) {
      console.error(err)
      setPdfState({ status: 'error', url: '', errorMsg: err.message || 'Upload/fetch failed' })
      alert(`Validation failed: ${err.message || err}`)
    }
  }

  const handleUploadThumb = async () => {
    if (thumbUploadMethod === 'upload' && !thumbnailFile) {
      alert('Please select an image file first.')
      return
    }
    if (thumbUploadMethod === 'link' && !thumbLinkUrl.trim()) {
      alert('Please enter a thumbnail URL first.')
      return
    }

    setThumbState({ status: thumbUploadMethod === 'upload' ? 'uploading' : 'verifying', url: '' })
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const randomId = Math.random().toString(36).substring(2, 10)

      let thumbUrl = ''
      if (thumbUploadMethod === 'upload' && thumbnailFile) {
        const thumbPath = `templates/${randomId}_thumb.png`
        const { error: thumbErr } = await supabase.storage.from('photos').upload(thumbPath, thumbnailFile)
        if (thumbErr) throw thumbErr
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(thumbPath)
        thumbUrl = publicUrl
      } else {
        thumbUrl = cleanExternalUrl(thumbLinkUrl.trim())
        if (!thumbUrl.startsWith('http://') && !thumbUrl.startsWith('https://')) {
          throw new Error('Invalid URL format. Must start with http:// or https://')
        }
      }

      setNewTemplate(prev => ({ ...prev, thumbnail_url: thumbUrl }))
      setThumbState({ status: 'success', url: thumbUrl })
    } catch (err: any) {
      console.error(err)
      setThumbState({ status: 'error', url: '', errorMsg: err.message || 'Upload/fetch failed' })
      alert(`Thumbnail validation failed: ${err.message || err}`)
    }
  }

  const handleParseIdml = async () => {
    if (!idmlFile) {
      alert('Please select an IDML file first.')
      return
    }

    setIdmlState({ status: 'parsing' })
    try {
      const randomId = Math.random().toString(36).substring(2, 10)
      const base64 = await fileToBase64(idmlFile)
      const schema = await apiClient.post('/api/artists/templates/parse-idml', {
        base64Data: base64,
        templateId: randomId
      })

      if (schema) {
        setNewTemplate(prev => ({ ...prev, layout_schema: schema }))
        
        let slotsCount = 0
        if (Array.isArray(schema.pages)) {
          schema.pages.forEach((p: any) => {
            if (Array.isArray(p.slots)) {
              slotsCount += p.slots.length
            }
          })
        }
        
        setIdmlState({ status: 'success', slotsCount })
      } else {
        throw new Error('Failed to parse IDML schema')
      }
    } catch (err: any) {
      console.error(err)
      setIdmlState({ status: 'error', errorMsg: err.message || 'IDML parsing failed' })
      alert(`IDML parsing failed: ${err.message || err}`)
    }
  }

  /* ── Layout State ── */
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ─── Data Fetching ───────────────────────────────────────────── */

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await apiClient.get('/api/artists/templates')
       const mapped = (data || []).map((t: any) => ({
        id: t.id,
        title: t.name,
        description: t.description,
        is_published: t.status === 'published',
        created_at: t.created_at,
        cover_photo_id: undefined,
        layout_data: t.layout_schema,
        thumbnail_url: t.thumbnail_url,
        background_pdf_path: t.background_pdf_path,
        page_count: t.page_count,
        page_previews_urls: t.page_previews_urls || []
      }))
      setAlbums(mapped)
    } catch (e) {
      console.error('Failed to load artist templates:', e)
    } finally {
      setLoadingTemplates(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates()
    } else if (activeTab === 'reviews') {
      loadReviewOrders()
    } else if (activeTab === 'stats') {
      loadStats()
    }
  }, [activeTab])

  const loadReviewOrders = async () => {
    setReviewLoading(true)
    try {
      const orders = await apiClient.get('/api/artists/orders')
      setReviewOrders(orders || [])
    } catch (e) {
      console.error('Failed to load review orders:', e)
    } finally {
      setReviewLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await apiClient.get('/api/artists/stats')
      setStats(data || { templatesPublished: 0, ordersFulfilled: 0, avgReviewHours: 0 })
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  /* ─── Actions ─────────────────────────────────────────────────── */

  const handleTogglePublish = async (templateId: string, currentStatus: boolean) => {
    setUpdatingId(templateId)
    try {
      const nextStatus = !currentStatus
      const result = await apiClient.put(`/api/artists/templates/${templateId}`, {
        status: nextStatus ? 'published' : 'draft'
      })
      if (result) {
        setAlbums(prev =>
          prev.map(a => (a.id === templateId ? { ...a, is_published: nextStatus } : a))
        )
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    setDeletingId(templateId)
    try {
      await apiClient.delete(`/api/artists/templates/${templateId}`)
      setAlbums(prev => prev.filter(a => a.id !== templateId))
    } catch (err) {
      console.error('Failed to delete template:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  const uploadWizardFiles = async () => {
    setUploadingFiles(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const randomId = Math.random().toString(36).substring(2, 10)

      const isPsdFile = backgroundFile?.name.toLowerCase().endsWith('.psd')

      // 1. Resolve Background PDF/PSD URL
      let pdfUrl = pdfState.url
      if (pdfState.status !== 'success') {
        if (pdfUploadMethod === 'upload') {
          if (!backgroundFile) {
            alert('Background design file is required.')
            setUploadingFiles(false)
            return false
          }
          const extension = isPsdFile ? 'psd' : 'pdf'
          const pdfPath = `templates/${randomId}_bg.${extension}`
          
          if (isPsdFile) {
            try {
              const parsedLayout = await parsePSDFile(backgroundFile, randomId)
              setPdfPagePreviews(parsedLayout.previews)
              setPdfDimensions({ width: parsedLayout.page_size.width_mm, height: parsedLayout.page_size.height_mm })
              setNewTemplate(prev => ({
                ...prev,
                layout_schema: parsedLayout
              }))
            } catch (e: any) {
              console.error('Failed to parse PSD template:', e)
              throw new Error(e.message || 'Failed to verify and parse PSD file.')
            }
          }

          const { error: pdfErr } = await supabase.storage.from('photos').upload(pdfPath, backgroundFile)
          if (pdfErr) throw pdfErr
          const { data: { publicUrl: fetchedUrl } } = supabase.storage.from('photos').getPublicUrl(pdfPath)
          pdfUrl = fetchedUrl
        } else {
          if (!pdfLinkUrl.trim()) {
            alert('Background PDF/PSD Google Drive or external URL is required.')
            setUploadingFiles(false)
            return false
          }
          pdfUrl = cleanExternalUrl(pdfLinkUrl.trim())
        }
        setPdfState({ status: 'success', url: pdfUrl })
      }

      // 2. Resolve Thumbnail URL
      let thumbUrl = thumbState.url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop'
      if (thumbState.status !== 'success' && ((thumbUploadMethod === 'upload' && thumbnailFile) || (thumbUploadMethod === 'link' && thumbLinkUrl.trim()))) {
        if (thumbUploadMethod === 'upload' && thumbnailFile) {
          const thumbPath = `templates/${randomId}_thumb.png`
          const { error: thumbErr } = await supabase.storage.from('photos').upload(thumbPath, thumbnailFile)
          if (thumbErr) throw thumbErr
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(thumbPath)
          thumbUrl = publicUrl
        } else if (thumbUploadMethod === 'link' && thumbLinkUrl.trim()) {
          thumbUrl = cleanExternalUrl(thumbLinkUrl.trim())
        }
        setThumbState({ status: 'success', url: thumbUrl })
      }

      // 3. Resolve IDML parsing
      let parsedSchema = newTemplate.layout_schema
      if (idmlFile && idmlState.status !== 'success' && !isPsdFile) {
        const base64 = await fileToBase64(idmlFile)
        const schema = await apiClient.post('/api/artists/templates/parse-idml', {
          base64Data: base64,
          templateId: randomId
        })
        if (schema) {
          parsedSchema = schema
          
          let slotsCount = 0
          if (Array.isArray(schema.pages)) {
            schema.pages.forEach((p: any) => {
              if (Array.isArray(p.slots)) {
                slotsCount += p.slots.length
              }
            })
          }
          setIdmlState({ status: 'success', slotsCount })
        }
      }

      // 4. Generate PDF/PSD preview if not done already
      let previewsToUpload = [...pdfPagePreviews]
      if (pdfUrl && previewsToUpload.length === 0) {
        try {
          if (pdfUploadMethod === 'upload') {
            if (isPsdFile && backgroundFile) {
              const parsedLayout = await parsePSDFile(backgroundFile, randomId)
              previewsToUpload = parsedLayout.previews
              setPdfPagePreviews(previewsToUpload)
              setPdfDimensions({ width: parsedLayout.page_size.width_mm, height: parsedLayout.page_size.height_mm })
              parsedSchema = parsedLayout
            } else if (backgroundFile) {
              const result = await renderPdfToDataUrl(backgroundFile)
              previewsToUpload = result.pages.map(p => p.dataUrl)
              setPdfPagePreviews(previewsToUpload)
              if (result.pages.length > 0) {
                setPdfDimensions({ width: result.pages[0].widthMm, height: result.pages[0].heightMm })
              }
            }
          } else {
            // Link method
            const { arrayBuffer, isPsd: isPsdLink } = await fetchAndDetectFormat(pdfUrl)
            if (isPsdLink) {
              const fileFromBuffer = new File([arrayBuffer], 'temp.psd', { type: 'image/vnd.adobe.photoshop' })
              const parsedLayout = await parsePSDFile(fileFromBuffer, randomId)
              previewsToUpload = parsedLayout.previews
              setPdfPagePreviews(previewsToUpload)
              setPdfDimensions({ width: parsedLayout.page_size.width_mm, height: parsedLayout.page_size.height_mm })
              parsedSchema = parsedLayout
            } else {
              const pdfjsLib = await loadPdfjs()
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
              const pdf = await loadingTask.promise
              
              const pagesData = []
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const originalViewport = page.getViewport({ scale: 1.0 })
                const widthPts = originalViewport.width
                const heightPts = originalViewport.height
                const widthMm = Math.round((widthPts / 72) * 25.4)
                const heightMm = Math.round((heightPts / 72) * 25.4)
                
                const viewport = page.getViewport({ scale: 1.5 })
                const canvas = document.createElement('canvas')
                const context = canvas.getContext('2d')
                if (!context) throw new Error('Canvas 2D context not supported')
                
                canvas.height = viewport.height
                canvas.width = viewport.width
                await page.render({ canvasContext: context, viewport }).promise
                pagesData.push({
                  dataUrl: canvas.toDataURL('image/png'),
                  widthMm,
                  heightMm
                })
              }
              previewsToUpload = pagesData.map(p => p.dataUrl)
              setPdfPagePreviews(previewsToUpload)
              if (pagesData.length > 0) {
                setPdfDimensions({ width: pagesData[0].widthMm, height: pagesData[0].heightMm })
              }
            }
          }
        } catch (e: any) {
          console.error('Failed to render PDF/PSD layout preview in Next step:', e)
          throw new Error(e.message || 'Failed to verify URL.')
        }
      }

      // Upload previews to Supabase storage to get public URLs
      const pagePreviewsUrls: string[] = []
      if (previewsToUpload.length > 0) {
        const dataUrlToBlob = (dataUrl: string) => {
          const arr = dataUrl.split(',')
          const mime = arr[0].match(/:(.*?);/)![1]
          const bstr = atob(arr[1])
          let n = bstr.length
          const u8arr = new Uint8Array(n)
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
          }
          return new Blob([u8arr], { type: mime })
        }

        for (let i = 0; i < previewsToUpload.length; i++) {
          try {
            const blob = dataUrlToBlob(previewsToUpload[i])
            const pagePath = `templates/${randomId}_page_${i + 1}.png`
            const { error: pageErr } = await supabase.storage.from('photos').upload(pagePath, blob, {
              contentType: 'image/png',
              upsert: true
            })
            if (pageErr) throw pageErr
            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(pagePath)
            pagePreviewsUrls.push(publicUrl)
          } catch (uploadErr) {
            console.error(`Failed to upload page preview ${i + 1}:`, uploadErr)
          }
        }
      }

      setNewTemplate(prev => ({
        ...prev,
        background_pdf_path: pdfUrl,
        thumbnail_url: thumbUrl,
        page_previews_urls: pagePreviewsUrls,
        layout_schema: parsedSchema || prev.layout_schema
      }))

      setUploadingFiles(false)
      const isActuallyPsd = isPsdFile || (parsedSchema && parsedSchema.pages && parsedSchema.pages.length > 0)
      setWizardStep(idmlFile || isActuallyPsd ? 3 : 2)
      return true
    } catch (err: any) {
      console.error(err)
      alert(`Upload failed: ${err.message || err}`)
      setUploadingFiles(false)
      return false
    }
  }

  const handleBackStep = () => {
    const isPsdFile = backgroundFile?.name.toLowerCase().endsWith('.psd')
    const isActuallyPsd = isPsdFile || (newTemplate.layout_schema && newTemplate.layout_schema.pages && newTemplate.layout_schema.pages.length > 0)
    if (wizardStep === 3 && (idmlFile || isActuallyPsd)) {
      setWizardStep(1)
    } else {
      setWizardStep(prev => prev - 1)
    }
  }

  const handleSaveDrawnSlots = (pages: any[]) => {
    setNewTemplate(prev => ({
      ...prev,
      layout_schema: {
        ...prev.layout_schema,
        page_size: {
          width_mm: pdfDimensions.width,
          height_mm: pdfDimensions.height
        },
        pages
      }
    }))
    setWizardStep(3)
  }

  const handleWizardSubmit = async () => {
    setCreating(true)
    try {
      const res = await apiClient.post('/api/artists/templates', {
        ...newTemplate,
        page_count: newTemplate.layout_schema?.pages?.length || 2,
        status: 'published'
      })
      if (res) {
        setIsWizardOpen(false)
        const mappedRes = {
          id: res.id,
          title: res.name,
          description: res.description,
          is_published: res.status === 'published',
          created_at: res.created_at,
          cover_photo_id: undefined,
          layout_data: res.layout_schema,
          thumbnail_url: res.thumbnail_url,
          background_pdf_path: res.background_pdf_path,
          page_count: res.page_count,
          page_previews_urls: res.page_previews_urls || []
        }
        setAlbums(prev => [mappedRes, ...prev])
        setWizardStep(1)
        setBackgroundFile(null)
        setIdmlFile(null)
        setThumbnailFile(null)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to publish template.')
    } finally {
      setCreating(false)
    }
  }

  const handleReviewAction = async (action: 'approve' | 'request-changes' | 'escalate') => {
    if (!selectedReviewOrder) return
    setReviewActionLoading(true)
    try {
      await apiClient.post(`/api/artists/orders/${selectedReviewOrder.id}/review`, {
        action,
        comment: reviewComment
      })
      alert(`Order layout review submitted: ${action.replace('-', ' ')}`)
      setSelectedReviewOrder(null)
      setReviewComment('')
      loadReviewOrders()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to submit review.')
    } finally {
      setReviewActionLoading(false)
    }
  }

  /* ─── Derived Values ──────────────────────────────────────────── */

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  const filteredReviewOrders = useMemo(() => {
    if (reviewFilter === 'all') return reviewOrders
    return reviewOrders.filter(o => {
      if (reviewFilter === 'approved') {
        return o.status === 'approved' || o.status === 'sent-to-print' || o.status === 'printing' || o.status === 'completed'
      }
      return o.status === reviewFilter
    })
  }, [reviewOrders, reviewFilter])

  const pendingCount = reviewOrders.filter(o => o.status === 'pending-review').length

  const sidebarItems = [
    { id: 'templates' as const, label: 'Templates', icon: Layout, badge: albums.length || null },
    { id: 'reviews' as const,   label: 'Order Queue', icon: ClipboardList, badge: pendingCount || null },
    { id: 'concierge' as const, label: 'Concierge', icon: Sparkles, badge: initialConciergeProjects.length || null },
    { id: 'media' as const,     label: 'Media Library', icon: ImageIcon, badge: null },
    { id: 'stats' as const,     label: 'Analytics', icon: BarChart3, badge: null },
  ]

  const meta = SECTION_META[activeTab]

  /* ─── Helpers ─────────────────────────────────────────────────── */

  const getOrderStatusBadge = (status: string) => {
    if (status === 'pending-review') {
      return { label: 'Awaiting Review', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' }
    }
    if (status === 'approved' || status === 'sent-to-print' || status === 'printing' || status === 'completed') {
      return { label: 'Approved by Designer', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' }
    }
    if (status === 'changes-requested') {
      return { label: 'Revision Requested', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20' }
    }
    return { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* ─── RENDER ─────────────────────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen bg-[#F5F0E8] text-[#1C1814] dark:bg-[#120f0d] dark:text-[#F5F0E8] transition-colors">

      {/* ═══ Mobile Overlay ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-[#1C1814] z-50 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-5 right-4 p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo Area */}
        <div className="px-6 py-7 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#B85C38] to-[#D4845E] flex items-center justify-center shadow-lg shadow-[#B85C38]/20">
              <Palette className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-white font-serif text-[17px] tracking-tight leading-none">Folio</h1>
              <span className="text-[8px] uppercase tracking-[0.35em] text-white/30 font-mono leading-none mt-0.5 block">Studio</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 mb-3 text-[9px] uppercase tracking-[0.3em] text-white/20 font-mono">Workspace</p>
          {sidebarItems.map(item => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#B85C38] rounded-r-full" />
                )}
                <Icon className={`w-[17px] h-[17px] transition-colors ${isActive ? 'text-[#D4845E]' : ''}`} />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.badge !== null && (
                  <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-[#B85C38]/30 text-[#D4845E]' : 'bg-white/[0.06] text-white/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-4 py-5 border-t border-white/[0.06] space-y-1.5">
          <Link
            href="/dashboard?mode=user"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all text-[12px] group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Exit to Dashboard</span>
          </Link>
          
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-all text-[12px] group cursor-pointer"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">

        {/* ── Sticky Top Bar ── */}
        <header className="sticky top-0 z-30 bg-[#F5F0E8]/80 dark:bg-[#120f0d]/85 backdrop-blur-xl border-b border-[#DDD8CE]/60 dark:border-white/10 transition-colors">
          <div className="flex items-center justify-between h-[72px] px-6 lg:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-[#1C1814] dark:text-[#F5F0E8] hover:bg-[#1C1814]/5 dark:hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-serif text-2xl text-[#1C1814] dark:text-[#F5F0E8] leading-tight">{meta.title}</h2>
                <p className="text-[11px] text-[#7A6F64] dark:text-[#B7AA9C] mt-0.5 hidden sm:block">{meta.subtitle}</p>
              </div>
            </div>

            {/* Action Button */}
            {activeTab === 'templates' && (
              <button
                onClick={() => openWizard()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1814] hover:bg-[#1C1814]/85 text-[#F5F0E8] text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all shadow-lg shadow-[#1C1814]/10 active:scale-[0.97]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Template</span>
              </button>
            )}
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 p-6 lg:p-8 xl:p-10">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ── TEMPLATES TAB ──────────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'templates' && (
            <div className="animate-in fade-in duration-300">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B85C38] mx-auto mb-4" />
                    <p className="text-sm text-[#7A6F64] dark:text-[#B7AA9C] font-serif italic">Loading templates...</p>
                  </div>
                </div>
              ) : albums.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#1C1814]/5 dark:bg-white/5 flex items-center justify-center mb-6">
                    <Layout className="w-9 h-9 text-[#1C1814]/20 dark:text-white/20" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#1C1814] dark:text-[#F5F0E8] mb-2">No templates yet</h3>
                  <p className="text-[#7A6F64] dark:text-[#B7AA9C] text-sm max-w-sm mb-8 leading-relaxed">
                    Create your first magazine or photo book design. Add pages, style typography, place placeholders, and publish.
                  </p>
                  <button
                    onClick={() => openWizard()}
                    className="px-7 py-3 bg-[#1C1814] text-[#F5F0E8] text-[11px] uppercase tracking-[0.15em] font-bold rounded-lg hover:bg-[#1C1814]/85 transition-all active:scale-[0.97] shadow-lg shadow-[#1C1814]/10"
                  >
                    Upload Your First Template
                  </button>
                </div>
              ) : (
                /* Template Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {albums.map((album, idx) => {
                    const isPublished = album.is_published
                    const isUpdating = updatingId === album.id
                    const isDeleting = deletingId === album.id
                     const pageCount = album.page_count || album.layout_data?.pages?.length || (Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads.length * 2 : 2)
                     const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]

                     return (
                       <div
                         key={album.id}
                         className="group relative bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-black/[0.06] dark:hover:shadow-black/30 transition-all duration-500 hover:-translate-y-0.5"
                       >
                         {/* Thumbnail Area */}
                         <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br bg-white dark:bg-[#1A1613]">
                           {album.thumbnail_url ? (
                             <img
                               src={album.thumbnail_url}
                               alt={album.title}
                               className="w-full h-full object-cover"
                             />
                           ) : (
                             <>
                               <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                               {/* Decorative pattern */}
                               <div className="absolute inset-0 opacity-[0.03]" style={{
                                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                               }} />
                               {/* Center icon */}
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <BookOpen className="w-10 h-10 text-[#1C1814]/[0.06] dark:text-white/[0.06]" />
                               </div>
                             </>
                           )}

                           {/* Status badge */}
                           <div className="absolute top-3 right-3 z-10">
                             <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                               isPublished
                                 ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25'
                                 : 'bg-white/50 text-[#7A6F64] border-white/30 dark:bg-black/20 dark:text-[#B7AA9C] dark:border-white/10'
                             }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-[#7A6F64]/30'}`} />
                               {isPublished ? 'Live' : 'Draft'}
                             </div>
                           </div>

                           {/* Hover overlay */}
                           <div className="absolute inset-0 bg-gradient-to-t from-[#1C1814]/70 via-[#1C1814]/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-end justify-center pb-4 gap-2">
                             <Link
                               href={`/dashboard/templates/editor/${album.id}`}
                               className="flex items-center gap-1.5 px-3.5 py-2 bg-white/95 text-[#1C1814] text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white transition-colors shadow-lg"
                             >
                               <Eye className="w-3 h-3" /> Edit
                             </Link>
                             <button
                               onClick={() => handleTogglePublish(album.id, isPublished)}
                               disabled={isUpdating}
                               className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/20"
                             >
                               {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                               {isPublished ? 'Unpublish' : 'Publish'}
                             </button>
                           </div>
                         </div>

                        {/* Card Info */}
                        <div className="p-4 pb-3">
                          <h3 className="font-serif text-lg text-[#1C1814] dark:text-[#F5F0E8] truncate leading-tight mb-1.5 group-hover:text-[#B85C38] transition-colors">
                            {album.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-[#7A6F64] dark:text-[#B7AA9C]">
                            <span>{pageCount} pages</span>
                            <span className="w-1 h-1 rounded-full bg-[#DDD8CE] dark:bg-white/15" />
                            <span>{mounted ? new Date(album.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteTemplate(album.id)}
                          disabled={isDeleting}
                          className="absolute bottom-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 text-[#7A6F64]/40 dark:text-[#B7AA9C]/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ── REVIEWS TAB ────────────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div className="animate-in fade-in duration-300">
              {reviewLoading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B85C38] mx-auto mb-4" />
                    <p className="text-sm text-[#7A6F64] dark:text-[#B7AA9C] font-serif italic">Fetching print submissions...</p>
                  </div>
                </div>
              ) : selectedReviewOrder ? (
                /* ── Review Detail View ── */
                <div>
                  <button
                    onClick={() => setSelectedReviewOrder(null)}
                    className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C] hover:text-[#1C1814] dark:hover:text-[#F5F0E8] transition-colors mb-6 group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Queue
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Images */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-serif text-xl text-[#1C1814] dark:text-[#F5F0E8]">
                            {selectedReviewOrder.album_title}
                          </h3>
                          <span className="text-[10px] font-mono text-[#7A6F64] dark:text-[#B7AA9C]">
                            #{selectedReviewOrder.id.substring(0, 8)}
                          </span>
                        </div>

                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#B85C38] font-bold mb-4">Image Inspection</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedReviewOrder.image_references.map((url, index) => (
                            <div key={index} className="relative group border border-[#EBE6DD] dark:border-white/10 bg-[#F5F0E8] dark:bg-[#120f0d] overflow-hidden rounded-lg aspect-square">
                              <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-[#1C1814]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Specs + Actions */}
                    <div className="space-y-5">
                      {/* Order Specs Card */}
                      <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl p-6">
                        <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#B85C38] mb-4">Order Specifications</h4>
                        <dl className="space-y-3 text-[13px]">
                          {[
                            ['Customer', selectedReviewOrder.user_name],
                            ['Product', selectedReviewOrder.product_type],
                            ['Quantity', `${selectedReviewOrder.quantity} ${selectedReviewOrder.quantity === 1 ? 'copy' : 'copies'}`],
                            ['Instructions', selectedReviewOrder.special_instructions || 'None'],
                          ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between items-start gap-4">
                              <dt className="text-[#7A6F64] dark:text-[#B7AA9C] shrink-0 text-[11px]">{label}</dt>
                              <dd className="text-[#1C1814] dark:text-[#F5F0E8] text-right font-medium text-[12px]">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {/* Review Actions Card */}
                      <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl p-6 space-y-4">
                        <h4 className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#7A6F64] dark:text-[#B7AA9C]">Review Comment</h4>
                        <textarea
                          rows={4}
                          value={reviewComment || ''}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Provide specific feedback or change requests..."
                          className="w-full border border-[#EBE6DD] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#120f0d] px-4 py-3 text-[13px] text-[#1C1814] dark:text-[#F5F0E8] placeholder:text-[#7A6F64]/40 dark:placeholder:text-[#B7AA9C]/40 focus:outline-none focus:ring-2 focus:ring-[#B85C38]/20 focus:border-[#B85C38]/40 rounded-lg transition-all resize-none"
                        />

                        <div className="space-y-2.5 pt-2">
                          <button
                            onClick={() => handleReviewAction('approve')}
                            disabled={reviewActionLoading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] uppercase font-bold tracking-[0.15em] transition-colors flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve &amp; Send to Print
                          </button>
                          <button
                            onClick={() => handleReviewAction('request-changes')}
                            disabled={reviewActionLoading}
                            className="w-full py-3 bg-[#1C1814] hover:bg-[#1C1814]/85 text-white text-[11px] uppercase font-bold tracking-[0.15em] transition-colors flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Request Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : reviewOrders.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                    <CheckCircle className="w-9 h-9 text-emerald-300" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#1C1814] dark:text-[#F5F0E8] mb-2">Queue is Clear</h3>
                  <p className="text-[#7A6F64] dark:text-[#B7AA9C] text-sm max-w-sm leading-relaxed">
                    No print orders are waiting for your review. Check back later!
                  </p>
                </div>
              ) : (
                /* Order Queue List */
                <div className="space-y-6">
                  {/* Filter Chips */}
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setReviewFilter(f.id)}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg border transition-all ${
                          reviewFilter === f.id
                            ? 'bg-[#1C1814] text-white border-[#1C1814]'
                            : 'bg-white dark:bg-[#1A1613] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/10 hover:border-[#1C1814]/20 dark:hover:border-white/20 hover:text-[#1C1814] dark:hover:text-[#F5F0E8]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Order Cards */}
                  <div className="space-y-3">
                    {filteredReviewOrders.map(order => {
                      const badge = getOrderStatusBadge(order.status)
                      return (
                        <div
                          key={order.id}
                          className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl p-5 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/25 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#B85C38]/10 to-[#B85C38]/5 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-[#B85C38]/30" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-[15px] text-[#1C1814] dark:text-[#F5F0E8] truncate leading-tight">{order.album_title}</h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-[#7A6F64] dark:text-[#B7AA9C]">
                              <span>{order.user_name}</span>
                              <span className="w-1 h-1 rounded-full bg-[#DDD8CE] dark:bg-white/15" />
                              <span className="capitalize">{order.product_type}</span>
                              <span className="w-1 h-1 rounded-full bg-[#DDD8CE] dark:bg-white/15" />
                              <span>{order.quantity} {order.quantity === 1 ? 'copy' : 'copies'}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`shrink-0 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${badge.cls}`}>
                            {badge.label}
                          </span>

                          {/* Action */}
                          <button
                            onClick={() => setSelectedReviewOrder(order)}
                            className="shrink-0 px-5 py-2.5 bg-[#1C1814] text-white text-[10px] uppercase font-bold tracking-[0.15em] rounded-lg hover:bg-[#1C1814]/85 transition-all active:scale-[0.97] flex items-center gap-1.5"
                          >
                            Review
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}

                    {filteredReviewOrders.length === 0 && (
                      <div className="text-center py-16 text-[#7A6F64] dark:text-[#B7AA9C]">
                        <p className="text-sm">No orders match this filter.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ── MEDIA TAB ──────────────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'concierge' && (
            <div className="animate-in fade-in duration-300">
              <PremiumDashboardClient
                initialProjects={initialConciergeProjects}
                packages={conciergePackages}
                embedded
              />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 p-6 lg:p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-1">
                  <Upload className="w-5 h-5 text-[#B85C38]" />
                  <h3 className="font-serif text-lg text-[#1C1814] dark:text-[#F5F0E8]">Upload Portfolio Media</h3>
                </div>
                <p className="text-[#7A6F64] dark:text-[#B7AA9C] text-[13px] mb-6 ml-8">
                  These images serve as placeholder assets in your design templates.
                </p>

                <PhotoUploader
                  eventId={portfolioEventId}
                  isManager={true}
                  isGuest={false}
                  allowGuestUploads={false}
                  autoApproveGuestUploads={true}
                  requireGuestFaceEnrollment={false}
                />
              </div>

              <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 p-6 lg:p-8 rounded-xl">
                <PhotoGrid
                  photos={photos}
                  folders={folders as any}
                  eventId={portfolioEventId}
                  currentUserId={currentUserId}
                  isOwner={true}
                  isManager={true}
                  isGuest={false}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ── STATS TAB ──────────────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'stats' && (
            <div className="animate-in fade-in duration-300 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Templates Published */}
                <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-2xl p-7 relative overflow-hidden group hover:shadow-xl hover:shadow-black/[0.04] dark:hover:shadow-black/25 transition-all duration-500">
                  <div className="absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-bl from-[#B85C38]/[0.06] to-transparent rounded-full" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-[#B85C38]/10 flex items-center justify-center mb-5">
                      <Layout className="w-5 h-5 text-[#B85C38]" />
                    </div>
                    <h3 className="font-serif text-[42px] text-[#1C1814] dark:text-[#F5F0E8] leading-none tracking-tight mb-1.5">{stats.templatesPublished}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6F64] dark:text-[#B7AA9C]">Templates Published</p>
                  </div>
                </div>

                {/* Orders Fulfilled */}
                <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-2xl p-7 relative overflow-hidden group hover:shadow-xl hover:shadow-black/[0.04] dark:hover:shadow-black/25 transition-all duration-500">
                  <div className="absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-bl from-emerald-500/[0.06] to-transparent rounded-full" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-serif text-[42px] text-[#1C1814] dark:text-[#F5F0E8] leading-none tracking-tight mb-1.5">{stats.ordersFulfilled}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6F64] dark:text-[#B7AA9C]">Orders Fulfilled</p>
                  </div>
                </div>

                {/* Avg Review Time */}
                <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-2xl p-7 relative overflow-hidden group hover:shadow-xl hover:shadow-black/[0.04] dark:hover:shadow-black/25 transition-all duration-500">
                  <div className="absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-bl from-amber-500/[0.06] to-transparent rounded-full" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-serif text-[42px] text-[#1C1814] dark:text-[#F5F0E8] leading-none tracking-tight mb-1.5">
                      {stats.avgReviewHours}<span className="text-xl text-[#7A6F64] dark:text-[#B7AA9C] ml-1 font-sans">hrs</span>
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6F64] dark:text-[#B7AA9C]">Avg Review Time</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Placeholder */}
              <div className="bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/10 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-5 h-5 text-[#B85C38]" />
                  <h3 className="font-serif text-lg text-[#1C1814] dark:text-[#F5F0E8]">Recent Activity</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#F5F0E8] dark:bg-[#120f0d] flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-[#7A6F64]/30 dark:text-[#B7AA9C]/30" />
                  </div>
                  <p className="text-[#7A6F64] dark:text-[#B7AA9C] text-sm">Activity feed coming soon</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TEMPLATE UPLOAD WIZARD MODAL ───────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FDFAF5] dark:bg-[#171310] border border-[#DDD8CE] dark:border-white/10 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col transition-colors">

            {/* Modal Header */}
            <div className="px-7 py-5 bg-white dark:bg-[#1A1613] border-b border-[#EBE6DD] dark:border-white/10 flex justify-between items-center shrink-0 rounded-t-2xl transition-colors">
              <div>
                <h2 className="font-serif text-xl text-[#1C1814] dark:text-[#F5F0E8]">Publish Design Template</h2>
                {/* Step indicator dots */}
                <div className="flex items-center gap-2 mt-2.5">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step === wizardStep
                          ? 'bg-[#B85C38] scale-125'
                          : step < wizardStep
                          ? 'bg-emerald-500'
                          : 'bg-[#DDD8CE]'
                      }`} />
                      {step < 4 && (
                        <div className={`w-8 h-[1.5px] transition-colors duration-300 ${
                          step < wizardStep ? 'bg-emerald-500' : 'bg-[#DDD8CE]'
                        }`} />
                      )}
                    </div>
                  ))}
                  <span className="text-[10px] font-mono text-[#7A6F64] dark:text-[#B7AA9C] ml-2">Step {wizardStep}/4</span>
                </div>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-2 rounded-lg text-[#7A6F64] dark:text-[#B7AA9C] hover:text-[#1C1814] dark:hover:text-[#F5F0E8] hover:bg-[#1C1814]/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 flex-1 overflow-y-auto">

              {/* Step 1: Upload Files */}
              {wizardStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 bg-[#F5F0E8] dark:bg-[#120f0d] border border-[#EBE6DD] dark:border-white/10 rounded-xl text-[13px] text-[#7A6F64] dark:text-[#B7AA9C] leading-relaxed shadow-inner">
                    Configure your design assets. Upload your background layout PDF or PSD (mandatory), and optionally add an InDesign IDML package (for automatic slot calculations if uploading PDF) and cover thumbnail.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Background PDF/PSD Configuration */}
                    <div className="space-y-4 bg-white dark:bg-[#1A1613] p-5 rounded-xl border border-[#EBE6DD] dark:border-white/5 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-[#B85C38]/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#B85C38]">1</span>
                        </div>
                        <h3 className="font-serif text-sm text-[#1C1814] dark:text-[#F5F0E8]">Background Layout (PDF / PSD)</h3>
                      </div>

                      {/* PDF/PSD Source Tab Selector */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfUploadMethod('upload')
                            setPdfState({ status: 'idle', url: '' })
                          }}
                          className={`flex-1 py-2 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${
                            pdfUploadMethod === 'upload'
                              ? 'bg-[#1C1814] text-white border-[#1C1814]'
                              : 'bg-white dark:bg-[#1A1613] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/10 hover:bg-[#1C1814]/5'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfUploadMethod('link')
                            setPdfState({ status: 'idle', url: '' })
                          }}
                          className={`flex-1 py-2 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${
                            pdfUploadMethod === 'link'
                              ? 'bg-[#1C1814] text-white border-[#1C1814]'
                              : 'bg-white dark:bg-[#1A1613] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/10 hover:bg-[#1C1814]/5'
                          }`}
                        >
                          External Link
                        </button>
                      </div>

                      {pdfUploadMethod === 'upload' ? (
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-[#DDD8CE] dark:border-white/10 hover:border-[#B85C38]/30 rounded-xl p-5 text-center transition-colors group bg-[#FAF9F6] dark:bg-black/5">
                            <input
                              type="file"
                              accept=".pdf,.psd"
                              onChange={(e) => {
                                setBackgroundFile(e.target.files?.[0] || null)
                                setPdfState({ status: 'idle', url: '' })
                              }}
                              className="hidden"
                              id="wizard-pdf"
                            />
                            <label htmlFor="wizard-pdf" className="cursor-pointer flex flex-col items-center">
                              <Upload className="w-5 h-5 text-[#7A6F64] dark:text-[#B7AA9C] group-hover:text-[#B85C38] transition-colors mb-2" />
                              <span className="text-[12px] text-[#1C1814] dark:text-[#F5F0E8] font-medium truncate max-w-[200px]">
                                {backgroundFile ? backgroundFile.name : 'Choose PDF or PSD background'}
                              </span>
                              <span className="text-[9px] text-[#7A6F64] dark:text-[#B7AA9C] mt-0.5">PSD will auto-extract slots & split spreads</span>
                            </label>
                          </div>
                          {backgroundFile && pdfState.status !== 'success' && (
                            <button
                              type="button"
                              onClick={handleUploadPdf}
                              disabled={pdfState.status === 'uploading'}
                              className="w-full py-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#B85C38]/10"
                            >
                              {pdfState.status === 'uploading' ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {backgroundFile.name.toLowerCase().endsWith('.psd') ? 'Parsing & Uploading PSD...' : 'Uploading PDF...'}
                                </>
                              ) : (
                                backgroundFile.name.toLowerCase().endsWith('.psd') ? 'Parse & Upload PSD' : 'Upload & Verify PDF'
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pdfLinkUrl || ''}
                              onChange={(e) => {
                                setPdfLinkUrl(e.target.value)
                                setPdfState({ status: 'idle', url: '' })
                              }}
                              placeholder="Paste direct PDF/PSD link or Google Drive link..."
                              className="flex-1 border border-[#EBE6DD] dark:border-white/10 bg-[#FAF9F6] dark:bg-black/5 px-3 py-2 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B85C38]/40 focus:border-[#B85C38]/40 transition-all placeholder:text-[#7A6F64]/30"
                            />
                            {pdfLinkUrl.trim() && pdfState.status !== 'success' && (
                              <button
                                type="button"
                                onClick={handleUploadPdf}
                                disabled={pdfState.status === 'verifying'}
                                className="px-4 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-md shadow-[#B85C38]/10"
                              >
                                {pdfState.status === 'verifying' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Fetch'
                                )}
                              </button>
                            )}
                          </div>
                          <p className="text-[9px] text-[#7A6F64] dark:text-[#B7AA9C] italic">
                            Tip: For Google Drive, set the file share setting to "Anyone with the link can view".
                          </p>
                        </div>
                      )}

                      {/* PDF Upload Status Feedback */}
                      {pdfState.status === 'success' && (
                        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate font-mono text-[10px]">{pdfState.url}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPdfState({ status: 'idle', url: '' })
                              setBackgroundFile(null)
                              setPdfLinkUrl('')
                              setNewTemplate(prev => ({ ...prev, background_pdf_path: '' }))
                            }}
                            className="text-[10px] underline hover:text-[#B85C38] cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                      {pdfState.status === 'error' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-800 dark:text-red-300 text-xs flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="font-bold">Error</span>
                          </div>
                          <p className="text-[10px] leading-snug">{pdfState.errorMsg}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: IDML File and Cover Thumbnail */}
                    <div className="space-y-5 bg-white dark:bg-[#1A1613] p-5 rounded-xl border border-[#EBE6DD] dark:border-white/5 shadow-sm">
                      {/* IDML Section */}
                      {!backgroundFile?.name.toLowerCase().endsWith('.psd') ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-md bg-[#B85C38]/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-[#B85C38]">2</span>
                            </div>
                            <h3 className="font-serif text-sm text-[#1C1814] dark:text-[#F5F0E8]">InDesign IDML Package <span className="text-[9px] text-[#7A6F64]/50 lowercase">(optional)</span></h3>
                          </div>

                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-[#DDD8CE] dark:border-white/10 hover:border-[#B85C38]/30 rounded-xl p-4 text-center transition-colors group bg-[#FAF9F6] dark:bg-black/5">
                              <input
                                type="file"
                                accept=".idml"
                                onChange={(e) => {
                                  setIdmlFile(e.target.files?.[0] || null)
                                  setIdmlState({ status: 'idle' })
                                }}
                                className="hidden"
                                id="wizard-idml"
                              />
                              <label htmlFor="wizard-idml" className="cursor-pointer flex flex-col items-center">
                                <Upload className="w-4 h-4 text-[#7A6F64] dark:text-[#B7AA9C] group-hover:text-[#B85C38] transition-colors mb-1.5" />
                                <span className="text-[11px] text-[#1C1814] dark:text-[#F5F0E8] font-medium truncate max-w-[200px]">
                                  {idmlFile ? idmlFile.name : 'Choose IDML archive'}
                                </span>
                                <span className="text-[9px] text-[#7A6F64] dark:text-[#B7AA9C] mt-0.5">Extracts slots coordinates</span>
                              </label>
                            </div>
                            {idmlFile && idmlState.status !== 'success' && (
                              <button
                                type="button"
                                onClick={handleParseIdml}
                                disabled={idmlState.status === 'parsing'}
                                className="w-full py-2 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#B85C38]/10"
                              >
                                {idmlState.status === 'parsing' ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing IDML...
                                  </>
                                ) : (
                                  'Parse IDML Layout'
                                )}
                              </button>
                            )}
                          </div>

                          {/* IDML Parsing Feedback */}
                          {idmlState.status === 'success' && (
                            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Parsed layout! {idmlState.slotsCount} photo slots detected.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setIdmlState({ status: 'idle' })
                                  setIdmlFile(null)
                                  setNewTemplate(prev => ({ ...prev, layout_schema: { pages: [] } }))
                                }}
                                className="text-[10px] underline hover:text-[#B85C38] cursor-pointer shrink-0 ml-2"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                          {idmlState.status === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-800 dark:text-red-300 text-xs flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="font-bold">Error</span>
                              </div>
                              <p className="text-[10px] leading-snug">{idmlState.errorMsg}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-[#F5F0E8] dark:bg-[#120f0d] border border-[#EBE6DD] dark:border-white/10 rounded-xl text-[11px] text-[#7A6F64] dark:text-[#B7AA9C] leading-normal shadow-inner">
                          <span className="font-bold text-[#B85C38] block mb-1">PSD Auto-extraction Active</span>
                          Slot definitions, text elements, and spreads are automatically parsed from your PSD layers. Manual drawing and IDML package uploads are skipped.
                        </div>
                      )}

                      {/* Thumbnail Section */}
                      <div className="space-y-3 pt-2 border-t border-[#EBE6DD] dark:border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-md bg-[#B85C38]/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[#B85C38]">3</span>
                          </div>
                          <h3 className="font-serif text-sm text-[#1C1814] dark:text-[#F5F0E8]">Cover Thumbnail <span className="text-[9px] text-[#7A6F64]/50 lowercase">(optional)</span></h3>
                        </div>

                        {/* Thumbnail Source Tabs */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setThumbUploadMethod('upload')
                              setThumbState({ status: 'idle', url: '' })
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${
                              thumbUploadMethod === 'upload'
                                ? 'bg-[#1C1814] text-white border-[#1C1814]'
                                : 'bg-white dark:bg-[#1A1613] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/10 hover:bg-[#1C1814]/5'
                            }`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setThumbUploadMethod('link')
                              setThumbState({ status: 'idle', url: '' })
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${
                              thumbUploadMethod === 'link'
                                ? 'bg-[#1C1814] text-white border-[#1C1814]'
                                : 'bg-white dark:bg-[#1A1613] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/10 hover:bg-[#1C1814]/5'
                            }`}
                          >
                            External Link
                          </button>
                        </div>

                        {thumbUploadMethod === 'upload' ? (
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-[#DDD8CE] dark:border-white/10 hover:border-[#B85C38]/30 rounded-xl p-4 text-center transition-colors group bg-[#FAF9F6] dark:bg-black/5">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  setThumbnailFile(e.target.files?.[0] || null)
                                  setThumbState({ status: 'idle', url: '' })
                                }}
                                className="hidden"
                                id="wizard-thumb"
                              />
                              <label htmlFor="wizard-thumb" className="cursor-pointer flex flex-col items-center">
                                <ImageIcon className="w-4 h-4 text-[#7A6F64] dark:text-[#B7AA9C] group-hover:text-[#B85C38] transition-colors mb-1.5" />
                                <span className="text-[11px] text-[#1C1814] dark:text-[#F5F0E8] font-medium truncate max-w-[200px]">
                                  {thumbnailFile ? thumbnailFile.name : 'Choose preview thumbnail'}
                                </span>
                              </label>
                            </div>
                            {thumbnailFile && thumbState.status !== 'success' && (
                              <button
                                type="button"
                                onClick={handleUploadThumb}
                                disabled={thumbState.status === 'uploading'}
                                className="w-full py-2.5 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#B85C38]/10"
                              >
                                {thumbState.status === 'uploading' ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image...
                                  </>
                                ) : (
                                  'Upload Thumbnail'
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={thumbLinkUrl || ''}
                                onChange={(e) => {
                                  setThumbLinkUrl(e.target.value)
                                  setThumbState({ status: 'idle', url: '' })
                                }}
                                placeholder="Paste thumbnail image URL or Google Drive link..."
                                className="flex-1 border border-[#EBE6DD] dark:border-white/10 bg-[#FAF9F6] dark:bg-black/5 px-3 py-2 text-xs text-[#1C1814] dark:text-[#F5F0E8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B85C38]/40 focus:border-[#B85C38]/40 transition-all placeholder:text-[#7A6F64]/30"
                              />
                              {thumbLinkUrl.trim() && thumbState.status !== 'success' && (
                                <button
                                  type="button"
                                  onClick={handleUploadThumb}
                                  disabled={thumbState.status === 'verifying'}
                                  className="px-4 bg-[#B85C38] hover:bg-[#B85C38]/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-md shadow-[#B85C38]/10"
                                >
                                  {thumbState.status === 'verifying' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    'Fetch'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Thumbnail Status Feedback & Preview */}
                        {thumbState.status === 'success' && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-bold">Thumbnail Ready</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setThumbState({ status: 'idle', url: '' })
                                  setThumbnailFile(null)
                                  setThumbLinkUrl('')
                                  setNewTemplate(prev => ({ ...prev, thumbnail_url: '' }))
                                }}
                                className="text-[10px] underline hover:text-[#B85C38] cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="w-20 h-20 bg-black/5 rounded-lg overflow-hidden border border-[#DDD8CE] dark:border-white/10 shadow-inner">
                              <img src={thumbState.url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        {thumbState.status === 'error' && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-800 dark:text-red-300 text-xs flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="font-bold">Error</span>
                            </div>
                            <p className="text-[10px] leading-snug">{thumbState.errorMsg}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Slot Drawing */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <SlotDrawingCanvas
                    pageImageUrls={
                      pdfPagePreviews.length > 0
                        ? pdfPagePreviews
                        : [newTemplate.thumbnail_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop']
                    }
                    pageWidthMm={pdfDimensions.width}
                    pageHeightMm={pdfDimensions.height}
                    initialSlots={
                      (() => {
                        const init: Record<number, SlotDefinition[]> = {}
                        if (newTemplate.layout_schema?.pages) {
                          newTemplate.layout_schema.pages.forEach((p: any) => {
                            const idx = (p.page_number || 1) - 1
                            init[idx] = p.slots || []
                          })
                        }
                        return init
                      })()
                    }
                    onSave={handleSaveDrawnSlots}
                    onCancel={() => setWizardStep(1)}
                  />
                </div>
              )}

              {/* Step 3: Metadata */}
              {wizardStep === 3 && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Row 1: Name and Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Template Name *</label>
                      <input
                        type="text"
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Warm Memories"
                        className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-4 py-3 text-[13px] text-[#1C1814] dark:text-[#F5F0E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38]/20 focus:border-[#B85C38]/40 transition-all placeholder:text-[#7A6F64]/30 dark:placeholder:text-[#B7AA9C]/30 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Description</label>
                      <textarea
                        rows={1}
                        value={newTemplate.description || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your template style and ideal use case..."
                        className="w-full border border-[#EBE6DD] dark:border-white/10 bg-white dark:bg-[#120f0d] px-4 py-3 text-[13px] text-[#1C1814] dark:text-[#F5F0E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C38]/20 focus:border-[#B85C38]/40 transition-all resize-none placeholder:text-[#7A6F64]/30 dark:placeholder:text-[#B7AA9C]/30 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: Pricing Tier Visual Cards */}
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Pricing Tier</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'free', title: 'Free', desc: 'Available to all users. Spreads are free to publish.', price: '$0' },
                        { id: 'standard', title: 'Standard', desc: 'Standard layout options with standard prints.', price: '$15' },
                        { id: 'premium', title: 'Premium', desc: 'Bespoke premium layouts & special typography.', price: '$39' }
                      ].map(option => {
                        const isSelected = newTemplate.price_tier === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setNewTemplate(prev => ({ ...prev, price_tier: option.id }))}
                            className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                              isSelected
                                ? 'bg-white dark:bg-[#1C1814] border-[#B85C38] ring-2 ring-[#B85C38]/20 shadow-md shadow-[#B85C38]/5'
                                : 'bg-[#FAF9F6] dark:bg-[#120f0d] border-[#EBE6DD] dark:border-white/5 hover:border-[#B85C38]/30 hover:bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full mb-1">
                              <span className="text-xs font-bold text-[#1C1814] dark:text-[#F5F0E8] uppercase tracking-wider">{option.title}</span>
                              <span className={`text-xs font-serif font-bold ${isSelected ? 'text-[#B85C38]' : 'text-[#7A6F64]'}`}>{option.price}</span>
                            </div>
                            <p className="text-[10px] text-[#7A6F64] dark:text-[#B7AA9C] leading-snug">{option.desc}</p>
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-3 h-3 bg-[#B85C38] rounded-bl-lg flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 3: Category Visual Grid */}
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { id: 'wedding', label: 'Wedding', icon: Heart },
                        { id: 'travel', label: 'Travel', icon: Globe },
                        { id: 'birthday', label: 'Birthday', icon: Gift },
                        { id: 'family', label: 'Family', icon: Users },
                        { id: 'graduation', label: 'Graduation', icon: GraduationCap },
                        { id: 'corporate', label: 'Corporate', icon: Briefcase },
                      ].map(option => {
                        const Icon = option.icon
                        const isSelected = newTemplate.category === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setNewTemplate(prev => ({ ...prev, category: option.id }))}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer aspect-square ${
                              isSelected
                                ? 'bg-white dark:bg-[#1C1814] border-[#B85C38] ring-2 ring-[#B85C38]/20 shadow-md shadow-[#B85C38]/5 text-[#B85C38]'
                                : 'bg-[#FAF9F6] dark:bg-[#120f0d] border-[#EBE6DD] dark:border-white/5 hover:border-[#B85C38]/30 hover:bg-white text-[#7A6F64] dark:text-[#B7AA9C]'
                            }`}
                          >
                            <Icon className={`w-6 h-6 mb-2 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 4: Custom Print Options Multi-Select (Pills) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#EBE6DD] dark:border-white/5">
                    {/* Sizes selection */}
                    <div className="space-y-3">
                      <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Allowed Print Sizes</label>
                      <div className="flex flex-wrap gap-2">
                        {['A4', 'US Letter', '10x10', '8x11'].map(size => {
                          const isSelected = newTemplate.available_sizes.includes(size)
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setNewTemplate(prev => {
                                  const exists = prev.available_sizes.includes(size)
                                  const next = exists
                                    ? prev.available_sizes.filter(s => s !== size)
                                    : [...prev.available_sizes, size]
                                  return { ...prev, available_sizes: next }
                                })
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1C1814] text-white border-[#1C1814]'
                                  : 'bg-[#FAF9F6] dark:bg-[#120f0d] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/5 hover:border-[#1C1814]/20'
                              }`}
                            >
                              {size}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Paper finishing selection */}
                    <div className="space-y-3">
                      <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Allowed Paper Finishes</label>
                      <div className="flex flex-wrap gap-2">
                        {['matte', 'glossy', 'lustre'].map(paper => {
                          const isSelected = newTemplate.paper_options.includes(paper)
                          return (
                            <button
                              key={paper}
                              type="button"
                              onClick={() => {
                                setNewTemplate(prev => {
                                  const exists = prev.paper_options.includes(paper)
                                  const next = exists
                                    ? prev.paper_options.filter(s => s !== paper)
                                    : [...prev.paper_options, paper]
                                  return { ...prev, paper_options: next }
                                })
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1C1814] text-white border-[#1C1814]'
                                  : 'bg-[#FAF9F6] dark:bg-[#120f0d] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/5 hover:border-[#1C1814]/20'
                              }`}
                            >
                              {paper}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Cover options selection */}
                    <div className="space-y-3">
                      <label className="block text-[10px] uppercase font-bold tracking-[0.15em] text-[#7A6F64] dark:text-[#B7AA9C]">Allowed Cover Types</label>
                      <div className="flex flex-wrap gap-2">
                        {['softcover', 'hardcover', 'leather'].map(cover => {
                          const isSelected = newTemplate.cover_options.includes(cover)
                          return (
                            <button
                              key={cover}
                              type="button"
                              onClick={() => {
                                setNewTemplate(prev => {
                                  const exists = prev.cover_options.includes(cover)
                                  const next = exists
                                    ? prev.cover_options.filter(s => s !== cover)
                                    : [...prev.cover_options, cover]
                                  return { ...prev, cover_options: next }
                                })
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1C1814] text-white border-[#1C1814]'
                                  : 'bg-[#FAF9F6] dark:bg-[#120f0d] text-[#7A6F64] dark:text-[#B7AA9C] border-[#EBE6DD] dark:border-white/5 hover:border-[#1C1814]/20'
                              }`}
                            >
                              {cover}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Publish */}
              {wizardStep === 4 && (
                <div className="animate-in fade-in duration-300 space-y-6">
                  <div className="p-4 bg-[#F5F0E8] dark:bg-[#120f0d] border border-[#EBE6DD] dark:border-white/10 rounded-xl text-[13px] text-[#7A6F64] dark:text-[#B7AA9C] leading-relaxed shadow-inner animate-pulse">
                    Please review your template configurations before publishing. Once published, this design layout will be instantly available for users to select for their photo books.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Cover Preview Card (2 cols) */}
                    <div className="md:col-span-2 bg-white dark:bg-[#1A1613] border border-[#EBE6DD] dark:border-white/5 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="aspect-[4/3] relative bg-[#FAF9F6] dark:bg-black/20 border-b border-[#EBE6DD] dark:border-white/5">
                        {newTemplate.thumbnail_url ? (
                          <img
                            src={newTemplate.thumbnail_url}
                            alt="Template Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#7A6F64]/30">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#B85C38] text-white shadow-sm font-mono tracking-wider">
                            {newTemplate.price_tier}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/90 dark:bg-[#1C1814]/90 text-[#1C1814] dark:text-[#F5F0E8] border border-[#EBE6DD] dark:border-white/10 shadow-sm font-mono tracking-wider">
                            {newTemplate.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 space-y-2">
                        <h4 className="font-serif text-lg text-[#1C1814] dark:text-[#F5F0E8] font-bold leading-tight">
                          {newTemplate.name || 'Untitled Template'}
                        </h4>
                        <p className="text-xs text-[#7A6F64] dark:text-[#B7AA9C] leading-relaxed">
                          {newTemplate.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & specs list (3 cols) */}
                    <div className="md:col-span-3 space-y-4">
                      {/* Asset Summary */}
                      <div className="bg-white dark:bg-[#1A1613] p-5 rounded-xl border border-[#EBE6DD] dark:border-white/5 shadow-sm space-y-3">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B85C38]">Design Assets</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center py-2 border-b border-[#FAF9F6] dark:border-white/5">
                            <span className="text-[#7A6F64] dark:text-[#B7AA9C]">
                              {newTemplate.background_pdf_path?.toLowerCase().endsWith('.psd') ? 'Background PSD Layout' : 'Background PDF Layout'}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <a
                                href={newTemplate.background_pdf_path}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#B85C38] hover:underline truncate font-mono text-[10px] max-w-[200px]"
                              >
                                {newTemplate.background_pdf_path
                                  ? newTemplate.background_pdf_path.toLowerCase().endsWith('.psd')
                                    ? 'View PSD File'
                                    : 'View PDF File'
                                  : 'No path'}
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[#FAF9F6] dark:border-white/5">
                            <span className="text-[#7A6F64] dark:text-[#B7AA9C]">Layout Configuration Source</span>
                            <span className="font-medium text-[#1C1814] dark:text-[#F5F0E8] text-right truncate max-w-[200px]">
                              {idmlFile
                                ? 'Parsed InDesign IDML Package'
                                : backgroundFile?.name.toLowerCase().endsWith('.psd')
                                ? 'Parsed PSD Layers'
                                : 'Drawn via Slot canvas'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-[#7A6F64] dark:text-[#B7AA9C]">Calculated Layout Slots</span>
                            <span className="font-bold text-[#1C1814] dark:text-[#F5F0E8] font-mono">
                              {(() => {
                                let count = 0
                                if (Array.isArray(newTemplate.layout_schema?.pages)) {
                                  newTemplate.layout_schema.pages.forEach((p: any) => {
                                    if (Array.isArray(p.slots)) {
                                      count += p.slots.length
                                    }
                                  })
                                }
                                return count
                              })()}{' '}
                              slots
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Print Options Summary */}
                      <div className="bg-white dark:bg-[#1A1613] p-5 rounded-xl border border-[#EBE6DD] dark:border-white/5 shadow-sm space-y-4">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B85C38]">Print Options Matrix</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          {/* Sizes */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#7A6F64] dark:text-[#B7AA9C] block">Allowed Sizes</span>
                            <div className="flex flex-wrap gap-1">
                              {newTemplate.available_sizes.length > 0 ? (
                                newTemplate.available_sizes.map(size => (
                                  <span key={size} className="px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-black/20 border border-[#EBE6DD] dark:border-white/5 text-[9px] font-mono text-[#1C1814] dark:text-[#F5F0E8]">
                                    {size}
                                  </span>
                                ))
                              ) : (
                                <span className="text-red-500 italic text-[10px]">None chosen</span>
                              )}
                            </div>
                          </div>

                          {/* Papers */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#7A6F64] dark:text-[#B7AA9C] block">Paper Finishes</span>
                            <div className="flex flex-wrap gap-1">
                              {newTemplate.paper_options.length > 0 ? (
                                newTemplate.paper_options.map(paper => (
                                  <span key={paper} className="px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-black/20 border border-[#EBE6DD] dark:border-white/5 text-[9px] capitalize text-[#1C1814] dark:text-[#F5F0E8]">
                                    {paper}
                                  </span>
                                ))
                              ) : (
                                <span className="text-red-500 italic text-[10px]">None chosen</span>
                              )}
                            </div>
                          </div>

                          {/* Covers */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#7A6F64] dark:text-[#B7AA9C] block">Cover Types</span>
                            <div className="flex flex-wrap gap-1">
                              {newTemplate.cover_options.length > 0 ? (
                                newTemplate.cover_options.map(cover => (
                                  <span key={cover} className="px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-black/20 border border-[#EBE6DD] dark:border-white/5 text-[9px] capitalize text-[#1C1814] dark:text-[#F5F0E8]">
                                    {cover}
                                  </span>
                                ))
                              ) : (
                                <span className="text-red-500 italic text-[10px]">None chosen</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-7 py-5 bg-white dark:bg-[#1A1613] border-t border-[#EBE6DD] dark:border-white/10 flex justify-between shrink-0 rounded-b-2xl transition-colors">
              <button
                disabled={wizardStep === 1 || uploadingFiles}
                onClick={handleBackStep}
                className="px-6 py-2.5 border border-[#EBE6DD] dark:border-white/10 text-[#7A6F64] dark:text-[#B7AA9C] text-[11px] font-bold uppercase tracking-[0.15em] hover:text-[#1C1814] dark:hover:text-[#F5F0E8] hover:border-[#1C1814]/20 dark:hover:border-white/20 transition-all disabled:opacity-20 rounded-lg"
              >
                Back
              </button>

              {wizardStep === 1 && (
                <button
                  onClick={uploadWizardFiles}
                  disabled={uploadingFiles || (pdfState.status !== 'success' && (pdfUploadMethod === 'upload' ? !backgroundFile : !pdfLinkUrl.trim()))}
                  className="px-6 py-2.5 bg-[#1C1814] text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#1C1814]/85 transition-all disabled:opacity-40 rounded-lg flex items-center gap-2"
                >
                  {uploadingFiles && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {uploadingFiles ? 'Uploading...' : 'Next: Design Slots'}
                </button>
              )}

              {wizardStep === 3 && (
                <button
                  onClick={() => setWizardStep(4)}
                  disabled={!newTemplate.name || !newTemplate.name.trim()}
                  className="px-6 py-2.5 bg-[#1C1814] text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#1C1814]/85 transition-all rounded-lg disabled:opacity-40"
                >
                  Next: Review &amp; Publish
                </button>
              )}

              {wizardStep === 4 && (
                <button
                  onClick={handleWizardSubmit}
                  disabled={creating}
                  className="px-8 py-3 bg-[#B85C38] text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#B85C38]/90 transition-all disabled:opacity-40 rounded-lg shadow-lg shadow-[#B85C38]/20 flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? 'Publishing...' : 'Publish Template'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
