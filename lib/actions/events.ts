'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── JOIN EVENT ──────────────────────────────────────────────────────────────

/**
 * Looks up an event by invite code and registers the current user as a guest.
 * Returns the event id and whether the user was already a guest.
 */
export async function joinEvent(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in to join an event.' }

  // Look up event by invite code
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, host_id, status')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (eventError || !event) {
    console.error('joinEvent lookup failed:', { inviteCode, eventError })
    return { error: 'Invalid invite code. Please check and try again.' }
  }

  // Cannot join your own event as a guest
  if (event.host_id === user.id) {
    return { alreadyHost: true, eventId: event.id }
  }

  // Check if already a guest
  const { data: existingGuest } = await supabase
    .from('event_guests')
    .select('id, face_enrolled')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (existingGuest) {
    return {
      eventId: event.id,
      guestId: existingGuest.id,
      alreadyJoined: true,
      faceEnrolled: existingGuest.face_enrolled ?? false,
    }
  }

  // Insert as a new guest
  const { data: newGuest, error: insertError } = await supabase
    .from('event_guests')
    .insert({
      event_id: event.id,
      user_id: user.id,
      role: 'guest',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to insert event guest:', insertError)
    return { error: 'Failed to join event. Please try again.' }
  }

  revalidatePath(`/events/${event.id}`)

  return {
    eventId: event.id,
    guestId: newGuest.id,
    alreadyJoined: false,
    faceEnrolled: false,
  }
}

// ─── GET EVENT BY INVITE CODE (public lookup) ─────────────────────────────

export async function getEventByInviteCode(code: string) {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      host_id,
      title,
      description,
      event_date,
      cover_image_url,
      settings,
      status,
      invite_code,
      profiles!events_host_id_fkey(full_name, avatar_url)
    `)
    .eq('invite_code', code.toUpperCase().trim())
    .single()

  return event
}

// ─── ENROLL FACE ─────────────────────────────────────────────────────────────

/**
 * Stores the selfie URL and marks the guest as face-enrolled.
 */
export async function enrollFace(eventId: string, selfieUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('event_guests')
    .update({
      face_reference_url: selfieUrl,
      face_enrolled: true,
    })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to save face enrollment. Please try again.' }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── GUEST: GET MY PHOTOS ────────────────────────────────────────────────────

/**
 * Returns photos visible to the current guest:
 * - Photos they uploaded themselves
 * - Photos marked as is_shared = true by the host
 */
export async function getMyEventPhotos(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { photos: [], error: 'Not authenticated.' }

  // Fetch photos: own uploads OR shared by host
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .or(`uploader_id.eq.${user.id},is_shared.eq.true`)
    .order('created_at', { ascending: false })

  if (error) return { photos: [], error: error.message }

  return { photos: photos ?? [] }
}

// ─── HOST: TOGGLE PHOTO SHARED ───────────────────────────────────────────────

/**
 * Toggles the is_shared flag on a photo. Host only.
 */
export async function togglePhotoShared(photoId: string, currentIsShared: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Verify user is host of the event this photo belongs to
  const { data: photo } = await supabase
    .from('photos')
    .select('event_id, events!inner(host_id)')
    .eq('id', photoId)
    .single()

  if (!photo || (photo.events as any)?.host_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  const { error } = await supabase
    .from('photos')
    .update({ is_shared: !currentIsShared })
    .eq('id', photoId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${photo.event_id}`)
  return { success: true, isShared: !currentIsShared }
}

// ─── HOST: SHARE ALL PHOTOS ──────────────────────────────────────────────────

/**
 * Marks all photos in an event as shared. Host only.
 */
export async function shareAllPhotos(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Verify caller is the event host
  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  if (!event || event.host_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  // Update all photos for this event
  const { error } = await supabase
    .from('photos')
    .update({ is_shared: true })
    .eq('event_id', eventId)
    .eq('is_shared', false) // Only update the ones that aren't shared yet to optimize

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

// ─── GUEST: CHECK ENROLLMENT STATUS ─────────────────────────────────────────

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

// ─── HOST: REMOVE GUEST ──────────────────────────────────────────────────────

/**
 * Removes a guest from an event. Host only.
 * Also removes their face photo from storage if enrolled.
 */
export async function removeGuest(guestId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Verify caller is the event host
  const { data: event } = await supabase
    .from('events')
    .select('host_id')
    .eq('id', eventId)
    .single()

  if (!event || event.host_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  // Fetch guest info before deleting (to clean up face photo)
  const { data: guest } = await supabase
    .from('event_guests')
    .select('user_id, face_reference_url, face_enrolled')
    .eq('id', guestId)
    .single()

  if (!guest) return { error: 'Guest not found.' }

  // Delete from event_guests
  const { error } = await supabase
    .from('event_guests')
    .delete()
    .eq('id', guestId)

  if (error) return { error: error.message }

  // Clean up face photo if enrolled
  if (guest.face_enrolled && guest.user_id) {
    await supabase.storage
      .from('face-photos')
      .remove([`${guest.user_id}/${eventId}.jpg`])
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
