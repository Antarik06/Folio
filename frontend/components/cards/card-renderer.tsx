'use client'

import {
  Fragment,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { buildCardLayout } from '@/lib/cards/layout'
import { COMPONENTS, renderComponent } from '@/lib/cards/registry'
import { createResolver } from '@/lib/cards/resolver'
import { isGradient, resolveStyle } from '@/lib/cards/style'
import { createCanvasMeasurer, estimateMeasurer, type Measurer } from '@/lib/cards/text'
import { toEdges, type EngineContext, type Placed } from '@/lib/cards/context'
import {
  normalizeCustomization,
  normalizeProfile,
  type CardCustomization,
  type CardProfileData,
  type CardStyle,
  type CustomElement,
  type Fill,
  type Rect,
  type TemplateDefinition,
} from '@/lib/cards/types'

/**
 * The one card renderer.
 *
 * There is no MinimalCard, no CinematicCard, no EditorialCard — there is this
 * file, and it draws whatever the template configuration in front of it
 * describes. Everything visual arrives as data.
 *
 * It renders SVG rather than HTML for one reason that turns out to matter a
 * great deal: the same document that scales to a 260px thumbnail rasterises to
 * a 2160px PNG, so what a user sees while editing is exactly what they export.
 */

/** Server render and first client render must agree, so both start estimating. */
export function useMeasurer(): Measurer {
  const [measurer, setMeasurer] = useState<Measurer>(estimateMeasurer)

  useEffect(() => {
    const canvasMeasurer = createCanvasMeasurer()
    if (canvasMeasurer) setMeasurer(canvasMeasurer)
  }, [])

  return measurer
}

export interface CardInteraction {
  selectedId: string | null
  onSelect(id: string | null): void
  /** Movement in canvas units, already converted from screen pixels. */
  onMove(id: string, dx: number, dy: number): void
  /** Which node ids the template allows the user to move. */
  movableIds: Set<string>
}

export interface CardRendererProps {
  definition: TemplateDefinition
  style?: CardStyle | null
  profile: Partial<CardProfileData>
  customization?: Partial<CardCustomization> | null
  /** Rendered width in CSS pixels. Height follows the template's aspect ratio. */
  width?: number
  className?: string
  interaction?: CardInteraction
  /** Passed through so the export engine can find the live SVG node. */
  svgRef?: React.Ref<SVGSVGElement>
  title?: string
}

function CardRendererImpl({
  definition,
  style,
  profile,
  customization,
  width,
  className,
  interaction,
  svgRef,
  title,
}: CardRendererProps) {
  const measurer = useMeasurer()

  const custom = useMemo(() => normalizeCustomization(customization), [customization])
  const data = useMemo(() => normalizeProfile(profile), [profile])

  const { layout, ctx } = useMemo(() => {
    const resolved = resolveStyle(style?.tokens, definition, custom)
    const engine: EngineContext = {
      style: resolved,
      resolver: createResolver(data),
      measurer,
      customization: custom,
      capabilities: definition.capabilities,
      canvas: definition.canvas,
    }
    return { layout: buildCardLayout(definition, engine), ctx: engine }
  }, [definition, style, data, custom, measurer])

  const { width: canvasWidth, height: canvasHeight } = layout
  const background = useMemo(
    () => definition.canvas.background ?? 'background',
    [definition.canvas.background]
  )

  // The SVG *attributes* only take lengths — `height="auto"` is rejected and
  // logged by every browser. When no width is given the card sizes itself from
  // its viewBox through CSS instead, which is what fills a grid cell.
  const pixelHeight = width ? (width * canvasHeight) / canvasWidth : undefined
  const dimensions: CSSProperties = {
    width: width ?? '100%',
    height: pixelHeight ?? 'auto',
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      width={width}
      height={pixelHeight}
      style={{ display: 'block', ...dimensions }}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ?? 'Card'}
      onPointerDown={interaction ? () => interaction.onSelect(null) : undefined}
    >
      <CardDefs ctx={ctx} background={background} canvas={{ width: canvasWidth, height: canvasHeight }} />

      <rect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        fill={isGradient(background) ? 'url(#cardBackground)' : ctx.style.color(background as string)}
      />

      {layout.root ? <PlacedNode placed={layout.root} ctx={ctx} interaction={interaction} /> : null}

      {custom.elements.map((element) => (
        <CustomElementNode
          key={element.id}
          element={element}
          ctx={ctx}
          canvas={{ width: canvasWidth, height: canvasHeight }}
          interaction={interaction}
        />
      ))}

      {ctx.style.vignette > 0 ? (
        <rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="url(#cardVignette)"
          opacity={ctx.style.vignette}
          pointerEvents="none"
        />
      ) : null}

      {ctx.style.grain > 0 ? (
        <rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          filter="url(#cardGrain)"
          opacity={ctx.style.grain}
          pointerEvents="none"
        />
      ) : null}
    </svg>
  )
}

