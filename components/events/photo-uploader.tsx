'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    
    if (isGuest && !allowGuestUploads) return

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
        
        // Insert record into photos table
        await supabase.from('photos').insert({
          event_id: eventId,
          uploader_id: user.id,
          blob_url: publicUrl,
          blob_pathname: filePath,
          thumbnail_url: publicUrl,
          original_filename: file.name,
          file_size: file.size,
          is_host_photo: isManager ?? false,
          // Managers are approved; guests can be auto-approved by event setting.
          status: isManager || (isGuest && autoApproveGuestUploads) ? 'approved' : 'pending',
          processing_status: 'pending' as any // Image processing status (faces etc)
        } as any)
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
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-surface/50 transition-colors">
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
          disabled={uploading || (isGuest && !allowGuestUploads)}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl mb-2">
            {isGuest && !allowGuestUploads
              ? 'Guest uploads disabled'
              : uploading
              ? 'Uploading...'
              : 'Upload Photos'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isGuest && !allowGuestUploads
              ? 'The host has disabled guest uploads for this event.'
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
              {isGuest && !allowGuestUploads
                ? 'Uploads currently blocked'
                : autoApproveGuestUploads
                ? 'Uploads auto-approved'
                : 'Upload pending approval'}
            </strong>
            <p className="text-primary/80">
              {isGuest && !allowGuestUploads
                ? 'You can still view shared photos, but only event managers can upload right now.'
                : autoApproveGuestUploads
                ? 'Your photos are published automatically for the event after upload.'
                : 'Photos you upload will be reviewed by the host before they become visible to other guests. You can see your own pending uploads below.'}
            </p>
            {requireGuestFaceEnrollment && (
              <p className="text-primary/80 mt-2">This event may require face enrollment for personalized album access.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
