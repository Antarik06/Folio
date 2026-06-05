'use client'

import { useState } from 'react'
import { Upload, Cloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { apiClient, BACKEND_URL } from '@/lib/api-client'
import { loadGoogleScripts, authenticateGoogleDrive, GoogleDriveFile } from '@/lib/google-drive'
import { GoogleDrivePicker } from './google-drive-picker'

interface PhotoUploaderProps {
  eventId: string
  isManager?: boolean
  isGuest?: boolean
  allowGuestUploads?: boolean
  autoApproveGuestUploads?: boolean
  requireGuestFaceEnrollment?: boolean
}

interface UploadQueueItem {
  id: string
  name: string
  progress: number
  status: 'pending' | 'downloading' | 'uploading' | 'registering' | 'completed' | 'failed'
  error?: string
}

// Cache to store ongoing CDN script loading promises to prevent race conditions
const scriptPromises: { [key: string]: Promise<void> | undefined } = {}

// Dynamically load a script from a CDN URL (shared loader with race-condition prevention)
function loadCdnScript(id: string, src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  // If there's an ongoing load request or it already completed, reuse that promise
  if (scriptPromises[id]) {
    return scriptPromises[id]
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Clean up the cache and script element on failure so subsequent calls can retry
      delete scriptPromises[id]
      const el = document.getElementById(id)
      if (el) el.remove()
      reject(new Error(`Failed to load script: ${src}`))
    }
    document.body.appendChild(script)
  })

  scriptPromises[id] = promise
  return promise
}

// Dynamically load UTIF.js script for TIFF decoding
function loadUtifScript(): Promise<void> {
  return loadCdnScript('utif-js-cdn', 'https://cdnjs.cloudflare.com/ajax/libs/utif.js/3.1.0/UTIF.min.js')
}

// Dynamically load heic-to from CDN (bypasses Turbopack WASM/Worker bundling issues and has better compatibility with newer HEIC formats)
function loadHeicToScript(): Promise<void> {
  return loadCdnScript('heic-to-cdn', 'https://cdn.jsdelivr.net/npm/heic-to@1.5.2/dist/iife/heic-to.js')
}

// Convert TIFF blob to high-fidelity JPEG Blob
async function convertTiffToJpeg(blob: Blob): Promise<Blob> {
  await loadUtifScript()
  const UTIF = (window as any).UTIF
  if (!UTIF) throw new Error('TIFF library failed to initialize')

  const buffer = await blob.arrayBuffer()
  const ifds = UTIF.decode(buffer)
  if (!ifds || ifds.length === 0) throw new Error('Invalid TIFF structure')
  
  UTIF.decodeImage(buffer, ifds[0])
  const rgba = UTIF.toRGBA8(ifds[0])
  const width = ifds[0].width || (ifds[0].t256 && ifds[0].t256[0])
  const height = ifds[0].height || (ifds[0].t257 && ifds[0].t257[0])
  if (!width || !height) throw new Error('Could not determine TIFF image dimensions')

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not initialize canvas context')

  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height)
  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((convertedBlob) => {
      if (convertedBlob) resolve(convertedBlob)
      else reject(new Error('Failed to export TIFF to JPEG'))
    }, 'image/jpeg', 0.98) // Highest bit rate/quality
  })
}

// Convert HEIC blob to high-fidelity JPEG Blob
// Loaded via CDN to bypass Turbopack WASM/Worker bundling issues with heic2any/heic-to
async function convertHeicToJpeg(blob: Blob): Promise<Blob> {
  await loadHeicToScript()
  const HeicTo = (window as any).HeicTo
  if (!HeicTo) throw new Error('HEIC conversion library failed to initialize')

  const converted = await HeicTo({
    blob,
    type: 'image/jpeg',
    quality: 0.98 // Highest bit rate/quality
  })
  return converted
}

