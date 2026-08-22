import type { AlbumElement, AlbumPageSide } from './types'

/**
 * A page drawn small.
 *
 * The page rail used to show numbered white boxes labelled FRONT and BACK,
 * which meant the only way to find a spread was to remember its number. This
 * draws the actual page — photographs in their real slots, type as weighted
 * bars, shapes as blocks — at the real element coordinates, scaled down.
 */
export function PageThumb({
  side,
  width,
  height,
  className,
}: {
  side: AlbumPageSide | undefined
  /** The page's coordinate space, so elements land where they really are. */
  width: number
  height: number
  className?: string
}) {
  const elements = [...(side?.elements ?? [])]
    .filter((el) => !el.hidden)
    .sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className ?? ''}`}
      style={{ background: side?.background || '#ffffff' }}
    >
      {elements.map((el) => (
        <ThumbElement key={el.id} el={el} width={width} height={height} />
      ))}
    </div>
  )
}

function ThumbElement({
  el,
  width,
  height,
}: {
  el: AlbumElement
  width: number
  height: number
}) {
  const box: React.CSSProperties = {
    position: 'absolute',
    left: `${(el.x / width) * 100}%`,
    top: `${(el.y / height) * 100}%`,
    width: `${(el.width / width) * 100}%`,
    height: `${(el.height / height) * 100}%`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: 'top left',
  }

  if (el.type === 'image') {
    return el.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt=""
        loading="lazy"
        style={{ ...box, objectFit: el.fitMode === 'fit' ? 'contain' : 'cover' }}
      />
    ) : (
      <span
        style={{
          ...box,
          background: 'rgba(28,24,20,0.05)',
          outline: '1px dashed rgba(28,24,20,0.2)',
          outlineOffset: '-1px',
        }}
      />
    )
  }

  if (el.type === 'shape') {
    return (
      <span
        style={{
          ...box,
          background: el.fill,
          borderRadius: el.shapeType === 'circle' ? '50%' : undefined,
        }}
      />
    )
  }

  if (el.type === 'drawing') {
    return <span style={{ ...box, background: el.stroke, opacity: 0.5 }} />
  }

  // Type is drawn as a weighted bar: 4px text would be unreadable noise, but
  // its position and scale are exactly what you scan a page rail for.
  const big = el.fontSize > 30
  return (
    <span
      style={{
        ...box,
        height: big ? '5%' : '2.4%',
        background: el.fill,
        opacity: big ? 0.8 : 0.45,
      }}
    />
  )
}
