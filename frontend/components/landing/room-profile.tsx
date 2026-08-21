import { Room, Caption } from './room-shell'
import { Reveal } from './reveal'
import { OccasionCard } from './occasion-card'

/**
 * Room 03 — Profile.
 *
 * The last stage of the pipeline, and the only one that leaves the building.
 * Two things live here: a public page set like a magazine masthead, and the
 * occasion cards sized for the platforms people actually share on.
 *
 * The consent story is stated plainly rather than buried, because it is the
 * reason the rest of the app can be private by default.
 */

function u(id: string, w = 320) {
  return `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`
}

const PUBLISHED = [
  'photo-1519741497674-611481863552',
  'photo-1506905925346-21bda4d32df4',
  'photo-1527631746610-bca00a040d60',
  'photo-1464349095431-e9a21285b5f3',
]

export function RoomProfile() {
  return (
    <Room
      id="profile"
      index="03"
      title={
        <>
          A card worth sending.
          <br className="hidden sm:block" /> A page worth sharing.
        </>
      }
      kicker="Ref — magazine mastheads, occasion-card packaging"
      lede="Make a card for the occasion — an anniversary, Diwali, a birthday, a trip you finished — sized for Instagram and WhatsApp, in the same hand as everything else you've made. Give your best work a page of its own, at a link you choose."
      cta={{ href: '/auth/sign-up', label: 'Claim your handle' }}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:gap-14">
        {/* ── The public page ─────────────────────────────────────────── */}
        <Reveal>
          <div>
            <div className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
              <div className="border-b-2 border-foreground pb-3.5">
                <div className="font-serif text-[clamp(1.6rem,5vw,2.4rem)] leading-none text-foreground">
                  Meera Kapoor
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft sm:text-[11px]">
                  @meerak · guest of 6 events · member since 2024
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2.5">
                {PUBLISHED.map((id) => (
                  <div key={id} className="aspect-[4/5] overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u(id, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                  folio.app/p/
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
                  meerak
                </span>
              </div>
            </div>

            <Caption label="My page">
              A masthead, the albums you chose to publish, and nothing else. Off
              by default.
            </Caption>

            {/* ── The consent model, said plainly ────────────────────── */}
            <div className="mt-8 rounded-[4px] border border-secondary/40 bg-secondary/[0.05] p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
                How sharing works
              </div>
              <ul className="mt-3 flex flex-col gap-2.5">
                {[
                  'A photo starts private to you.',
                  'Uploading it to an event shares it with that event’s guests — nobody else.',
                  'It only becomes public if you promote it, one album at a time.',
                ].map((line, i) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[10px] text-secondary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13px] leading-relaxed text-muted-foreground">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 border-t border-secondary/25 pt-3 text-[13px] leading-relaxed text-foreground">
                There is no step where something you didn&apos;t choose ends up
                on a public page.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── The card ────────────────────────────────────────────────── */}
        <Reveal delay={0.1}>
          <div className="lg:sticky lg:top-24">
            <OccasionCard />
          </div>
        </Reveal>
      </div>

      {/* ── Where they go ─────────────────────────────────────────────── */}
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          ['Built from your own photos', 'Pick a frame from your library. The card composes around it — no template wrangling.'],
          ['Recognisably yours', 'The same corner mark and credit line on every card, so people know where it came from.'],
          ['Sized for the places you post', '1080×1350 — stories, feeds, and chats take it without recompressing.'],
        ].map(([title, body], i) => (
          <Reveal key={title} delay={0.05 * i}>
            <div className="h-full rounded-[4px] border border-border bg-card p-5">
              <h3 className="font-serif text-lg text-foreground">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Room>
  )
}
