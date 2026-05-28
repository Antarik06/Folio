'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface PhotoUploaderProps {
  eventId: string
  isManager?: boolean
  isGuest?: boolean
  allowGuestUploads?: boolean
  autoApproveGuestUploads?: boolean
  requireGuestFaceEnrollment?: boolean
}

export function PhotoUploader({
  eventId,
  isManager,
  isGuest,
  allowGuestUploads = true,
  autoApproveGuestUploads = false,
  requireGuestFaceEnrollment = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    if (isGuest) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload each file
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const filePath = `${eventId}/${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file)
          
        if (uploadError) {
           console.error('Upload error', uploadError)
           continue
        }
        
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)
        
        // Insert record via backend Express API
        await apiClient.post('/api/photos', {
          eventId,
          blobUrl: publicUrl,
          status: isManager ? 'approved' : 'pending'
        })
      }
      
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
        isGuest ? 'opacity-80' : 'hover:bg-surface/50'
      }`}>
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
          disabled={uploading || isGuest}
        />
        <label htmlFor={isGuest ? undefined : "file-upload"} className={isGuest ? "flex flex-col items-center cursor-not-allowed" : "cursor-pointer flex flex-col items-center"}>
          <Upload className="w-8 h-8 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl mb-2">
            {isGuest
              ? 'Members: View-only'
              : uploading
              ? 'Uploading...'
              : 'Upload Photos'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isGuest
              ? 'Only event hosts and approved collaborators can upload photos.'
              : 'Click or drag and drop to upload photos to this event.'}
          </p>
        </label>
      </div>

      {isGuest && (
        <div className="p-4 bg-primary/10 border border-primary/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <strong className="text-primary font-medium block mb-1">
              View-only Mode
            </strong>
            <p className="text-primary/80">
              You are viewing this event as a member. If you want to contribute photos, tag people, or organize files, please ask the host to approve you as a collaborator.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
