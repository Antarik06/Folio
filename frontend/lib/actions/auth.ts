'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { serverFetch } from '@/lib/api-client'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email to confirm your account' }
}

/**
 * Returns the Supabase access token for the current request, or null.
 * This is the only credential the backend accepts.
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = await createClient()
  // Verify the identity against the Auth server before trusting the session.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Landing route for a signed-in user, based on their role in public.profiles.
 */
function homeForRole(role?: string | null) {
  if (role === 'admin') return '/admin'
  if (role === 'artist') return '/artist-studio'
  return '/photos'
}

export async function signIn(formData: FormData, redirectTo?: string) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  // Send admins and artists to their own dashboards unless an explicit
  // destination was requested.
  if (redirectTo?.startsWith('/')) {
    redirect(redirectTo)
  }

  const profile = await getProfile()
  redirect(homeForRole(profile?.role))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const token = await getAuthToken()
  if (!token) return null

  try {
    return await serverFetch('/api/profile', token)
  } catch (error) {
    console.error('Error in getProfile action:', error)
    return null
  }
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const safePath = next?.startsWith('/') ? next : '/photos'
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safePath)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