export const CardRenderer = memo(CardRendererImpl)

/* ── Node painting ────────────────────────────────────────────────────────── */

function PlacedNode({
  placed,
  ctx,
  interaction,
}: {
  placed: Placed
  ctx: EngineContext
  interaction?: CardInteraction
}) {
  const { node, rect } = placed
  const isComponent = COMPONENTS[node.type] !== undefined

  const transform = node.id ? ctx.customization.transforms?.[node.id] : undefined
  const rotate = (node.rotate ?? 0) + (transform?.rotate ?? 0)
  const centreX = rect.x + rect.width / 2
  const centreY = rect.y + rect.height / 2

  const movable = !!(interaction && node.id && interaction.movableIds.has(node.id))
  const selected = !!(interaction && node.id && interaction.selectedId === node.id)

  const body = (
    <>
      <NodeDecoration placed={placed} ctx={ctx} />
      {isComponent ? renderComponent(placed, ctx) : null}
      {placed.children.map((child, index) => (
        <PlacedNode
          key={child.node.id ?? `${child.node.type}_${index}`}
          placed={child}
          ctx={ctx}
          interaction={interaction}
        />
      ))}
      {selected ? <SelectionOutline rect={rect} ctx={ctx} /> : null}
    </>
  )

  const handlers = movable && node.id ? dragHandlers(node.id, interaction!) : undefined

  return (
    <g
      transform={rotate ? `rotate(${rotate} ${centreX} ${centreY})` : undefined}
      opacity={node.opacity ?? undefined}
      style={movable ? { cursor: 'move' } : undefined}
      {...handlers}
    >
      {body}
    </g>
  )
}

/** A container's own fill, corner radius and rules. */
function NodeDecoration({ placed, ctx }: { placed: Placed; ctx: EngineContext }) {
  const { node, rect } = placed
  if (!node.background && !node.border) return null

  const radius = node.radius ?? 0
  const id = `bg_${node.id ?? Math.round(rect.x)}_${Math.round(rect.y)}`
  const gradient = isGradient(node.background as Fill)

  return (
    <Fragment>
      {gradient ? (
        <defs>
          <GradientDef fill={node.background as Fill} id={id} ctx={ctx} />
        </defs>
      ) : null}

      {node.background ? (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={radius}
          ry={radius}
          fill={gradient ? `url(#${id})` : ctx.style.color(node.background as string, 'transparent')}
        />
      ) : null}

      {node.border ? <NodeBorder node={node} rect={rect} ctx={ctx} /> : null}
    </Fragment>
  )
}

function NodeBorder({
  node,
  rect,
  ctx,
}: {
  node: Placed['node']
  rect: Rect
  ctx: EngineContext
}) {
  const border = node.border!
  const stroke = ctx.style.color(border.color, 'border')
  const dash = border.dashed ? `${border.width * 4} ${border.width * 3}` : undefined

  // A partial border is a set of rules, not a box — the editorial language uses
  // a single top or bottom rule far more often than a full outline.
  if (border.sides && border.sides.length > 0 && border.sides.length < 4) {
    const half = border.width / 2
    const lines: Record<string, [number, number, number, number]> = {
      top: [rect.x, rect.y + half, rect.x + rect.width, rect.y + half],
      bottom: [
        rect.x,
        rect.y + rect.height - half,
        rect.x + rect.width,
        rect.y + rect.height - half,
      ],
      left: [rect.x + half, rect.y, rect.x + half, rect.y + rect.height],
      right: [
        rect.x + rect.width - half,
        rect.y,
        rect.x + rect.width - half,
        rect.y + rect.height,
      ],
    }
    return (
      <>
        {border.sides.map((side) => {
          const [x1, y1, x2, y2] = lines[side]
          return (
            <line
              key={side}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={border.width}
              strokeDasharray={dash}
            />
          )
        })}
      </>
    )
  }

  return (
    <rect
      x={rect.x + border.width / 2}
      y={rect.y + border.width / 2}
      width={Math.max(0, rect.width - border.width)}
      height={Math.max(0, rect.height - border.width)}
      rx={node.radius ?? 0}
      ry={node.radius ?? 0}
      fill="none"
      stroke={stroke}
      strokeWidth={border.width}
      strokeDasharray={dash}
    />
  )
}

