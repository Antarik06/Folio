import Image from 'next/image'
import { Room, Caption } from './room-shell'
import { Reveal } from './reveal'
import { CompassMark, SprocketRail } from '@/components/folio/marks'

/**
 * Room 02 — Create.
 *
 * Shows the two ways in (build it yourself, or commission an artist) and then
 * the catalogue itself, where each style carries its own print idiom rather
 * than a shared card shell. Crop the photo out of any of these and you would
 * still know which style it was — that is the whole argument of this section.
 */

function u(id: string, w = 400) {
  return `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`
}

export function RoomCreate() {
  return (
    <Room
      id="create"
      index="02"
      tone="press"
      title={
        <>
          Turn the sheet into
          <br className="hidden sm:block" /> something you can hold
        </>
      }
      kicker="Ref — album catalogs, letterpress, Kodak packaging"
      lede="Pick a style and lay it out yourself on a proper light table, or hand the whole thing to a photographer and get a finished album back. Either way it ends up the same place: a real book on heavy stock, a set of prints, or a card sized for your phone."
      cta={{ href: '/create', label: 'Browse the catalogue' }}
    >
      {/* ── Two ways in ───────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <article className="flex h-full flex-col rounded-[4px] border border-border bg-card p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              Way in — 01
            </div>
            <h3 className="mt-2.5 font-serif text-2xl text-foreground">Build it yourself</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              A light table, not a toolbar. Page rail down the left, a technical
              stamp across the top — spread, dimensions, DPI, autosave — and
              nothing else between you and the spread.
            </p>

            <div className="mt-5 overflow-hidden rounded-[2px] border border-border">
              <div className="flex h-[26px] items-center gap-4 border-b border-border bg-surface-2 px-3 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
                <span className="text-foreground">Spread 03/12</span>
                <span>3600×3600px</span>
                <span className="hidden sm:inline">300 DPI</span>
                <span className="ml-auto">Saved 2s ago</span>
              </div>
              <div className="relative aspect-[16/10] bg-background">
                <Image
                  src="/images/open_photo_album.png"
                  alt="An album spread open in the editor"
                  fill
                  sizes="(max-width: 1024px) 100vw, 620px"
                  className="object-cover"
                />
              </div>
            </div>
            <Caption label="Editor">Autosaves as you go. Undo goes all the way back.</Caption>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="flex h-full flex-col rounded-[4px] border border-border bg-card p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              Way in — 02
            </div>
            <h3 className="mt-2.5 font-serif text-2xl text-foreground">Ask an artist</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              A commission, not a support ticket. You meet the photographer
              first — their portrait, their credentials, a strip of their past
              work — then write one brief in your own words.
            </p>

            <div className="mt-5 rounded-[2px] border border-border p-4">
              <div className="flex items-center gap-3.5 border-b border-border pb-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u('photo-1544005313-94ddf0286df2', 160)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-lg text-foreground">Priya Sen</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-secondary">
                    Wedding &amp; portrait · 9 yrs · 214 albums
                  </div>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-5 gap-1">
                {[
                  'photo-1519741497674-611481863552',
                  'photo-1465495976277-4387d4b0b4c6',
                  'photo-1511285560929-80b456fea0bc',
                  'photo-1519225421980-715cb0215aed',
                  'photo-1464349095431-e9a21285b5f3',
                ].map((id) => (
                  <div key={id} className="aspect-square overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u(id, 120)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <p className="mt-4 border-l-2 border-primary pl-4 font-serif text-base italic leading-relaxed text-ink-soft">
                Tell them about the day — what mattered, who to look for, what to
                leave out.
              </p>

              <div className="mt-4 inline-flex items-center rounded-[2px] border border-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-primary">
                Est. turnaround — 12–15 days
              </div>
            </div>
            <Caption label="Commission">You approve every proof before anything prints.</Caption>
          </article>
        </Reveal>
      </div>

      {/* ── The catalogue ─────────────────────────────────────────────── */}
      <Reveal delay={0.06}>
        <div className="mt-12 mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
            A catalogue, not a grid
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft sm:block">
            Each style, its own idiom
          </span>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Wedding — letterpress on an ivory mat */}
        <Reveal>
          <div className="h-full rounded-[4px] border border-border bg-card p-1">
            <div className="flex h-full flex-col border border-dashed border-border p-4">
              <div className="aspect-[3/4] overflow-hidden bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u('photo-1519741497674-611481863552', 320)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="mt-3 border-t border-border pt-3 text-center">
                <div className="font-serif text-xl text-foreground">Wedding</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft">
                  Engraved · Serif · Ivory mat
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Polaroid — the one deliberate drop shadow in the system */}
        <Reveal delay={0.05}>
          <div className="relative h-full bg-[#FDFAF5] p-2.5 pb-[34px] shadow-[0_1px_3px_var(--shadow-color)]">
            <div className="aspect-[3/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u('photo-1527631746610-bca00a040d60', 320)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-x-2.5 bottom-2.5 font-serif text-sm italic text-[#1C1814]">
              Polaroid
            </div>
          </div>
        </Reveal>

        {/* Travel — passport stamp */}
        <Reveal delay={0.1}>
          <div className="h-full rounded-[4px] border border-border bg-card p-3.5">
            <div className="aspect-[3/4] overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u('photo-1507525428034-b723cf961d3e', 320)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-foreground">
                Travel
              </span>
              <CompassMark size={20} />
            </div>
          </div>
        </Reveal>

        {/* Adventure — contact strip on black */}
        <Reveal delay={0.15}>
          <div className="flex h-full items-center gap-2 rounded-[4px] border border-border bg-foreground p-3.5">
            <SprocketRail count={4} className="pr-1" />
            <div className="h-[120px] w-[42%] overflow-hidden sm:h-[150px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u('photo-1506905925346-21bda4d32df4', 320)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 pl-1">
              <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#F5F0E8]">
                Adventure
              </div>
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-primary">
                ✂ Crop — grease pencil
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── What arrives ──────────────────────────────────────────────── */}
      <Reveal delay={0.06}>
        <div className="mt-10 grid items-center gap-6 rounded-[4px] border border-border bg-card p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
              And then it prints
            </div>
            <h3 className="mt-2.5 font-serif text-[clamp(1.5rem,4vw,2rem)] leading-tight text-foreground">
              Lay-flat volumes on heavy matte stock
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Every album exports as a print-ready PDF/X-4 at 300 DPI — the same
              file a professional lab would ask for. Order it bound, or take the
              file elsewhere. Polaroid prints ship as a set.
            </p>
            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
              {[
                ['12×12in', 'Trim size'],
                ['300 DPI', 'PDF/X-4'],
                ['Linen', 'Cover stock'],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                    {k}
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-surface-2">
            <Image
              src="/images/hardcover_stack.png"
              alt="A stack of printed hardcover Folio albums"
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover"
            />
          </div>
        </div>
      </Reveal>
    </Room>
  )
}
