'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── PERMISSION HELPERS ──────────────────────────────────────────────────────

/**
 * Returns full role info for the current user in a given event.
 */
export async function getUserEventRole(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { role: null, isOwner: false, isCollaborator: false, isGuest: false }

  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  if (event?.host_id === user.id) {
    return { role: 'owner' as const, isOwner: true, isCollaborator: false, isGuest: false }
  }

  const { data: guestRecord } = await supabase
    .from('event_guests')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  const role = guestRecord?.role
  return {
    role: role ?? null,
    isOwner: false,
    isCollaborator: role === 'collaborator',
    isGuest: role === 'guest',
  }
}

/**
 * Checks if the current user is a manager (owner OR collaborator) for an event.
 */
async function assertManager(eventId: string, userId: string) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  if (event?.host_id === userId) return { event, ok: true }

  const { data: guest } = await supabase
    .from('event_guests')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single()

  return { event, ok: guest?.role === 'collaborator' }
}

/**
 * Checks if the current user is strictly the owner (host) of an event.
 */
async function assertOwner(eventId: string, userId: string) {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()
  return { event, ok: event?.host_id === userId }
}

interface UpdateEventSettingsInput {
  title: string
  description: string | null
  eventDate: string | null
  location: string | null
  status: string
  coverPhotoId: string | null
  allowGuestUploads: boolean
  autoApproveGuestUploads: boolean
  requireGuestFaceEnrollment: boolean
}

export async function updateEventSettings(eventId: string, input: UpdateEventSettingsInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { ok } = await assertManager(eventId, user.id)
  if (!ok) return { error: 'Not authorized.' }

  const allowedStatuses = new Set(['draft', 'active', 'processing', 'completed', 'archived'])
  if (!allowedStatuses.has(input.status)) {
    return { error: 'Invalid event status.' }
  }

  const { data: currentEvent } = await supabase
    .from('events')
    .select('settings')
    .eq('id', eventId)
    .single()

  const currentSettings =
    currentEvent?.settings && typeof currentEvent.settings === 'object' && !Array.isArray(currentEvent.settings)
      ? (currentEvent.settings as Record<string, unknown>)
      : {}

  const nextSettings = {
    ...currentSettings,
    location: input.location,
    allow_guest_uploads: input.allowGuestUploads,
    auto_approve_guest_uploads: input.autoApproveGuestUploads,
    require_guest_face_enrollment: input.requireGuestFaceEnrollment,
  }

  let nextCoverImageUrl: string | null = null
  if (input.coverPhotoId) {
    const { data: coverPhoto } = await supabase
      .from('photos')
      .select('id, event_id, thumbnail_url, blob_url')
      .eq('id', input.coverPhotoId)
      .eq('event_id', eventId)
      .single()

    if (!coverPhoto) {
      return { error: 'Selected event art photo was not found.' }
    }

    nextCoverImageUrl = coverPhoto.thumbnail_url || coverPhoto.blob_url || null
  }

  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update({
      title: input.title,
      description: input.description,
      event_date: input.eventDate,
      status: input.status,
      cover_image_url: nextCoverImageUrl,
      settings: nextSettings,
    })
    .eq('id', eventId)
    .select('id, title, description, event_date, status, settings, updated_at')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true, event: updatedEvent }
}

// ─── JOIN EVENT ──────────────────────────────────────────────────────────────

/**
 * Looks up an event by guest invite code OR collaborator invite code,
 * and registers the current user with the appropriate role.
 */
