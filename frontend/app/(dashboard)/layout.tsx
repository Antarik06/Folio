import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/shell'
import { getProfile } from '@/lib/actions/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile()

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  )
}
