import type { AlbumSpread } from '@/components/album-editor/types'
import { PAGE_W, PAGE_H } from '@/lib/album-layouts'

/**
 * A template drawn as itself.
 *
 * Instead of a stock photograph with a category label under it, each template
 * previews its own composition: the real element coordinates from its spreads,
 * scaled down. Photo slots read as filled blocks, type as hairlines, rules as
 * accent marks — so you are looking at the layout you would actually get.
 *
 * It is also why the catalogue needs no imagery at all. When real photographs
 * arrive they go into the album, not into a marketing thumbnail.
 */
export function AlbumMiniature({
  spreads,
  palette,
  /** How many pages of the template to show, left to right. */
  pages = 3,
  className,
}: {
  spreads: AlbumSpread[]
  palette: { paper: string; ink: string; accent: string; dark: string }
  pages?: number
  className?: string
}) {
  // Flatten spreads back into page sides, cover first.
  const sides: { background: string; elements: any[] }[] = []
  for (const spread of spreads) {
    if (spread.front) sides.push(spread.front)
    if (spread.back) sides.push(spread.back)
    if (sides.length >= pages) break
  }

  const shown = sides.slice(0, pages)
  if (shown.length === 0) return null

  return (
    <div className={`flex gap-[3px] ${className ?? ''}`}>
      {shown.map((side, i) => (
        <div
          key={i}
          className="relative flex-1 overflow-hidden ring-1 ring-inset ring-black/[0.06]"
          style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, background: side.background }}
        >
          {side.elements.map((el: any) => {
            const box = {
              position: 'absolute' as const,
              left: `${(el.x / PAGE_W) * 100}%`,
              top: `${(el.y / PAGE_H) * 100}%`,
              width: `${(el.width / PAGE_W) * 100}%`,
              height: `${(el.height / PAGE_H) * 100}%`,
            }

            if (el.type === 'image') {
              return (
                <span
                  key={el.id}
                  style={{ ...box, background: palette.ink, opacity: 0.13 }}
                />
              )
            }

            if (el.type === 'shape') {
              return (
                <span
                  key={el.id}
                  style={{ ...box, background: palette.accent, minHeight: 1 }}
                />
              )
            }

            // Type is drawn as a weighted bar — enough to read the position and
            // scale of the heading without rendering unreadable 3px text.
            const isBig = (el.fontSize ?? 16) > 30
            return (
              <span
                key={el.id}
                style={{
                  ...box,
                  height: isBig ? '3.5%' : '1.6%',
                  background: el.fill ?? palette.ink,
                  opacity: isBig ? 0.75 : 0.4,
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
