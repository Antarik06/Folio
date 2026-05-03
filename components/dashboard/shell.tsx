'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'
import { DashboardNav } from '@/components/dashboard/nav'

interface DashboardShellProps {
  user: User
  profile: Profile | null
  children: ReactNode
}

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
  const pathname = usePathname()
  const hideDashboardHeader = pathname.startsWith('/dashboard/templates/editor/')

  return (
    <div className="min-h-screen bg-background">
      {!hideDashboardHeader && <DashboardNav user={user} profile={profile} />}
      <main className={hideDashboardHeader ? 'pt-0' : 'pt-16'}>
        {children}
      </main>
    </div>
  )
}