export async function joinEvent(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to join an event.' }

  const normalizedCode = inviteCode.toUpperCase().trim()

  // 1. Try guest invite code
  let { data: event } = await supabase
    .from('events')
    .select('id, title, host_id, status')
    .eq('invite_code', normalizedCode)
    .single()

  let role: 'guest' | 'collaborator' = 'guest'

  // 2. If not found, try collaborator_invite_code column
  if (!event) {
    const { data: colEvent } = await supabase
      .from('events')
      .select('id, title, host_id, status')
      .eq('collaborator_invite_code', normalizedCode)
      .single()

    if (!colEvent) {
      // 3. Fallback: try collaborator code stored in settings JSONB (legacy)
      const { data: legacyEvent } = await supabase
        .from('events')
        .select('id, title, host_id, status')
        .eq('settings->>collaborator_invite_code', normalizedCode)
        .single()

      if (!legacyEvent) {
        return { error: 'Invalid invite code. Please check and try again.' }
      }
      event = legacyEvent
    } else {
      event = colEvent
    }
    role = 'collaborator'
  }

  // Cannot join your own event
  if (event.host_id === user.id) {
    return { alreadyHost: true, eventId: event.id }
  }

  // Check if already a member
  const { data: existingGuest } = await supabase
    .from('event_guests')
    .select('id, role, face_enrolled')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (existingGuest) {
    // Upgrade: guest → collaborator if using collaborator code
    if (existingGuest.role === 'guest' && role === 'collaborator') {
      await supabase
        .from('event_guests')
        .update({ role: 'collaborator' })
        .eq('id', existingGuest.id)
      revalidatePath(`/events/${event.id}`)
      return {
        eventId: event.id,
        guestId: existingGuest.id,
        alreadyJoined: false,
        faceEnrolled: existingGuest.face_enrolled ?? false,
        role: 'collaborator' as const,
      }
    }
    return {
      eventId: event.id,
      guestId: existingGuest.id,
      alreadyJoined: true,
      faceEnrolled: existingGuest.face_enrolled ?? false,
      role: existingGuest.role as 'guest' | 'collaborator',
    }
  }

  // Insert new member
  const { data: newGuest, error: insertError } = await supabase
    .from('event_guests')
    .insert({ event_id: event.id, user_id: user.id, role })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to insert event guest:', insertError)
    return { error: 'Failed to join event. Please try again.' }
  }

  revalidatePath(`/events/${event.id}`)
  return { eventId: event.id, guestId: newGuest.id, alreadyJoined: false, faceEnrolled: false, role }
}

// ─── GET EVENT BY INVITE CODE (public lookup) ────────────────────────────────

/**
 * Resolves an event from either a guest or collaborator invite code.
 * Returns the event AND which type of code was matched.
 */
export async function getEventByInviteCode(code: string) {
  const supabase = await createClient()
  const normalizedCode = code.toUpperCase().trim()

  // Try guest invite code
  let { data: event } = await supabase
    .from('events')
    .select(`
      id, host_id, title, description, event_date,
      cover_image_url, settings, status, invite_code,
      collaborator_invite_code,
      profiles!events_host_id_fkey(full_name, avatar_url)
    `)
    .eq('invite_code', normalizedCode)
    .single()

  let codeType: 'guest' | 'collaborator' = 'guest'

  if (!event) {
    // Try collaborator_invite_code column
    const { data: colEvent } = await supabase
      .from('events')
      .select(`
        id, host_id, title, description, event_date,
        cover_image_url, settings, status, invite_code,
        collaborator_invite_code,
        profiles!events_host_id_fkey(full_name, avatar_url)
      `)
      .eq('collaborator_invite_code', normalizedCode)
      .single()

    if (!colEvent) {
      // Fallback: JSONB settings
      const { data: legacyColEvent } = await supabase
        .from('events')
        .select(`
          id, host_id, title, description, event_date,
          cover_image_url, settings, status, invite_code,
          collaborator_invite_code,
          profiles!events_host_id_fkey(full_name, avatar_url)
        `)
        .eq('settings->>collaborator_invite_code', normalizedCode)
        .single()

      event = legacyColEvent
    } else {
      event = colEvent
    }
    codeType = 'collaborator'
  }

  if (!event) return null
  return { ...event, codeType }
}

// ─── GENERATE COLLABORATOR CODE ──────────────────────────────────────────────

/**
 * Generates or regenerates a collaborator invite code. Owner only.
 */
export async function generateCollaboratorCode(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { ok } = await assertOwner(eventId, user.id)
  if (!ok) return { error: 'Only the event owner can generate a collaborator code.' }

  const code = 'COL-' + Math.random().toString(36).slice(2, 8).toUpperCase()

  // Store in both the new column AND settings for backward compat
  const { data: currentEvent } = await supabase
    .from('events')
    .select('settings')
    .eq('id', eventId)
    .single()

  await supabase
    .from('events')
    .update({
      collaborator_invite_code: code,
      settings: { ...(currentEvent?.settings as any || {}), collaborator_invite_code: code },
    })
    .eq('id', eventId)

  revalidatePath(`/events/${eventId}`)
  return { success: true, code }
}

