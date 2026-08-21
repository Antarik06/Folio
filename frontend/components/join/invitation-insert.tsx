import { ReactNode } from 'react'
import QRCode from 'react-qr-code'
import { CrosshairMark } from '@/components/folio/marks'
import { MonoLabel } from '@/components/folio/primitives'

/**
 * Screen 02, card 1 — the invitation insert.
 *
 * A join screen is a printed card that came with an invitation, so it carries
 * registration crosses in the corners, the occasion set in italic serif, and a
 * mono date line. Not a modal, not a sign-up form with a photo on it.
 *
 * `qrValue` renders a real scannable code when supplied — the same card is
 * used by the host to hand the event out and by the guest who scanned it.
 */
export function InvitationInsert({
  title,
  meta,
  label = 'Invitation insert',
  qrValue,
  caption,
  children,
  className,
}: {
  title: string
  meta?: string | null
  label?: string
  qrValue?: string
  caption?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative rounded-[4px] border-[1.5px] border-border bg-card px-5 py-7 sm:px-6 ${className ?? ''}`}
    >
      <div className="absolute left-2 top-2">
        <CrosshairMark size={14} />
      </div>
      <div className="absolute right-2 top-2">
        <CrosshairMark size={14} />
      </div>
      <div className="absolute bottom-2 left-2">
        <CrosshairMark size={14} />
      </div>
      <div className="absolute bottom-2 right-2">
        <CrosshairMark size={14} />
      </div>

      <MonoLabel size="xs" className="mb-4 text-center tracking-[0.1em]">
        {label}
      </MonoLabel>

      <h1 className="text-center font-serif text-[clamp(1.25rem,5vw,1.75rem)] italic leading-tight text-foreground">
        {title}
      </h1>

      {meta ? (
        <MonoLabel className="mt-1.5 text-center">{meta}</MonoLabel>
      ) : null}

      {qrValue ? (
        <div className="mx-auto mt-6 w-[150px] border border-foreground bg-[#FDFAF5] p-2.5">
          <QRCode
            value={qrValue}
            size={128}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            fgColor="#1C1814"
            bgColor="#FDFAF5"
            viewBox="0 0 256 256"
          />
        </div>
      ) : null}

      {caption ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">{caption}</p>
      ) : null}

      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
