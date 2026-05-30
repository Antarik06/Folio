import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'
import { getProfile, getUser } from '@/lib/actions/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

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
