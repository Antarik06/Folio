import { getUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { getAdminUsers, getAdminOrders } from '@/lib/actions/admin'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'

export const metadata = {
  title: 'Admin Dashboard | Folio',
  description: 'Manage users, events, and print order tracks.',
}

export default async function AdminDashboardPage() {
  const user = await getUser()

  // Authorization check: User must be signed in and have 'admin' role
  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all initial admin data
  const users = await getAdminUsers()
  const orders = await getAdminOrders()

  return <AdminDashboardClient initialUsers={users} initialOrders={orders} />
}
