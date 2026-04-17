'use client'

import Link from 'next/link'
import { Event } from '@/lib/types/database'

interface EventHeaderProps {
  event: Event & { profiles?: { full_name: string | null; avatar_url: string | null } | null }
  isHost: boolean
  photoCount: number
  guestCount: number
}

export function EventHeader({ event, isHost, photoCount, guestCount }: EventHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Events
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">{event.name}</h1>
            <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
              event.is_active 
                ? 'bg-secondary/20 text-secondary' 
                : 'bg-muted-foreground/20 text-muted-foreground'
            }`}>
              {event.is_active ? 'Active' : 'Closed'}
            </span>
          </div>
          
          {event.description && (
            <p className="text-muted-foreground mb-4 max-w-2xl">{event.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {event.date && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {photoCount} photos
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {guestCount} guests
            </span>
          </div>
        </div>

        {isHost && (
          <div className="flex items-center gap-3">
            <Link
              href={`/events/${event.id}/settings`}
              className="px-4 py-2 border border-border text-foreground text-sm hover:bg-card transition-colors"
            >
              Settings
            </Link>
            <Link
              href={`/events/${event.id}/generate-album`}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            >
              Generate Album
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
