'use server'

import { serverFetch } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

async function getAuthToken() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'admin-secret-token'
  if (isAdmin) {
    return 'admin-secret-token'
  }
  const supabase = await createClient()
  // Verify user identity with the Auth server (prevents session spoofing)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // Get session only for the access token
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function getUserEventRole(eventId: string) {
  try {
    const token = await getAuthToken()
    return await serverFetch(`/api/events/${eventId}/role`, token)
  } catch (error: any) {
    return { role: null, isOwner: false, isCollaborator: false, isGuest: false, error: error.message }
  }
}

export async function updateEventSettings(eventId: string, input: any) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/settings`, token, {
      method: 'PUT',
      body: JSON.stringify(input)
    })
    
    revalidatePath(`/events/${eventId}`)
    revalidatePath('/events')
    revalidatePath('/dashboard')
    
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function joinEvent(inviteCode: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/join`, token, {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    })

    revalidatePath(`/events/${result.eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getEventByInviteCode(code: string) {
  try {
    // Public endpoint, token is optional
    return await serverFetch(`/api/events/lookup?code=${encodeURIComponent(code)}`, null)
  } catch (error: any) {
    console.error('Error fetching event by invite code:', error)
    return null
  }
}

export async function generateCollaboratorCode(eventId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/collaborator-code`, token, {
      method: 'POST'
    })

    revalidatePath(`/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function enrollFace(eventId: string, selfieUrl: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/ai/events/${eventId}/enroll-face`, token, {
      method: 'POST',
      body: JSON.stringify({ selfieUrl })
    })

    revalidatePath(`/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getMyEventPhotos(eventId: string) {
  try {
    const token = await getAuthToken()
    const photos = await serverFetch(`/api/photos/event/${eventId}`, token)
    return { photos: photos || [] }
  } catch (error: any) {
    return { photos: [], error: error.message }
  }
}

export async function togglePhotoShared(photoId: string, currentIsShared: boolean) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/shared`, token, {
      method: 'PATCH'
    })
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function shareAllPhotos(eventId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/event/${eventId}/share-all`, token, {
      method: 'POST'
    })
    
    revalidatePath(`/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function approvePhoto(photoId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/approve`, token, {
      method: 'PATCH'
    })
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function rejectPhoto(photoId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/reject`, token, {
      method: 'POST'
    })
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deletePhoto(photoId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}`, token, {
      method: 'DELETE'
    })
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getGuestEnrollmentStatus(eventId: string) {
  try {
    const token = await getAuthToken()
    const roleInfo = await serverFetch(`/api/events/${eventId}/role`, token)
    
    if (!roleInfo || !roleInfo.role) return null

    return {
      id: roleInfo.id,
      face_enrolled: roleInfo.faceEnrolled,
      face_reference_url: roleInfo.faceReferenceUrl,
      role: roleInfo.role
    }
  } catch (error) {
    console.error('Error fetching guest enrollment status:', error)
    return null
  }
}

export async function removeGuest(guestId: string, eventId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/guests/${guestId}`, token, {
      method: 'DELETE'
    })

    revalidatePath(`/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function renameAlbum(albumId: string, title: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/albums/${albumId}/rename`, token, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    })

    revalidatePath('/dashboard')
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateAlbumCoverPhoto(albumId: string, coverPhotoId: string | null) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/albums/${albumId}/cover`, token, {
      method: 'PATCH',
      body: JSON.stringify({ coverPhotoId })
    })

    revalidatePath('/dashboard')
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteAlbum(albumId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/albums/${albumId}`, token, {
      method: 'DELETE'
    })

    revalidatePath('/dashboard')
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}`, token, {
      method: 'DELETE'
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createAlbumAction(eventId: string, title: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch('/api/albums', token, {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        title,
        layoutData: {}
      })
    })

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateGuestRoleAction(eventId: string, guestId: string, role: 'guest' | 'collaborator') {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/guests/${guestId}/role`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createFolderAction(eventId: string, name: string, parentId?: string | null) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/folders`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: parentId || null })
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteFolderAction(eventId: string, folderId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/folders/${folderId}`, token, {
      method: 'DELETE'
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function movePhotoAction(eventId: string, photoId: string, folderId: string | null) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/move`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId })
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updatePhotoTagsAction(eventId: string, photoId: string, peopleTags: string[]) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/tags`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peopleTags })
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updatePhotoLocationAction(eventId: string, photoId: string, location: string | null) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/location`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    })
    revalidatePath(`/dashboard/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateDeliveryInstructionsAction(albumId: string, deliveryInstructions: string | null) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/albums/${albumId}/delivery-instructions`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryInstructions })
    })
    revalidatePath('/dashboard')
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}