// ─── ENROLL FACE ─────────────────────────────────────────────────────────────

export async function enrollFace(eventId: string, selfieUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('event_guests')
    .update({ face_reference_url: selfieUrl, face_enrolled: true })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to save face enrollment. Please try again.' }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── GUEST: GET MY PHOTOS ────────────────────────────────────────────────────

/**
 * For a guest: returns approved photos + their own uploads (any status).
 */
export async function getMyEventPhotos(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { photos: [], error: 'Not authenticated.' }

  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .or(`uploader_id.eq.${user.id},and(is_shared.eq.true,status.eq.approved)`)
    .order('created_at', { ascending: false })

  if (error) return { photos: [], error: error.message }
  return { photos: photos ?? [] }
}

// ─── MANAGER: TOGGLE PHOTO SHARED ────────────────────────────────────────────

export async function togglePhotoShared(photoId: string, currentIsShared: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: photo } = await supabase
    .from('photos')
    .select('event_id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Photo not found.' }
  const { ok } = await assertManager(photo.event_id, user.id)
  if (!ok) return { error: 'Not authorized.' }

  const { error } = await supabase
    .from('photos')
    .update({ is_shared: !currentIsShared })
    .eq('id', photoId)

  if (error) return { error: error.message }
  revalidatePath(`/events/${photo.event_id}`)
  return { success: true, isShared: !currentIsShared }
}

// ─── MANAGER: SHARE ALL PHOTOS ───────────────────────────────────────────────

export async function shareAllPhotos(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { ok } = await assertManager(eventId, user.id)
  if (!ok) return { error: 'Not authorized.' }

  const { error } = await supabase
    .from('photos')
    .update({ is_shared: true })
    .eq('event_id', eventId)
    .eq('is_shared', false)
    .eq('status', 'approved')

  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── MANAGER: APPROVE/REJECT GUEST PHOTO ─────────────────────────────────────

/**
 * Approves a pending guest photo. Manager only.
 */
export async function approvePhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: photo } = await supabase
    .from('photos')
    .select('event_id, status')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Photo not found.' }
  const { ok } = await assertManager(photo.event_id, user.id)
  if (!ok) return { error: 'Not authorized.' }

  const { error } = await supabase
    .from('photos')
    .update({ status: 'approved' })
    .eq('id', photoId)

  if (error) return { error: error.message }
  revalidatePath(`/events/${photo.event_id}`)
  return { success: true }
}

/**
 * Rejects (deletes) a pending guest photo. Manager only.
 */
export async function rejectPhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: photo } = await supabase
    .from('photos')
    .select('event_id, blob_url, thumbnail_url')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Photo not found.' }
  const { ok } = await assertManager(photo.event_id, user.id)
  if (!ok) return { error: 'Not authorized.' }

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) return { error: error.message }
  revalidatePath(`/events/${photo.event_id}`)
  return { success: true }
}

/**
 * Deletes a photo. RLS handles permissions 
 * (managers can delete all, guests can delete only their own uploads).
 */
export async function deletePhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: photo } = await supabase
    .from('photos')
    .select('event_id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Photo not found.' }

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) return { error: error.message }
  revalidatePath(`/events/${photo.event_id}`)
  return { success: true }
}

// ─── GUEST: CHECK ENROLLMENT STATUS ──────────────────────────────────────────