function SelectionOutline({ rect, ctx }: { rect: Rect; ctx: EngineContext }) {
  return (
    <rect
      x={rect.x - 4}
      y={rect.y - 4}
      width={rect.width + 8}
      height={rect.height + 8}
      fill="none"
      stroke={ctx.style.color('accent')}
      strokeWidth={3}
      strokeDasharray="10 8"
      pointerEvents="none"
    />
  )
}

/* ── Dragging ─────────────────────────────────────────────────────────────── */

/**
 * Pointer movement in screen pixels becomes movement in canvas units, so a drag
 * feels the same whether the card is previewed at 260px or 900px wide.
 */
function dragHandlers(id: string, interaction: CardInteraction) {
  return {
    onPointerDown(event: ReactPointerEvent<SVGGElement>) {
      event.stopPropagation()
      interaction.onSelect(id)

      const svg = event.currentTarget.ownerSVGElement
      if (!svg) return
      const box = svg.getBoundingClientRect()
      const viewBox = svg.viewBox.baseVal
      const scale = box.width > 0 ? viewBox.width / box.width : 1

      let lastX = event.clientX
      let lastY = event.clientY
      const target = event.currentTarget
      target.setPointerCapture(event.pointerId)

      const move = (moveEvent: PointerEvent) => {
        const dx = (moveEvent.clientX - lastX) * scale
        const dy = (moveEvent.clientY - lastY) * scale
        lastX = moveEvent.clientX
        lastY = moveEvent.clientY
        interaction.onMove(id, dx, dy)
      }

      const end = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
      }

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', end)
    },
  }
}

/* ── Custom elements ──────────────────────────────────────────────────────── */

const CUSTOM_ELEMENT_TYPES: Record<CustomElement['type'], string> = {
  text: 'text',
  sticker: 'sticker',
  badge: 'badge',
  divider: 'divider',
  shape: 'shape',
  image: 'image',
}

/**
 * A user's own additions. They live outside the layout tree on purpose: they
 * float over the composition at fractional coordinates, so they keep their
 * place at any canvas size and cannot push the template's own content around.
 */
function CustomElementNode({
  element,
  ctx,
  canvas,
  interaction,
}: {
  element: CustomElement
  ctx: EngineContext
  canvas: { width: number; height: number }
  interaction?: CardInteraction
}) {
  const spec = COMPONENTS[CUSTOM_ELEMENT_TYPES[element.type]]
  if (!spec) return null

  const props: Record<string, unknown> =
    element.type === 'divider'
      ? { weight: 2, color: element.color ?? 'accent', width: 220 }
      : element.type === 'shape'
        ? { kind: 'circle', fill: element.color ?? 'accent', height: 120 }
        : element.type === 'image'
          ? { src: element.value, fit: 'cover', height: 260, radius: 'image' }
          : {
              value: element.value,
              style: element.styleRole ?? (element.type === 'sticker' ? undefined : 'title'),
              color: element.color,
              size: element.type === 'sticker' ? 72 : undefined,
              align: 'center',
            }

  const available = { width: canvas.width * 0.7 }
  const node = { id: element.id, type: CUSTOM_ELEMENT_TYPES[element.type], props }
  const measured = spec.measure(props, ctx, available, node)
  if (!measured) return null

  const x = element.x * canvas.width - measured.width / 2
  const y = element.y * canvas.height - measured.height / 2
  const rect: Rect = { x, y, width: measured.width, height: measured.height }
  const placed: Placed = { node, props, rect, children: [], meta: measured.meta }

  const centreX = x + measured.width / 2
  const centreY = y + measured.height / 2
  const selected = interaction?.selectedId === element.id
  const handlers = interaction ? dragHandlers(element.id, interaction) : undefined

  return (
    <g
      transform={`rotate(${element.rotate} ${centreX} ${centreY}) scale(${element.scale}) translate(${
        (centreX * (1 - element.scale)) / element.scale
      } ${(centreY * (1 - element.scale)) / element.scale})`}
      style={interaction ? { cursor: 'move' } : undefined}
      {...handlers}
    >
      {spec.render(placed, ctx)}
      {selected ? <SelectionOutline rect={rect} ctx={ctx} /> : null}
    </g>
  )
}

