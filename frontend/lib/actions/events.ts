'use server'

import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export async function updateEventSettings(eventId: string, input: any) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/settings`, token, {
      method: 'PUT',
      body: JSON.stringify(input)
    })
    
    revalidatePath(`/photos/events/${eventId}`)
    revalidatePath('/photos/events')
    revalidatePath('/photos')
    
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

    revalidatePath(`/photos/events/${result.eventId}`)
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

    revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * `descriptor` is the 128-float embedding extracted from the selfie in the
 * browser (see lib/face-recognition.ts). The backend rejects the enrollment
 * without one, because a selfie URL alone cannot match anything.
 */
export async function enrollFace(eventId: string, selfieUrl: string, descriptor: number[]) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/ai/events/${eventId}/enroll-face`, token, {
      method: 'POST',
      body: JSON.stringify({ selfieUrl, descriptor })
    })

    revalidatePath(`/photos/events/${eventId}`)
    revalidatePath(`/photos/events/${eventId}/me`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function togglePhotoShared(photoId: string, currentIsShared: boolean, eventId?: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/shared`, token, {
      method: 'PATCH'
    })
    if (eventId) revalidatePath(`/photos/events/${eventId}`)
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
    
    revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function approvePhoto(photoId: string, eventId?: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/approve`, token, {
      method: 'PATCH'
    })
    if (eventId) revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function rejectPhoto(photoId: string, eventId?: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}/reject`, token, {
      method: 'POST'
    })
    if (eventId) revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deletePhoto(photoId: string, eventId?: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/photos/${photoId}`, token, {
      method: 'DELETE'
    })
    if (eventId) revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeGuest(guestId: string, eventId: string) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/events/${eventId}/guests/${guestId}`, token, {
      method: 'DELETE'
    })

    revalidatePath(`/photos/events/${eventId}`)
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

    revalidatePath('/photos')
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

    revalidatePath('/photos')
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

    revalidatePath('/photos')
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

    revalidatePath('/photos/events')
    revalidatePath('/photos')
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

    revalidatePath('/photos')
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
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
    revalidatePath(`/photos/events/${eventId}`)
    return result
  } catch (error: any) {
    return { error: error.message }
  }
}
