'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'
import { AppNav, TabBar } from '@/components/folio/app-nav'

interface AppShellProps {
  user: User
  profile: Profile | null
  children: ReactNode
}

/**
 * Routes that take over the whole viewport and supply their own chrome: the
 * editor light table, the darkroom bench, and the two role-gated areas that
 * are a different persona rather than a stage of the guest/host journey.
 *
 * The Photo Studio belongs here for the same reason the editor does — it is a
 * full-height tool with its own header and its own way back, and under the
 * app nav its bench was 56px taller than the screen.
 */
const FULL_BLEED = ['/create/editor', '/create/photo', '/admin', '/artist-studio']

export function AppShell({ user, profile, children }: AppShellProps) {
  const pathname = usePathname()
  const fullBleed = FULL_BLEED.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (fullBleed) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <AppNav user={user} profile={profile} />
      {/* Top offset clears the fixed header; bottom offset clears the mobile
          tab bar, which is only present under md. */}
      <main className="pt-14 pb-tabbar sm:pt-16 md:pb-0">{children}</main>
      <TabBar />
    </div>
  )
}