/* ── Definitions ──────────────────────────────────────────────────────────── */

function GradientDef({ fill, id, ctx }: { fill: Fill; id: string; ctx: EngineContext }): ReactNode {
  if (!isGradient(fill)) return null
  const angle = fill.angle ?? 180
  const radians = ((angle - 90) * Math.PI) / 180
  const dx = Math.cos(radians) / 2
  const dy = Math.sin(radians) / 2

  const stops = fill.stops.map((stop, index) => (
    <stop
      key={index}
      offset={stop.offset}
      stopColor={ctx.style.color(stop.color)}
      stopOpacity={stop.opacity ?? 1}
    />
  ))

  return fill.type === 'radial' ? (
    <radialGradient id={id}>{stops}</radialGradient>
  ) : (
    <linearGradient id={id} x1={0.5 - dx} y1={0.5 - dy} x2={0.5 + dx} y2={0.5 + dy}>
      {stops}
    </linearGradient>
  )
}

/**
 * The film treatments, the grain and the vignette, defined once per card.
 *
 * These are SVG filters rather than CSS so they survive rasterisation — a CSS
 * filter would be discarded the moment the card is drawn into a canvas.
 */
function CardDefs({
  ctx,
  background,
  canvas,
}: {
  ctx: EngineContext
  background: Fill
  canvas: { width: number; height: number }
}) {
  return (
    <defs>
      {isGradient(background) ? (
        <GradientDef fill={background} id="cardBackground" ctx={ctx} />
      ) : null}

      {/*
        Every treatment declares sRGB. SVG filters default to linearRGB, which
        lightens a photograph noticeably and made "warm" wash a portrait out to
        near paper — the difference is very visible and never what was wanted.
      */}
      <filter id="cardGrayscale" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
      </filter>

      <filter id="cardSepia" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.393 0.769 0.189 0 0
                  0.349 0.686 0.168 0 0
                  0.272 0.534 0.131 0 0
                  0     0     0     1 0"
        />
      </filter>

      <filter id="cardWarm" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="1.05 0.01 0    0 0
                  0.01 1    0    0 0
                  0    0.01 0.93 0 0
                  0    0    0    1 0"
        />
      </filter>

      <filter id="cardCool" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.94 0    0.01 0 0
                  0    0.99 0.02 0 0
                  0.01 0.02 1.06 0 0
                  0    0    0    1 0"
        />
      </filter>

      <filter id="cardContrast" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.22" intercept="-0.11" />
          <feFuncG type="linear" slope="1.22" intercept="-0.11" />
          <feFuncB type="linear" slope="1.2" intercept="-0.1" />
        </feComponentTransfer>
      </filter>

      <filter id="cardFade" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0.78" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="0.86" intercept="0.09" />
          <feFuncG type="linear" slope="0.86" intercept="0.09" />
          <feFuncB type="linear" slope="0.88" intercept="0.08" />
        </feComponentTransfer>
      </filter>

      <filter id="cardGrain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>

      <radialGradient id="cardVignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.85" />
      </radialGradient>
    </defs>
  )
}

/* ── Convenience wrapper ──────────────────────────────────────────────────── */

/**
 * A card at a fixed display width, with the paper edge the rest of the app
 * uses. This is what a gallery cell renders.
 */
export function CardThumbnail({
  definition,
  style,
  profile,
  customization,
  width = 240,
  title,
  className,
}: Omit<CardRendererProps, 'interaction' | 'svgRef'>) {
  return (
    <div
      className={className}
      style={{
        width,
        boxShadow: '0 1px 3px var(--shadow-color)',
        background: 'var(--surface)',
        lineHeight: 0,
      }}
    >
      <CardRenderer
        definition={definition}
        style={style}
        profile={profile}
        customization={customization}
        width={width}
        title={title}
      />
    </div>
  )
}

export function useCardMeasurerReady(): boolean {
  const measurer = useMeasurer()
  return measurer.exact
}

/** Re-exported so callers do not need to reach into lib/cards for edge maths. */
export { toEdges }
