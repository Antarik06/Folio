import { Room, Caption } from './room-shell'
import { Reveal } from './reveal'

/**
 * Room 01 — Photos.
 *
 * Demonstrates the actual distinction the Photos tab is built on: the Library
 * is one unbroken uniform sheet, an Event breaks that rhythm on purpose with a
 * titled strip, capture-time clusters and contributor initials. Showing both
 * side by side makes the difference legible without explaining it in prose.
 */

const LIBRARY = [
  'photo-1519741497674-611481863552',
  'photo-1465495976277-4387d4b0b4c6',
  'photo-1506905925346-21bda4d32df4',
  'photo-1469371670807-013ccf25f16a',
  'photo-1511285560929-80b456fea0bc',
  'photo-1464349095431-e9a21285b5f3',
  'photo-1488646953014-85cb44e25828',
  'photo-1507525428034-b723cf961d3e',
  'photo-1527631746610-bca00a040d60',
  'photo-1516035069371-29a1b244cc32',
  'photo-1533174072545-7a4b6ad7a6c3',
  'photo-1441986300917-64674bd600d8',
]

const CLUSTER_A = [
  'photo-1519225421980-715cb0215aed',
  'photo-1465495976277-4387d4b0b4c6',
  'photo-1511285560929-80b456fea0bc',
]

const CLUSTER_B = [
  'photo-1464349095431-e9a21285b5f3',
  'photo-1533174072545-7a4b6ad7a6c3',
  'photo-1469371670807-013ccf25f16a',
  'photo-1527631746610-bca00a040d60',
  'photo-1516035069371-29a1b244cc32',
]

function u(id: string, w = 320) {
  return `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`
}

export function RoomPhotos() {
  return (
    <Room
      id="photos"
      index="01"
      title={
        <>
          Every frame from the day,
          <br className="hidden sm:block" /> not just yours
        </>
      }
      kicker="Ref — contact sheets, darkroom shelves"
      lede="Start an event, share one code, and everyone who was there adds what they shot. Add a selfie once and the app finds the frames you're actually in. Everything stays private to the people you invited — nothing is public until you say so."
      cta={{ href: '/auth/sign-up', label: 'Start collecting' }}
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* ── Library: one unbroken sheet ─────────────────────────────── */}
        <Reveal>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
              Library — private, 1,204 photos
            </div>
            <div className="overflow-hidden rounded-[4px] border border-border bg-card">
              <div className="grid grid-cols-4 gap-[2px] p-[2px] sm:grid-cols-6">
                {LIBRARY.map((id) => (
                  <div key={id} className="aspect-square overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u(id, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <Caption label="Library">
              One uniform grid, sorted by when the shutter fired. No captions, no
              chrome — a contact sheet.
            </Caption>
          </div>
        </Reveal>

        {/* ── Event: the rhythm breaks ────────────────────────────────── */}
        <Reveal delay={0.08}>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-secondary">
              Event — shared with 42 guests
            </div>

            <div className="rounded-[4px] border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-3.5">
                <div className="min-w-0">
                  <div className="font-serif text-xl italic leading-snug text-foreground">
                    Reema &amp; Advait — Sangeet Night
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
                    14 Nov 2025 · Udaipur · 812 frames
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  {[
                    ['RM', 'bg-primary text-primary-foreground'],
                    ['AK', 'bg-secondary text-secondary-foreground'],
                    ['+2', 'bg-surface-2 text-ink-soft'],
                  ].map(([txt, cls], i) => (
                    <span
                      key={txt}
                      className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-card font-mono text-[10px] ${cls} ${
                        i > 0 ? '-ml-2' : ''
                      }`}
                    >
                      {txt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                Cluster — 8:12pm
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-[3px]">
                {CLUSTER_A.map((id, i) => (
                  <div
                    key={id}
                    className="h-[104px] overflow-hidden bg-surface-2 sm:h-[132px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u(id, i === 0 ? 480 : 200)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-1.5 mt-5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                Cluster — 9:47pm
              </div>
              <div className="grid grid-cols-5 gap-[3px]">
                {CLUSTER_B.map((id) => (
                  <div key={id} className="aspect-square overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u(id, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <Caption label="Event">
              The same shelf, grouped by the moments they were shot in — with the
              initials of whoever contributed each stretch.
            </Caption>
          </div>
        </Reveal>
      </div>

      {/* ── Three things it does ──────────────────────────────────────── */}
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          ['One code, everyone', 'Guests scan and start adding. No app to install, no account required to look.'],
          ['Photos of me', 'One selfie, and the app pulls every frame you appear in — across all 812.'],
          ['Private by default', 'Nothing leaves the event unless you promote it. That is the whole consent model.'],
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
