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
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function createOrder(input: any) {
  try {
    const token = await getAuthToken()
    const result = await serverFetch(`/api/orders`, token, {
      method: 'POST',
      body: JSON.stringify(input)
    })

    revalidatePath('/dashboard/events')
    revalidatePath('/dashboard')

    return result
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getAlbumOrder(albumId: string) {
  try {
    const token = await getAuthToken()
    return await serverFetch(`/api/orders/album/${albumId}`, token)
  } catch (error: any) {
    console.error('Error fetching album order:', error)
    return null
  }
}

export async function verifyPayment(payload: any) {
  try {
    const token = await getAuthToken()
    return await serverFetch(`/api/orders/verify`, token, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getUserOrders() {
  try {
    const token = await getAuthToken()
    return await serverFetch(`/api/orders`, token)
  } catch (error: any) {
    console.error('Error fetching user orders:', error)
    return []
  }
}
