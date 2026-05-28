'use server'

import { serverFetch } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthToken() {
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
