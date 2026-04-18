'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PhotoUploader({ eventId, isHost }: { eventId: string; isHost: boolean }) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload each file
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const filePath = `${eventId}/${Math.random()}.${fileExt}`
        
        // This assumes a 'photos' bucket exists
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
          thumbnail_url: publicUrl, // using same url for simplicity
          original_filename: file.name,
          file_size: file.size,
          is_host_photo: isHost,
          processing_status: 'pending' as any // ignoring type issue if enum mismatched
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
    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-surface/50 transition-colors">
      <input 
        type="file" 
        id="file-upload" 
        multiple 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload} 
        disabled={uploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <Upload className="w-8 h-8 text-muted-foreground mb-4" />
        <h3 className="font-serif text-xl mb-2">{uploading ? 'Uploading...' : 'Upload Photos'}</h3>
        <p className="text-sm text-muted-foreground">Click or drag and drop to upload photos to this event.</p>
      </label>
    </div>
  )
}
