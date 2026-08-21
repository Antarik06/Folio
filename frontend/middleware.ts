import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Without this file lib/supabase/middleware.ts was dead code: nothing refreshed
 * the Supabase auth cookies, so access tokens silently expired and server
 * components started seeing signed-out users mid-session.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  /*
   * Rescue an OAuth code that lands on the home page.
   *
   * Supabase does not reject a `redirect_to` that is missing from the project's
   * Redirect URLs allowlist — it silently falls back to the project's Site URL.
   * When that happens the user arrives at "/" carrying a valid `?code=`, the
   * landing page ignores it, and the sign-in appears to have simply dumped them
   * on the marketing page.
   *
   * Forwarding the code to the real callback makes that failure mode recoverable
   * instead of silent. It does not remove the need for the allowlist entry: if
   * Site URL points at a different host entirely, the user never reaches this
   * deployment at all.
   */
  if (pathname === '/' && searchParams.has('code')) {
    const callback = request.nextUrl.clone()
    callback.pathname = '/auth/callback'
    const next = searchParams.get('next')
    if (!next || !next.startsWith('/')) {
      callback.searchParams.set('next', '/photos')
    }
    return NextResponse.redirect(callback)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image files, which never need
     * a session and would otherwise pay for a token refresh check.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|mp4|webm)$).*)',
  ],
}
