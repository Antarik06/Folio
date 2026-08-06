import { query } from '../db'
import { eventService, fetchEventPhotos, EVENT_PHOTO_LIMIT } from './eventService'
import { deleteStorageObjects } from '../utils/storage'

export const photoService = {
  /**
   * For guest: returns approved photos + their own uploads + photos the face
   * matcher recognised them in.
   * For manager: returns all photos.
   */
  async getEventPhotos(eventId: string, userId: string, limit = EVENT_PHOTO_LIMIT, offset = 0): Promise<any[]> {
    const isManager = await eventService.assertManager(eventId, userId)
    return fetchEventPhotos(eventId, userId, isManager, { limit, offset })
  },

  /**
   * Toggles photo shared flag. Manager only.
   */
  async togglePhotoShared(photoId: string, userId: string): Promise<boolean> {
    const photoRes = await query('SELECT event_id, is_shared FROM public.photos WHERE id = $1', [photoId])
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized.')
    }

    const nextIsShared = !photo.is_shared
    await query('UPDATE public.photos SET is_shared = $2 WHERE id = $1', [photoId, nextIsShared])
    return nextIsShared
  },

  /**
   * Share all approved photos in an event. Manager only.
   */
  async shareAllPhotos(eventId: string, userId: string): Promise<void> {
    const isManager = await eventService.assertManager(eventId, userId)
    if (!isManager) {
      throw new Error('Not authorized.')
    }

    await query(
      "UPDATE public.photos SET is_shared = TRUE WHERE event_id = $1 AND is_shared = FALSE AND status = 'approved'",
      [eventId]
    )
  },

  /**
   * Approves a pending guest photo. Manager only.
   */
  async approvePhoto(photoId: string, userId: string): Promise<void> {
    const photoRes = await query('SELECT event_id FROM public.photos WHERE id = $1', [photoId])
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized.')
    }

    await query("UPDATE public.photos SET status = 'approved' WHERE id = $1", [photoId])
  },

  /**
   * Rejects (deletes) a pending guest photo. Manager only.
   */
  async rejectPhoto(photoId: string, userId: string): Promise<void> {
    const photoRes = await query(
      'SELECT event_id, blob_pathname, blob_url, thumbnail_url FROM public.photos WHERE id = $1',
      [photoId]
    )
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized.')
    }

    await query('DELETE FROM public.photos WHERE id = $1', [photoId])
    await deleteStorageObjects([photo.blob_pathname, photo.blob_url, photo.thumbnail_url])
  },

  /**
   * Deletes a photo. Managers can delete all, guests can delete only their own.
   */
  async deletePhoto(photoId: string, userId: string): Promise<void> {
    const photoRes = await query(
      'SELECT event_id, uploader_id, blob_pathname, blob_url, thumbnail_url FROM public.photos WHERE id = $1',
      [photoId]
    )
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isUploader = photo.uploader_id === userId
    // Skip the role lookup entirely when the caller owns the photo.
    const isManager = isUploader ? false : await eventService.assertManager(photo.event_id, userId)

    if (!isManager && !isUploader) {
      throw new Error('Not authorized.')
    }

    await query('DELETE FROM public.photos WHERE id = $1', [photoId])
    // Drop the underlying objects too, otherwise the bucket keeps growing with
    // files no row references any more.
    await deleteStorageObjects([photo.blob_pathname, photo.blob_url, photo.thumbnail_url])
  },

  /**
   * Register a new photo upload in the database.
   */
  async registerPhoto(input: {
    eventId: string
    uploaderId: string
    blobUrl: string
    blobPathname?: string
    thumbnailUrl?: string
    originalFilename?: string
    fileSize?: number
    width?: number
    height?: number
    folderId?: string | null
  }): Promise<any> {
    // If uploader is manager, auto-approve photo. Else it goes in as pending
    // unless the host enabled auto-approval for guest uploads.
    const isManager = await eventService.assertManager(input.eventId, input.uploaderId)

    let finalStatus: 'pending' | 'approved' | 'rejected' = 'approved'

    if (!isManager) {
      const eventRes = await query('SELECT settings FROM public.events WHERE id = $1', [input.eventId])
      const event = eventRes.rows[0]
      if (!event) {
        throw new Error('Event not found.')
      }

      // Only participants may upload at all.
      const roleInfo = await eventService.getUserEventRole(input.eventId, input.uploaderId)
      if (!roleInfo.role) {
        throw new Error('You are not a participant of this event.')
      }

      const settings = event.settings && typeof event.settings === 'object' ? event.settings : {}
      const allowGuestUploads = settings.allow_guest_uploads ?? false
      if (!allowGuestUploads) {
        throw new Error('Only event hosts and collaborators can upload photos.')
      }

      // The moderation state is decided here, never by the client: a guest was
      // previously able to post status:'approved' and skip review entirely.
      const autoApprove = settings.auto_approve_guest_uploads === true
      finalStatus = autoApprove ? 'approved' : 'pending'
    }

    const uploadedRole = isManager ? 'host' : 'guest'

    const insertRes = await query(
      `INSERT INTO public.photos 
       (event_id, uploader_id, blob_url, blob_pathname, thumbnail_url, original_filename, file_size, width, height, is_host_photo, status, uploaded_by_role, folder_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        input.eventId,
        input.uploaderId,
        input.blobUrl,
        input.blobPathname || '',
        input.thumbnailUrl || input.blobUrl,
        input.originalFilename || 'unnamed.jpg',
        input.fileSize || 0,
        input.width || 0,
        input.height || 0,
        isManager,
        finalStatus,
        uploadedRole,
        input.folderId || null
      ]
    )

    return insertRes.rows[0]
  },

  /**
   * Move photo to another folder (managers only)
   */
  async movePhoto(photoId: string, folderId: string | null, userId: string): Promise<any> {
    const photoRes = await query('SELECT event_id FROM public.photos WHERE id = $1', [photoId])
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized to organize photos in this event.')
    }

    if (folderId) {
      const folderRes = await query('SELECT event_id FROM public.folders WHERE id = $1', [folderId])
      const folder = folderRes.rows[0]
      if (!folder || folder.event_id !== photo.event_id) {
        throw new Error('Target folder does not belong to this event.')
      }
    }

    const updateRes = await query(
      'UPDATE public.photos SET folder_id = $1 WHERE id = $2 RETURNING *',
      [folderId || null, photoId]
    )
    return updateRes.rows[0]
  },

  /**
   * Update people tags in a photo (managers only)
   */
  async updatePhotoTags(photoId: string, peopleTags: string[], userId: string): Promise<any> {
    const photoRes = await query('SELECT event_id FROM public.photos WHERE id = $1', [photoId])
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized to tag people in this event.')
    }

    const updateRes = await query(
      'UPDATE public.photos SET people_tags = $1::jsonb WHERE id = $2 RETURNING *',
      [JSON.stringify(peopleTags), photoId]
    )
    return updateRes.rows[0]
  },

  /**
   * Update photo location (managers only)
   */
  async updatePhotoLocation(photoId: string, location: string | null, userId: string): Promise<any> {
    const photoRes = await query('SELECT event_id FROM public.photos WHERE id = $1', [photoId])
    const photo = photoRes.rows[0]
    if (!photo) {
      throw new Error('Photo not found.')
    }

    const isManager = await eventService.assertManager(photo.event_id, userId)
    if (!isManager) {
      throw new Error('Not authorized to set locations for photos in this event.')
    }

    const updateRes = await query(
      'UPDATE public.photos SET location = $1 WHERE id = $2 RETURNING *',
      [location || null, photoId]
    )
    return updateRes.rows[0]
  }
}
