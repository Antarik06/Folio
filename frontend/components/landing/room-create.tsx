import { Room } from './room-shell'
import { Reveal } from './reveal'
import { Plate } from './plate'
import { CompassMark, SprocketRail } from '@/components/folio/marks'
import { ALBUM_STYLES } from '@/lib/magazine-templates'

/**
 * Room 02 — Create.
 *
 * The five styles, each in its own print idiom. Even with every frame empty,
 * the ivory mat, the passport stamp, the wide plate, the contact strip and the
 * ledger are each recognisable — which is the argument the section is making.
 *
 * The names come from ALBUM_STYLES so the landing page cannot drift out of step
 * with the catalogue: adding or renaming a style updates both.
 */

/** Each style's idiom, drawn as an empty object. */
const IDIOMS: Record<string, (name: string) => React.ReactNode> = {
  letterpress: (name) => (
    <div className="h-full bg-card p-1 ring-1 ring-inset ring-border">
      <div className="flex h-full flex-col border border-dashed border-border p-3.5">
        <Plate ratio="3/4" mark />
        <div className="mt-3.5 border-t border-border pt-3 text-center">
          <div className="font-serif text-lg text-foreground">{name}</div>
        </div>
      </div>
    </div>
  ),

  stamp: (name) => (
    <div className="relative h-full bg-card p-3.5 ring-1 ring-inset ring-border">
      <Plate ratio="3/4" />
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
          {name}
        </span>
        <CompassMark size={18} />
      </div>
    </div>
  ),

  plate: (name) => (
    <div className="h-full bg-card p-5 ring-1 ring-inset ring-border">
      <Plate ratio="3/4" />
      <div className="mt-4 text-center font-serif text-lg italic text-foreground">{name}</div>
    </div>
  ),

  'contact-strip': (name) => (
    <div className="flex h-full flex-col justify-between bg-foreground p-3.5">
      <div className="flex items-start gap-2.5">
        <SprocketRail count={4} />
        <div className="flex-1">
          <Plate ratio="4/5" tone="dark" />
        </div>
      </div>
      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F5F0E8]">
        {name}
      </div>
    </div>
  ),

  ledger: (name) => (
    <div className="flex h-full flex-col bg-card p-3.5 ring-1 ring-inset ring-border">
      <div className="mb-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
        <span>Entry</span>
        <span>—</span>
      </div>
      <div className="flex flex-1 flex-col gap-[3px]">
        <Plate ratio="16/9" />
        <Plate ratio="16/9" />
      </div>
      <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
        {name}
      </div>
    </div>
  ),
}

export function RoomCreate() {
  return (
    <Room
      id="create"
      index="02"
      tone="press"
      title="Turn them into something real."
      line="Five styles, two or three layouts each. Lay one out yourself, or hand the whole thing to a photographer and get a finished album back."
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
        {ALBUM_STYLES.map((style, i) => (
          <Reveal key={style.id} delay={0.05 * i}>
            {IDIOMS[style.idiom]?.(style.name) ?? IDIOMS.plate(style.name)}
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.08}>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Lay-flat on heavy stock — or export the print file and take it anywhere
        </p>
      </Reveal>
    </Room>
  )
}
