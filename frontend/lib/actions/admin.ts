'use server'

import { serverFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getAuthToken() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'admin-secret-token'
  if (isAdmin) {
    return 'admin-secret-token'
  }
  return null
}

export async function getAdminUsers() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/admin/users', token)
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return []
  }
}

export async function getAdminUserEvents(userId: string) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch(`/api/admin/users/${userId}/events`, token)
  } catch (error: any) {
    console.error(`Error fetching admin events for user ${userId}:`, error)
    return []
  }
}

export async function getAdminEventPhotos(eventId: string) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch(`/api/admin/events/${eventId}/photos`, token)
  } catch (error: any) {
    console.error(`Error fetching admin photos for event ${eventId}:`, error)
    return []
  }
}

export async function getAdminEventAlbums(eventId: string) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch(`/api/admin/events/${eventId}/albums`, token)
  } catch (error: any) {
    console.error(`Error fetching admin albums for event ${eventId}:`, error)
    return []
  }
}

export async function getAdminOrders() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/admin/orders', token)
  } catch (error: any) {
    console.error('Error fetching admin orders:', error)
    return []
  }
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const result = await serverFetch(`/api/admin/orders/${orderId}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/orders')
    
    return { success: true, order: result.order }
  } catch (error: any) {
    console.error(`Error updating status for order ${orderId}:`, error)
    return { success: false, error: error.message }
  }
}
