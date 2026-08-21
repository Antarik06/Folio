import { RegistrationCross } from '@/components/folio/marks'

export interface ShareCardData {
  id: string
  kind: 'occasion' | 'profile'
  headline: string
  subline?: string | null
  occasion_date?: string | null
  photo_url?: string | null
  is_public?: boolean
}

/**
 * A share card, rendered at 4:5 — the 1080×1350 crop Instagram and WhatsApp
 * both accept without recompressing.
 *
 * Two variants, and the difference matters:
 *
 * · `profile` keeps the paper field and bleeds a hero photo on three edges,
 *   with only a mono handle line beneath. It reads as a page torn out.
 *
 * · `occasion` is the one place in the entire app where terracotta runs as a
 *   solid field. The photo sits small and centred like a locket inside a thick
 *   cream ring, with a single registration cross as the only ornament.
 *
 * That cross plus the mono credit line repeat on every occasion card by
 * design, so a Folio card is recognisable as Folio's before the wordmark is.
 */
export function ShareCard({
  card,
  handle,
  name,
  width = 230,
}: {
  card: ShareCardData
  handle?: string | null
  name?: string | null
  /** Rendered width in px. The 4:5 ratio is fixed. */
  width?: number
}) {
  if (card.kind === 'profile') {
    return (
      <div
        className="relative flex flex-col border border-border bg-background p-2.5"
        style={{ width, aspectRatio: '4 / 5' }}
      >
        <div className="h-[78%] w-full overflow-hidden bg-surface-2">
          {card.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.photo_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full border border-dashed border-border" />
          )}
        </div>
        <div className="mt-3 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-foreground sm:text-[11px]">
          {[name, handle ? `@${handle}` : null].filter(Boolean).join(' · ') ||
            card.headline}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center bg-primary p-5"
      style={{ width, aspectRatio: '4 / 5' }}
    >
      <div className="absolute right-3 top-3">
        <RegistrationCross size={14} color="#FDFAF5" />
      </div>

      <div
        className="overflow-hidden rounded-full border-4 border-[#FDFAF5] bg-[#FDFAF5]"
        style={{ width: width * 0.48, height: width * 0.48 }}
      >
        {card.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.photo_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#FDFAF5]/30" />
        )}
      </div>

      <div className="mt-4 px-2 text-center font-serif text-xl leading-tight text-[#FDFAF5]">
        {card.headline}
      </div>

      {card.occasion_date || card.subline ? (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[#FDFAF5] opacity-80">
          {card.subline || formatCardDate(card.occasion_date)}
        </div>
      ) : null}
    </div>
  )
}

/** "14 · 11 · 2026" — the dotted date the occasion card carries. */
export function formatCardDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()}`
}
