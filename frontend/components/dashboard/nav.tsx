'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'
import { signOut } from '@/lib/actions/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/templates', label: 'Popular Albums' },
    { href: '/dashboard/polaroid', label: 'Polaroid' },
    { href: '/dashboard/premium', label: 'Concierge' },
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
              <DropdownMenuItem asChild>
                <Link href="/dashboard/orders">My Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/premium">Premium Concierge</Link>
              </DropdownMenuItem>
              {/* Role comes from public.profiles, which is also what the backend
                  authorizes against — matching on an email address made these
                  links appear for anyone who happened to use that address. */}
              {(profile as any)?.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin" className="text-primary font-semibold">Admin Panel</Link>
                </DropdownMenuItem>
              )}
              {(profile as any)?.role === 'artist' && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/artist" className="text-[#B85C38] dark:text-[#D4845E] font-semibold">Artist Studio</Link>
                </DropdownMenuItem>
              )}
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

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6.5 h-6.5" /> : <Menu className="w-6.5 h-6.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-6 shadow-lg flex flex-col gap-4 z-40 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-primary font-bold'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="h-px bg-border my-2" />
          <div className="flex flex-col gap-3">
            <Link
              href="/events/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              New Event
            </Link>
            <Link
              href="/dashboard/join"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Join Event
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
