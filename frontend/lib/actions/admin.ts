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

export async function getAdminSettings() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/admin/settings', token)
  } catch (error: any) {
    console.error('Error fetching admin settings:', error)
    return {}
  }
}

export async function updateSystemSettings(settings: Record<string, any>) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const res = await serverFetch('/api/admin/settings', token, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    })
    revalidatePath('/dashboard/admin')
    return { success: true, message: res.message }
  } catch (error: any) {
    console.error('Error updating system settings:', error)
    return { success: false, error: error.message }
  }
}

export async function getPromoCodes() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/admin/promo-codes', token)
  } catch (error: any) {
    console.error('Error fetching promo codes:', error)
    return []
  }
}

export async function createPromoCode(data: {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value?: number
  expires_at?: string | null
}) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const res = await serverFetch('/api/admin/promo-codes', token, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    revalidatePath('/dashboard/admin')
    return { success: true, promoCode: res }
  } catch (error: any) {
    console.error('Error creating promo code:', error)
    return { success: false, error: error.message }
  }
}

export async function deletePromoCode(code: string) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const res = await serverFetch(`/api/admin/promo-codes/${encodeURIComponent(code)}`, token, {
      method: 'DELETE'
    })
    revalidatePath('/dashboard/admin')
    return { success: true, message: res.message }
  } catch (error: any) {
    console.error(`Error deleting promo code ${code}:`, error)
    return { success: false, error: error.message }
  }
}

export async function updateUserStatus(userId: string, isBanned: boolean) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const res = await serverFetch(`/api/admin/users/${userId}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned })
    })
    revalidatePath('/dashboard/admin')
    return { success: true, user: res.user }
  } catch (error: any) {
    console.error(`Error toggling user ban for ${userId}:`, error)
    return { success: false, error: error.message }
  }
}

export async function getAdminArtists() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/admin/artists', token)
  } catch (error: any) {
    console.error('Error fetching admin artists:', error)
    return []
  }
}

export async function assignArtistToOrder(orderId: string, artistId: string | null) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const result = await serverFetch(`/api/admin/orders/${orderId}/assign-artist`, token, {
      method: 'PATCH',
      body: JSON.stringify({ artistId })
    })
    revalidatePath('/dashboard/admin')
    return { success: true, order: result.order }
  } catch (error: any) {
    console.error(`Error assigning artist to order ${orderId}:`, error)
    return { success: false, error: error.message }
  }
}

export async function getAdminPremiumProjects() {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return await serverFetch('/api/premium/projects', token)
  } catch (error: any) {
    console.error('Error fetching premium projects for admin:', error)
    return []
  }
}

export async function assignArtistToPremiumProject(projectId: string, artistId: string | null) {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    const result = await serverFetch(`/api/admin/premium/projects/${projectId}/assign-artist`, token, {
      method: 'PATCH',
      body: JSON.stringify({ artistId })
    })
    revalidatePath('/dashboard/admin')
    return { success: true, project: result.project }
  } catch (error: any) {
    console.error(`Error assigning artist to premium project ${projectId}:`, error)
    return { success: false, error: error.message }
  }
}
