import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  // Support ?next= for post-login redirect (e.g. back to /join/[code])
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure next is a relative path to prevent open redirect
      const safePath = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
