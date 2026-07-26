'use server'

import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'


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
