import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getEventByInviteCode } from '@/lib/actions/events'
import { JoinEventButton } from '@/app/join/[code]/join-button'
import { serverFetch } from '@/lib/api-client'
import { InvitationInsert } from '@/components/join/invitation-insert'
import { MonoLabel, SpecPill, StampButton } from '@/components/folio/primitives'
import { monoDate, monoMeta } from '@/lib/photo-clusters'

interface Props {
  params: Promise<{ code: string }>
}

/**
 * Screen 02 — Guest Join.
 *
 * The invitation insert leads and the action follows it, so a guest reads what
 * they were invited to before being asked to do anything. Single column at
 * every width: this is the one screen most people will only ever see on a
 * phone, arriving from a QR code.
 */
export default async function JoinCodePage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token || null

  const eventResult = await getEventByInviteCode(code)

  if (!eventResult) {
    return (
      <Shell>
        <InvitationInsert
          label="No such insert"
          title="This code doesn't open anything"
          meta={`Code ${code.toUpperCase()}`}
          caption="It may have expired, or been typed differently to how it was printed."
        >
          <StampButton href="/join" tone="primary" className="w-full">
            Try another code
          </StampButton>
        </InvitationInsert>
      </Shell>
    )
  }

  const { codeType, ...event } = eventResult

  const status = {
    isGuest: false,
    isCollaborator: false,
    faceEnrolled: false,
    isOwner: false,
  }

  if (user) {
    if (event.host_id === user.id) {
      status.isOwner = true
    } else {
      try {
        const roleInfo = await serverFetch(`/api/events/${event.id}/role`, token)
        if (roleInfo) {
          status.isGuest = roleInfo.isGuest
          status.isCollaborator = roleInfo.isCollaborator
          status.faceEnrolled = roleInfo.faceEnrolled ?? false
        }
      } catch (err) {
        console.error('[Join] Failed to resolve guest role:', err)
      }
    }
  }

  const isCollaboratorFlow = codeType === 'collaborator'
  const location = (event.settings as any)?.location as string | undefined

  const metaLine = monoMeta(
    monoDate(event.event_date),
    location,
    event.host_name ? `Hosted by ${event.host_name}` : null
  )

  const eventArtUrl = event.cover_image_url || event.latest_photo_url || null

  return (
    <Shell art={eventArtUrl} artAlt={event.title}>
      <InvitationInsert
        label={isCollaboratorFlow ? 'Collaborator insert' : 'Invitation insert'}
        title={event.title}
        meta={metaLine}
        caption={
          isCollaboratorFlow
            ? 'You are being asked to help run this event.'
            : 'Join to add your photos, and to find the ones you are in.'
        }
      >
        <div className="space-y-3">
          {/* ── The host, on their own event ────────────────────────────── */}
          {status.isOwner ? (
            <>
              <SpecPill tone="secondary" className="mx-auto flex w-fit">
                Your event
              </SpecPill>
              <StampButton href={`/photos/events/${event.id}`} tone="primary" className="w-full">
                Open event
              </StampButton>
            </>
          ) : null}

          {/* ── Already in ──────────────────────────────────────────────── */}
          {status.isGuest || status.isCollaborator ? (
            <>
              <SpecPill
                tone={status.isCollaborator ? 'secondary' : 'muted'}
                className="mx-auto flex w-fit"
              >
                {status.isCollaborator ? 'You collaborate here' : "You're in"}
              </SpecPill>

              {!status.isCollaborator && !status.faceEnrolled ? (
                <>
                  <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    Add a selfie and the app will find the frames you appear in,
                    as they get uploaded.
                  </p>
                  <StampButton
                    href={`/join/${code}/enroll?event=${event.id}`}
                    tone="primary"
                    className="w-full"
                  >
                    Find my photos →
                  </StampButton>
                  <StampButton
                    href={`/photos/events/${event.id}`}
                    tone="ghost"
                    className="w-full"
                  >
                    Skip — open event
                  </StampButton>
                </>
              ) : (
                <StampButton
                  href={`/photos/events/${event.id}`}
                  tone="primary"
                  className="w-full"
                >
                  Open event
                </StampButton>
              )}
            </>
          ) : null}

          {/* ── Signed out ──────────────────────────────────────────────── */}
          {!user ? (
            <>
              <StampButton
                href={`/auth/login?next=/join/${code}`}
                tone="primary"
                className="w-full"
              >
                Sign in to join
              </StampButton>
              <StampButton
                href={`/auth/sign-up?next=/join/${code}`}
                tone="ghost"
                className="w-full"
              >
                Create a free account
              </StampButton>
            </>
          ) : null}

          {/* ── Signed in, not yet joined ───────────────────────────────── */}
          {user && !status.isGuest && !status.isCollaborator && !status.isOwner ? (
            <>
              {isCollaboratorFlow ? (
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  You will be able to approve uploads and curate the album.
                </p>
              ) : null}
              <JoinEventButton code={code} eventId={event.id} />
            </>
          ) : null}
        </div>
      </InvitationInsert>

      <MonoLabel size="xs" className="mt-5 text-center">
        Code {code.toUpperCase()}
      </MonoLabel>
    </Shell>
  )
}

function Shell({
  children,
  art,
  artAlt,
}: {
  children: React.ReactNode
  art?: string | null
  artAlt?: string
}) {
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10 safe-bottom">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-[44px] items-center self-center"
          aria-label="Folio home"
        >
          <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
        </Link>

        {art ? (
          <div className="mb-5 aspect-[4/3] w-full overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt={artAlt ?? ''} className="h-full w-full object-cover" />
          </div>
        ) : null}

        {children}
      </div>
    </main>
  )
}