export async function getGuestEnrollmentStatus(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('event_guests')
    .select('id, face_enrolled, face_reference_url, role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  return data
}

// ─── OWNER: REMOVE GUEST OR COLLABORATOR ─────────────────────────────────────

/**
 * Removes a guest or collaborator from an event.
 * - Owners can remove anyone.
 * - Collaborators can only remove guests (not other collaborators).
 */
export async function removeGuest(guestId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  const isOwner = event?.host_id === user.id

  // Fetch the target guest record
  const { data: targetGuest } = await supabase
    .from('event_guests')
    .select('user_id, role, face_reference_url, face_enrolled')
    .eq('id', guestId)
    .single()

  if (!targetGuest) return { error: 'Guest not found.' }

  // Collaborators can only remove regular guests, not other collaborators
  if (!isOwner) {
    const { data: callerGuest } = await supabase
      .from('event_guests')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (callerGuest?.role !== 'collaborator') return { error: 'Not authorized.' }
    if (targetGuest.role === 'collaborator') {
      return { error: 'Only the event owner can remove collaborators.' }
    }
  }

  const { error } = await supabase
    .from('event_guests')
    .delete()
    .eq('id', guestId)

  if (error) return { error: error.message }

  // Clean up face photo if enrolled
  if (targetGuest.face_enrolled && targetGuest.user_id) {
    await supabase.storage
      .from('face-photos')
      .remove([`${targetGuest.user_id}/${eventId}.jpg`])
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── ALBUM MANAGEMENT: RENAME / COVER ART / DELETE ──────────────────────────

async function getManageableAlbum(albumId: string, userId: string) {
  const supabase = await createClient()

  const { data: album } = await supabase
    .from('albums')
    .select('id, event_id, owner_id')
    .eq('id', albumId)
    .single()

  if (!album) {
    return { album: null, error: 'Album not found.' }
  }

  if (album.owner_id === userId) {
    return { album, error: null }
  }

  const { ok } = await assertManager(album.event_id, userId)
  if (!ok) {
    return { album: null, error: 'Not authorized.' }
  }

  return { album, error: null }
}

export async function renameAlbum(albumId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const nextTitle = title.trim()
  if (!nextTitle) return { error: 'Album name cannot be empty.' }

  const { album, error: permissionError } = await getManageableAlbum(albumId, user.id)
  if (permissionError || !album) return { error: permissionError || 'Album not found.' }

  const nowIso = new Date().toISOString()
  const { data: updatedAlbum, error } = await supabase
    .from('albums')
    .update({ title: nextTitle, updated_at: nowIso })
    .eq('id', albumId)
    .select('id, title, cover_photo_id, updated_at')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/events/${album.event_id}`)
  revalidatePath('/dashboard')
  return { success: true, album: updatedAlbum }
}

export async function updateAlbumCoverPhoto(albumId: string, coverPhotoId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { album, error: permissionError } = await getManageableAlbum(albumId, user.id)
  if (permissionError || !album) return { error: permissionError || 'Album not found.' }

  if (coverPhotoId) {
    const { data: photo } = await supabase
      .from('photos')
      .select('id, event_id')
      .eq('id', coverPhotoId)
      .single()

    if (!photo || photo.event_id !== album.event_id) {
      return { error: 'Selected photo is not part of this event.' }
    }
  }

  const nowIso = new Date().toISOString()
  const { data: updatedAlbum, error } = await supabase
    .from('albums')
    .update({ cover_photo_id: coverPhotoId, updated_at: nowIso })
    .eq('id', albumId)
    .select('id, title, cover_photo_id, updated_at')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/events/${album.event_id}`)
  revalidatePath('/dashboard')
  return { success: true, album: updatedAlbum }
}

export async function deleteAlbum(albumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { album, error: permissionError } = await getManageableAlbum(albumId, user.id)
  if (permissionError || !album) return { error: permissionError || 'Album not found.' }

  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${album.event_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── OWNER: DELETE EVENT ─────────────────────────────────────────────────────

/**
 * Deletes an entire event and all associated data (photos, guests, albums).
 * Owner only.
 */
export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { ok } = await assertOwner(eventId, user.id)
  if (!ok) return { error: 'Only the event owner can delete this event.' }

  // Get event details before deletion (including host_id for storage cleanup)
  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Event not found.' }

  // Get all face reference URLs for cleanup
  const { data: guestFaceRefs } = await supabase
    .from('event_guests')
    .select('user_id, face_reference_url, face_enrolled')
    .eq('event_id', eventId)
    .eq('face_enrolled', true)

  // Delete the event (cascade will handle photos, guests, albums)
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (deleteError) return { error: deleteError.message }

  // Clean up face photos from storage
  if (guestFaceRefs && guestFaceRefs.length > 0) {
    const facePaths = guestFaceRefs
      .filter(g => g.face_enrolled)
      .map(g => `${g.user_id}/${eventId}.jpg`)

    if (facePaths.length > 0) {
      await supabase.storage
        .from('face-photos')
        .remove(facePaths)
    }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  return { success: true }
}
