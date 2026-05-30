import { getUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { getAdminUsers, getAdminOrders } from '@/lib/actions/admin'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'

export const metadata = {
  title: 'Super Admin Dashboard | Folio',
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.2em] text-primary mb-3">
            <span>Security Area</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Super Admin Panel</h1>
          <p className="text-muted-foreground mt-1.5">
            Complete system overview of users, events, uploads, and physical prints.
          </p>
        </div>

        {/* Info stats */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-muted/40 border border-border">
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Total Users</span>
            <span className="text-xl font-serif font-bold text-foreground">{users.length}</span>
          </div>
          <div className="px-4 py-2 bg-muted/40 border border-border">
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Total Orders</span>
            <span className="text-xl font-serif font-bold text-foreground">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AdminDashboardClient initialUsers={users} initialOrders={orders} />
    </div>
  )
}
