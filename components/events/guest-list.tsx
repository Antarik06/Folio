'use client'

import { EventGuest } from '@/lib/types/database'

export function GuestList({ guests, eventId, inviteCode, isHost }: { guests: Partial<EventGuest>[], eventId: string, inviteCode: string, isHost: boolean }) {
  return (
    <div className="p-6 bg-surface border border-border rounded-lg">
      <h3 className="font-serif text-2xl text-foreground mb-4">Guests</h3>
      {isHost && (
        <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-sans uppercase tracking-[0.1em] text-primary mb-2">Invite Code</p>
          <div className="flex items-center justify-between bg-background border border-primary/10 px-4 py-3 rounded-md">
             <p className="font-mono text-xl tracking-widest">{inviteCode || 'N/A'}</p>
             <button 
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                className="text-primary text-sm uppercase hover:underline"
             >
                Copy
             </button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Share this code with your guests so they can join the event and upload photos.</p>
        </div>
      )}
      
      {guests && guests.length > 0 ? (
        <ul className="space-y-4">
          {guests.map((guest, idx) => (
            <li key={guest.id || idx} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
              <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-serif text-lg">
                {(guest.name || 'G')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{guest.name || 'Guest User'}</p>
                <p className="text-sm text-muted-foreground">{guest.role}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No guests joined yet.</p>
        </div>
      )}
    </div>
  )
}