export function PhotoUploader({
  eventId,
  isManager = false,
  isGuest = false,
  allowGuestUploads = true,
  autoApproveGuestUploads = false,
  requireGuestFaceEnrollment = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [loadingGoogleSdk, setLoadingGoogleSdk] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  
  // Custom Google Drive Picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Guest permission bypass check
  const canUpload = isManager || (isGuest && allowGuestUploads)

  // Environment configurations for Google Picker
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''

  // Common upload worker pool runner with format conversions
  async function runUploadBatch(
    items: { id: string; name: string; file?: File; driveFile?: GoogleDriveFile; token?: string }[]
  ) {
    setUploading(true)
    const limit = 3
    const executing = new Set<Promise<void>>()

    for (const item of items) {
      const p = (async () => {
        try {
          let fileExt = 'jpg'
          let uploadPayload: File | Blob
          let finalName = item.name

          if (item.file) {
            // Local upload
            fileExt = item.file.name.split('.').pop() || 'jpg'
            uploadPayload = item.file
            
            // Set initial upload progress
            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, status: 'uploading', progress: 20 } : q))
            )
          } else if (item.driveFile) {
            // Drive download & upload
            const driveFile = item.driveFile
            fileExt = driveFile.name.split('.').pop() || 'jpg'
            
            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, status: 'downloading', progress: 15 } : q))
            )

            // Real picker: fetch via backend proxy to bypass CORS
            const { data: { user: verifiedUser } } = await supabase.auth.getUser()
            if (!verifiedUser) throw new Error('Not authenticated')
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(
              `${BACKEND_URL}/api/photos/proxy-google-drive?fileId=${driveFile.id}&token=${item.token}`,
              {
                headers: {
                  Authorization: `Bearer ${session?.access_token || ''}`,
                },
              }
            )
            if (!response.ok) {
              const errJson = await response.json().catch(() => ({}))
              throw new Error(errJson.error || 'Failed to download image from Google Drive via backend proxy')
            }
            uploadPayload = await response.blob()

            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q))
            )
          } else {
            throw new Error('Invalid upload payload')
          }

          // Check formats and convert unrenderable types (HEIC & TIFF)
          const lowerName = finalName.toLowerCase()
          const isHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif')
          const isTiff = lowerName.endsWith('.tiff') || lowerName.endsWith('.tif')

          if (isHeic) {
            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, status: 'downloading', progress: 35, name: `${item.name} (Converting...)` } : q))
            )
            try {
              uploadPayload = await convertHeicToJpeg(uploadPayload)
              fileExt = 'jpg'
              finalName = finalName.replace(/\.(heic|heif)$/i, '.jpg')
              setUploadQueue(prev =>
                prev.map(q => (q.id === item.id ? { ...q, name: finalName } : q))
              )
            } catch (err: any) {
              const errMsg = err?.message || err?.code || (typeof err === 'string' ? err : JSON.stringify(err))
              console.error('HEIC conversion error:', errMsg, err)
              throw new Error(`HEIC conversion failed: ${errMsg}`)
            }
          } else if (isTiff) {
            setUploadQueue(prev =>
              prev.map(q => (q.id === item.id ? { ...q, status: 'downloading', progress: 35, name: `${item.name} (Converting...)` } : q))
            )
            try {
              uploadPayload = await convertTiffToJpeg(uploadPayload)
              fileExt = 'jpg'
              finalName = finalName.replace(/\.(tiff|tif)$/i, '.jpg')
              setUploadQueue(prev =>
                prev.map(q => (q.id === item.id ? { ...q, name: finalName } : q))
              )
            } catch (err: any) {
              console.error('TIFF conversion error:', err)
              throw new Error(`TIFF conversion failed: ${err.message || err}`)
            }
          }

          // Generate file path
          const randomString = Math.random().toString(36).substring(2, 15)
          const filePath = `${eventId}/${randomString}.${fileExt}`

          setUploadQueue(prev =>
            prev.map(q => (q.id === item.id ? { ...q, status: 'uploading', progress: 60 } : q))
          )

          // Execute Supabase Upload
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, uploadPayload, {
              contentType: (uploadPayload as any).type || (fileExt === 'jpg' ? 'image/jpeg' : 'application/octet-stream')
            })

          if (uploadError) throw uploadError

          setUploadQueue(prev =>
            prev.map(q => (q.id === item.id ? { ...q, status: 'registering', progress: 85 } : q))
          )

          // Fetch public URL
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)

          // Insert photo record in db
          await apiClient.post('/api/photos', {
            eventId,
            blobUrl: publicUrl,
            status: isManager ? 'approved' : 'pending',
            originalFilename: finalName
          })

          setUploadQueue(prev =>
            prev.map(q => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
          )
        } catch (err: any) {
          console.error(`Upload failed for ${item.name}:`, err)
          setUploadQueue(prev =>
            prev.map(q => (q.id === item.id ? { ...q, status: 'failed', progress: 100, error: err.message || 'Upload failed' } : q))
          )
        }
      })()

      executing.add(p)
      p.then(() => executing.delete(p))

      // Wait if limit is reached
      if (executing.size >= limit) {
        await Promise.race(executing)
      }
    }

    await Promise.all(executing)
    setUploading(false)
    router.refresh()
  }

  // Handle local file uploads
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newItems = Array.from(files).map((file, idx) => ({
        id: `local-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        progress: 0,
        status: 'pending' as const,
        file,
      }))

      setUploadQueue(prev => [...prev, ...newItems])
      
      // Start batch upload
      await runUploadBatch(newItems)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'An error occurred during file upload')
    }
  }

  // Handle Google Drive file selections
  async function handleGoogleDriveImport(files: GoogleDriveFile[], token?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newItems = files.map((file, idx) => ({
        id: `drive-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        progress: 0,
        status: 'pending' as const,
        driveFile: file,
        token,
      }))

      setUploadQueue(prev => [...prev, ...newItems])
      
      // Start batch upload
      await runUploadBatch(newItems)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'An error occurred during Drive import')
    }
  }

  // Initialize and open Google Drive picker
  async function triggerGoogleDrivePicker() {
    if (!googleClientId || !googleApiKey) {
      alert('Google Drive Importer is not configured. Please define NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables to use this feature.')
      return
    }

    setLoadingGoogleSdk(true)
    try {
      await loadGoogleScripts()
      const token = await authenticateGoogleDrive(googleClientId)
      setAccessToken(token)
      setIsPickerOpen(true)
    } catch (err: any) {
      console.error('Google Auth error:', err)
      alert(err.message || 'Failed to authenticate with Google')
    } finally {
      setLoadingGoogleSdk(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone Card */}
      <div className={`border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors relative bg-card/40 ${
        !canUpload ? 'opacity-80' : 'hover:bg-surface/30'
      }`}>
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          accept="image/*,.heic,.heif,.tiff,.tif" 
          className="hidden" 
          onChange={handleFileUpload} 
          disabled={uploading || !canUpload}
        />
        
        <label 
          htmlFor={!canUpload ? undefined : "file-upload"} 
          className={!canUpload ? "flex flex-col items-center cursor-not-allowed" : "cursor-pointer flex flex-col items-center"}
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl mb-2">
            {!canUpload
              ? 'Members: View-only'
              : uploading
              ? 'Uploading Photos...'
              : 'Upload Photos'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {!canUpload
              ? 'Only event hosts and approved collaborators can upload photos.'
              : 'Click or drag and drop to upload photos to this event.'}
          </p>
        </label>

        {/* Action Button Strip */}
        {canUpload && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={triggerGoogleDrivePicker}
              disabled={uploading || loadingGoogleSdk}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-background hover:bg-surface rounded-lg transition-colors font-medium text-xs shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGoogleSdk ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-500" />
              )}
              Import from Google Drive
            </button>
          </div>
        )}
      </div>

      {/* Progress Queue Dashboard */}
      {uploadQueue.length > 0 && (
        <div className="border border-border/60 rounded-xl bg-card/60 p-4 space-y-3 glassmorphism transition-all duration-300">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h4 className="text-xs font-serif font-bold tracking-wide text-foreground">Upload Queue ({uploadQueue.length})</h4>
            <button 
              onClick={() => setUploadQueue([])}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Clear Queue
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {uploadQueue.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between text-xs gap-4 p-2 bg-surface/30 border border-border/30 rounded-lg hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {item.status === 'completed' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />}
                  {item.status === 'failed' && <AlertCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />}
                  {(item.status === 'downloading' || item.status === 'uploading' || item.status === 'registering') && (
                    <Loader2 className="w-4.5 h-4.5 text-blue-500 animate-spin flex-shrink-0" />
                  )}
                  {item.status === 'pending' && <div className="w-4.5 h-4.5 rounded-full border border-border flex-shrink-0" />}
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate" title={item.name}>{item.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {item.status === 'downloading' && 'Downloading from Google Drive...'}
                      {item.status === 'uploading' && `Uploading to Supabase... ${item.progress}%`}
                      {item.status === 'registering' && 'Registering in DB...'}
                      {item.status === 'completed' && 'Completed'}
                      {item.status === 'failed' && (item.error || 'Failed')}
                      {item.status === 'pending' && 'Pending...'}
                    </p>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                {(item.status === 'uploading' || item.status === 'downloading' || item.status === 'registering') && (
                  <div className="w-24 bg-border/40 h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Mode Warn Banners */}
      {isGuest && !allowGuestUploads && (
        <div className="p-4 bg-primary/10 border border-primary/20 flex items-start gap-3 rounded-lg">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <strong className="text-primary font-medium block mb-1">
              View-only Mode
            </strong>
            <p className="text-primary/80 leading-relaxed">
              You are viewing this event as a member. If you want to contribute photos, tag people, or organize files, please ask the host to approve you as a collaborator.
            </p>
          </div>
        </div>
      )}

      {/* Custom Premium Google Drive Picker Modal */}
      <GoogleDrivePicker
        isOpen={isPickerOpen}
        accessToken={accessToken}
        googleApiKey={googleApiKey}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(files) => handleGoogleDriveImport(files, accessToken || undefined)}
      />
    </div>
  )
}
