import { Room } from './room-shell'
import { Reveal } from './reveal'
import { Plate } from './plate'
import { OccasionCard } from './occasion-card'

/**
 * Room 03 — Profile.
 *
 * The only stage that leaves the building. Two objects: a card for the
 * occasion, and a page for the work you choose to publish. The privacy promise
 * is one sentence, because it is simple enough to be one sentence.
 */
export function RoomProfile() {
  return (
    <Room
      id="profile"
      index="03"
      title="Made to be sent."
      line="Cards for anniversaries, birthdays, Diwali — sized for the places you actually post them. And a page of your own, if you want one."
    >
      <div className="grid items-center gap-14 lg:grid-cols-[auto_1fr] lg:gap-20">
        <Reveal>
          <div className="justify-self-center lg:justify-self-start">
            <OccasionCard />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <figure className="m-0">
            <div className="bg-card p-5 ring-1 ring-inset ring-border sm:p-6">
              <div className="border-b-2 border-foreground pb-4">
                <div className="font-serif text-[clamp(1.5rem,4.5vw,2.2rem)] leading-none text-foreground">
                  Your name
                </div>
                <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  folio.app/p/you
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Plate key={i} ratio="4/5" />
                ))}
              </div>
            </div>

            <figcaption className="mt-5 max-w-[42ch] text-[14px] leading-relaxed text-muted-foreground">
              Nothing lands here until you put it here. Everything else stays
              between you and the people you invited.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Room>
  )
}
