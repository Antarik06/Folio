import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Without this file lib/supabase/middleware.ts was dead code: nothing refreshed
 * the Supabase auth cookies, so access tokens silently expired and server
 * components started seeing signed-out users mid-session.
 */
export async function middleware(request: NextRequest) {
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
