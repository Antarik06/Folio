import { redirect } from 'next/navigation'
import { AppShell } from '@/components/folio/app-shell'
import { getProfile, getUser } from '@/lib/actions/auth'

export default async function AppLayout({
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
    <AppShell user={user} profile={profile}>
      {children}
    </AppShell>
  )
}
