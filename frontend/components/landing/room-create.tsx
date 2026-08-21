import { Room } from './room-shell'
import { Reveal } from './reveal'
import { Plate } from './plate'
import { CompassMark, SprocketRail } from '@/components/folio/marks'

/**
 * Room 02 — Create.
 *
 * Four styles, four different physical objects. Even with every plate empty,
 * the mat, the instant frame, the stamp and the contact strip are each
 * recognisable — which is the argument the section is making.
 */
export function RoomCreate() {
  return (
    <Room
      id="create"
      index="02"
      tone="press"
      title="Turn them into something real."
      line="Lay out an album yourself, or hand the whole thing to a photographer. It comes back as a book you can hold, a set of prints, or a card."
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {/* Wedding — engraved, on an ivory mat */}
        <Reveal>
          <div className="h-full bg-card p-1 ring-1 ring-inset ring-border">
            <div className="flex h-full flex-col border border-dashed border-border p-3.5 sm:p-4">
              <Plate ratio="3/4" mark />
              <div className="mt-3.5 border-t border-border pt-3 text-center">
                <div className="font-serif text-lg text-foreground sm:text-xl">Wedding</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Polaroid — the one deliberate shadow in the system */}
        <Reveal delay={0.05}>
          <div className="relative h-full bg-[#FDFAF5] p-2.5 pb-9 shadow-[0_1px_3px_var(--shadow-color)]">
            <Plate ratio="3/4" />
            <div className="absolute inset-x-2.5 bottom-2.5 font-serif text-sm italic text-[#1C1814]">
              Polaroid
            </div>
          </div>
        </Reveal>

        {/* Travel — passport stamp */}
        <Reveal delay={0.1}>
          <div className="h-full bg-card p-3.5 ring-1 ring-inset ring-border">
            <Plate ratio="3/4" />
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
                Travel
              </span>
              <CompassMark size={18} />
            </div>
          </div>
        </Reveal>

        {/* Adventure — contact strip on black */}
        <Reveal delay={0.15}>
          <div className="flex h-full flex-col justify-between bg-foreground p-3.5">
            <div className="flex items-start gap-2.5">
              <SprocketRail count={4} />
              <div className="flex-1">
                <Plate ratio="4/5" tone="dark" />
              </div>
            </div>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]">
              Adventure
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Lay-flat on heavy stock — or export the print file and take it anywhere
        </p>
      </Reveal>
    </Room>
  )
}
