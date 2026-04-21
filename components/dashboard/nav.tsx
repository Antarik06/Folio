'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'
import { signOut } from '@/lib/actions/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardNavProps {
  user: User
  profile: Profile | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/templates', label: 'Templates' },
    { href: '/dashboard/polaroid', label: 'Polaroid' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/dashboard" className="font-serif text-xl tracking-tight text-foreground">
            Folio
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/events/new"
            className="hidden md:inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </Link>
          <Link
            href="/dashboard/join"
            className="hidden md:inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 text-sm rounded-md hover:bg-primary/20 transition"
          >
            Join
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-2 hover:bg-card transition-colors">
              <div className="w-8 h-8 bg-card border border-border flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/events">Manage Events</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/join">Join Event</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut}>
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
