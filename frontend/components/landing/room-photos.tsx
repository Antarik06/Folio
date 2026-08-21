import { Room } from './room-shell'
import { Reveal } from './reveal'
import { Plate } from './plate'

/**
 * Room 01 — Photos.
 *
 * Shown, not explained: an unbroken sheet on the left, the same frames grouped
 * into moments on the right. The difference between a library and an event is
 * legible from the rhythm alone, which is the point.
 */
export function RoomPhotos() {
  return (
    <Room
      id="photos"
      index="01"
      title="Everyone's camera roll, in one place."
      line="Share a code and everyone who was there adds theirs. Add a selfie once, and every photo you're in comes to you — including the ones you never knew existed."
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <figure className="m-0">
            <div className="grid grid-cols-5 gap-[2px]">
              {Array.from({ length: 20 }).map((_, i) => (
                <Plate key={i} ratio="1/1" />
              ))}
            </div>
            <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Just yours
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={0.08}>
          <figure className="m-0">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-[3px]">
                <Plate ratio="16/11" />
                <Plate ratio="1/1" />
                <Plate ratio="1/1" />
              </div>
              <div className="grid grid-cols-5 gap-[3px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Plate key={i} ratio="1/1" />
                ))}
              </div>
            </div>
            <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Everyone&apos;s, by the hour it happened
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Room>
  )
}
