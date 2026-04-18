import { createClient } from '@/lib/supabase/server'
import { getEventByInviteCode } from '@/lib/actions/events'
import Link from 'next/link'
import { JoinEventButton } from '@/app/join/[code]/join-button'

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinCodePage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Look up the event
  const event = await getEventByInviteCode(code)

  if (!event) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <Link href="/" className="inline-block mb-12">
            <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
          </Link>
          <div className="w-16 h-16 mx-auto mb-8 border border-terracotta flex items-center justify-center">
            <svg className="w-8 h-8 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-4">Invalid Code</h1>
          <p className="text-muted-foreground mb-8">
            This invite code doesn&apos;t match any event. It may have expired or been entered incorrectly.
          </p>
          <Link
            href="/join"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </main>
    )
  }

  // Check if user is already a guest / host
  let guestStatus: { isGuest: boolean; faceEnrolled: boolean; isHost: boolean } = {
    isGuest: false,
    faceEnrolled: false,
    isHost: false,
  }

  if (user) {
    if (event.host_id === user.id) {
      guestStatus.isHost = true
    } else {
      const { data: guestRecord } = await supabase
        .from('event_guests')
        .select('id, face_enrolled')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single()

      if (guestRecord) {
        guestStatus.isGuest = true
        guestStatus.faceEnrolled = guestRecord.face_enrolled ?? false
      }
    }
  }

  const host = event.profiles as any
  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left: Event Info */}
      <div className="hidden lg:flex w-1/2 bg-card items-center justify-center p-16 border-r border-border">
        <div className="max-w-sm w-full">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full aspect-[4/3] object-cover mb-8"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-background border border-border flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <h2 className="font-serif text-3xl text-foreground mb-3">{event.title}</h2>
          {event.description && (
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{event.description}</p>
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            {eventDate && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {eventDate}
              </p>
            )}
            {(event.settings as any)?.location && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {(event.settings as any).location}
              </p>
            )}
            {host?.full_name && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Hosted by {host.full_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Join Action */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="inline-block mb-12">
            <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
          </Link>

          {/* Mobile: Event title */}
          <div className="lg:hidden mb-6">
            <h2 className="font-serif text-2xl text-foreground">{event.title}</h2>
            {eventDate && <p className="text-sm text-muted-foreground mt-1">{eventDate}</p>}
          </div>

          {/* Invite code badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 border border-secondary/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="text-xs font-mono uppercase tracking-widest text-secondary">
              Code: {code.toUpperCase()}
            </span>
          </div>

          {/* Host view */}
          {guestStatus.isHost && (
            <>
              <h1 className="font-serif text-4xl text-foreground mb-4">This is your event</h1>
              <p className="text-muted-foreground mb-8">
                You&apos;re the host of this event. Manage it from your dashboard.
              </p>
              <Link
                href={`/events/${event.id}`}
                className="w-full block text-center bg-primary text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
              >
                Go to Event Dashboard
              </Link>
            </>
          )}

          {/* Already a guest, enrolled */}
          {guestStatus.isGuest && guestStatus.faceEnrolled && (
            <>
              <h1 className="font-serif text-4xl text-foreground mb-4">You&apos;re in!</h1>
              <p className="text-muted-foreground mb-8">
                You&apos;ve already joined this event and enrolled your face. View your personalized photo collection.
              </p>
              <Link
                href={`/events/${event.id}/my-photos`}
                className="w-full block text-center bg-primary text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
              >
                View My Photos →
              </Link>
            </>
          )}

          {/* Already a guest, not yet enrolled */}
          {guestStatus.isGuest && !guestStatus.faceEnrolled && (
            <>
              <h1 className="font-serif text-4xl text-foreground mb-4">One more step</h1>
              <p className="text-muted-foreground mb-8">
                You&apos;ve joined the event. Enroll your face so AI can find all your photos automatically.
              </p>
              <Link
                href={`/join/${code}/enroll?event=${event.id}`}
                className="w-full block text-center bg-primary text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors mb-4"
              >
                Enroll My Face →
              </Link>
              <Link
                href={`/events/${event.id}/my-photos`}
                className="w-full block text-center border border-border text-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-card transition-colors"
              >
                Skip for now
              </Link>
            </>
          )}

          {/* Not logged in */}
          {!user && (
            <>
              <h1 className="font-serif text-4xl text-foreground mb-4">You&apos;re invited</h1>
              <p className="text-muted-foreground mb-8">
                Sign in or create a free account to join this event and access your personalized photo album.
              </p>
              <Link
                href={`/auth/login?next=/join/${code}`}
                className="w-full block text-center bg-primary text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors mb-4"
              >
                Sign In to Join
              </Link>
              <Link
                href={`/auth/sign-up?next=/join/${code}`}
                className="w-full block text-center border border-border text-foreground py-4 text-sm uppercase tracking-[0.2em] hover:bg-card transition-colors"
              >
                Create Free Account
              </Link>
            </>
          )}

          {/* Logged in but not yet a guest */}
          {user && !guestStatus.isGuest && !guestStatus.isHost && (
            <>
              <h1 className="font-serif text-4xl text-foreground mb-4">Ready to join?</h1>
              <p className="text-muted-foreground mb-8">
                Join this event to upload photos and receive a personalized photo book.
              </p>
              <JoinEventButton code={code} eventId={event.id} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
