'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'
import { signOut } from '@/lib/actions/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { MonoLabel } from '@/components/folio/primitives'
import { PhotosGlyph, CreateGlyph, ProfileGlyph, StudioGlyph } from '@/components/folio/tab-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * The three tabs. Everything a guest or host does lives inside one of them —
 * per docs/AppMap.md, a feature that fits none of the three is a signal an
 * umbrella needs renaming, not that a fourth tab is needed.
 */
export const TABS = [
  { href: '/photos', label: 'Photos', job: 'Where every photo lives', Glyph: PhotosGlyph },
  { href: '/create', label: 'Create', job: 'Turn photos into an album, print, or card', Glyph: CreateGlyph },
  { href: '/profile', label: 'Profile', job: 'Your public page and cards', Glyph: ProfileGlyph },
] as const

export function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

interface AppNavProps {
  user: User
  profile: Profile | null
}

/**
 * Desktop chrome. On phones this collapses to a wordmark + account row; the
 * tabs themselves move to the thumb-reachable bottom bar (see TabBar).
 */
export function AppNav({ user, profile }: AppNavProps) {
  const pathname = usePathname()
  const role = (profile as { role?: string } | null)?.role

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background safe-top">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-10">
          <Link
            href="/photos"
            className="font-serif text-xl tracking-tight text-foreground"
            aria-label="Folio home"
          >
            Folio
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {TABS.map(({ href, label }) => {
              const active = isTabActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-5 text-sm transition-colors ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                  {active ? (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {role === 'artist' ? (
            <Link
              href="/artist-studio"
              className="hidden items-center gap-2 rounded-[2px] border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground transition-colors hover:border-foreground lg:inline-flex"
            >
              <StudioGlyph size={14} />
              Studio
            </Link>
          ) : null}

          <ThemeToggle />

          <Link
            href="/photos/events/new"
            className="hidden min-h-[40px] items-center gap-2 rounded-[2px] bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex"
          >
            New Event
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="touch-target flex items-center gap-2 rounded-[2px] p-1.5 transition-colors hover:bg-card"
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 items-center justify-center border border-border bg-card font-mono text-[11px] uppercase text-foreground">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-[4px]">
              <div className="px-3 py-2">
                <p className="truncate font-serif text-base text-foreground">
                  {profile?.full_name || 'Your account'}
                </p>
                <MonoLabel size="xs" className="mt-0.5 truncate normal-case">
                  {user.email}
                </MonoLabel>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">My Page</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/cards">Cards</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/photos/events">Events</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/create/orders">Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/join">Join an event</Link>
              </DropdownMenuItem>
              {role === 'admin' ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="font-semibold text-primary">
                    Admin
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {role === 'artist' ? (
                <DropdownMenuItem asChild>
                  <Link href="/artist-studio" className="font-semibold text-primary">
                    Artist Studio
                  </Link>
                </DropdownMenuItem>
              ) : null}
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

/**
 * Mobile tab bar. Fixed to the bottom so the three tabs stay in thumb reach,
 * with the labels always visible — an icon-only bar would lose the plain-word
 * naming the whole restructure is built on.
 */
export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 safe-bottom">
        {TABS.map(({ href, label, Glyph }) => {
          const active = isTabActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {active ? (
                <span className="absolute inset-x-5 top-0 h-[2px] bg-primary" />
              ) : null}
              <Glyph size={20} active={active} />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
