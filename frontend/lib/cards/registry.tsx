import type { ReactNode } from 'react'
import {
  type ComponentSpec,
  type EngineContext,
  type Placed,
  resolveSize,
} from './context'
import { applyTransform, isGradient, TREATMENT_FILTERS, type ResolvedTextStyle } from './style'
import { firstBaseline, layoutText, type TextLayout } from './text'
import type { CardNode, Fill, ImageTreatment, Rect, TextStyleDef } from './types'

/**
 * The component registry.
 *
 * This is the extension point of the whole engine. A template names a `type`
 * and the renderer looks it up here — there is no switch statement anywhere
 * else, and no template has its own code path. Adding `musicCard` to a card is
 * one entry in this object plus one entry in the backend's COMPONENT_TYPES
 * allowlist; every existing template can then use it.
 *
 * Each spec measures itself against an offered width and draws itself into the
 * rectangle the layout engine hands back. Neither function ever decides where
 * it sits on the card.
 */

/* ── Prop reading ─────────────────────────────────────────────────────────── */

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(str).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value)
}

function num(value: unknown, fallback?: number): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined || value === '') return []
  return [value]
}

/** Strips undefined so a spread override never blanks an inherited property. */
function compact(input: Record<string, unknown>): TextStyleDef {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value
  }
  return out as TextStyleDef
}

function textStyleFrom(
  props: Record<string, unknown>,
  ctx: EngineContext,
  role: string,
  prefix = ''
): ResolvedTextStyle {
  const key = (name: string) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name)
  return ctx.style.text(str(props[key('style')]) || role, compact({
    size: num(props[key('size')]),
    weight: num(props[key('weight')]),
    italic: bool(props[key('italic')]),
    letterSpacing: num(props[key('letterSpacing')]),
    lineHeight: num(props[key('lineHeight')]),
    transform: props[key('transform')] as TextStyleDef['transform'],
    color: props[key('color')] ? str(props[key('color')]) : undefined,
    opacity: num(props[key('opacity')]),
    align: props[key('align')] as TextStyleDef['align'],
  }))
}

/* ── Shared drawing ───────────────────────────────────────────────────────── */

/**
 * Draws a laid-out block of text. Lines were decided at measure time, so this
 * only places baselines — which is why the preview and the export break
 * identically.
 */
function drawText(
  layout: TextLayout,
  rect: Rect,
  style: ResolvedTextStyle,
  key: string
): ReactNode {
  if (layout.lines.length === 0) return null

  const anchor = style.align === 'center' ? 'middle' : style.align === 'right' ? 'end' : 'start'
  const x =
    style.align === 'center'
      ? rect.x + rect.width / 2
      : style.align === 'right'
        ? rect.x + rect.width
        : rect.x
  const baseline = rect.y + firstBaseline(layout.size, layout.lineHeight)

  return (
    <text
      key={key}
      x={x}
      fontFamily={style.fontFamily}
      fontSize={layout.size}
      fontWeight={style.weight}
      fontStyle={style.italic ? 'italic' : undefined}
      letterSpacing={style.letterSpacing || undefined}
      fill={style.color}
      opacity={style.opacity === 1 ? undefined : style.opacity}
      xmlSpace="preserve"
    >
      {layout.lines.map((line, index) => (
        <tspan key={index} x={x} y={baseline + index * layout.size * layout.lineHeight} textAnchor={anchor}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

/** A fill that may be a token, a hex value or a gradient definition. */
function paint(fill: Fill | undefined, ctx: EngineContext, gradientId: string): {
  value: string
  def: ReactNode | null
} {
  if (isGradient(fill)) {
    const angle = fill.angle ?? 180
    const radians = ((angle - 90) * Math.PI) / 180
    const dx = Math.cos(radians) / 2
    const dy = Math.sin(radians) / 2
    const def =
      fill.type === 'radial' ? (
        <radialGradient id={gradientId} key={gradientId}>
          {fill.stops.map((stop, index) => (
            <stop
              key={index}
              offset={stop.offset}
              stopColor={ctx.style.color(stop.color)}
              stopOpacity={stop.opacity ?? 1}
            />
          ))}
        </radialGradient>
      ) : (
        <linearGradient
          id={gradientId}
          key={gradientId}
          x1={0.5 - dx}
          y1={0.5 - dy}
          x2={0.5 + dx}
          y2={0.5 + dy}
        >
          {fill.stops.map((stop, index) => (
            <stop
              key={index}
              offset={stop.offset}
              stopColor={ctx.style.color(stop.color)}
              stopOpacity={stop.opacity ?? 1}
            />
          ))}
        </linearGradient>
      )
    return { value: `url(#${gradientId})`, def }
  }
  return { value: ctx.style.color(fill as string | undefined, 'transparent'), def: null }
}

function treatmentFilter(treatment: ImageTreatment | undefined): string | undefined {
  const id = treatment ? TREATMENT_FILTERS[treatment] : null
  return id ? `url(#${id})` : undefined
}

/* ── text ─────────────────────────────────────────────────────────────────── */

function textContent(props: Record<string, unknown>): string {
  const parts = Array.isArray(props.parts)
    ? props.parts.map(str).map((part) => part.trim()).filter(Boolean)
    : null
  const joined = parts ? parts.join(str(props.separator) || ' · ') : str(props.value)
  return joined.trim() || str(props.fallback).trim()
}

const textSpec: ComponentSpec = {
  label: 'Text',
  content: { prop: 'value', kind: 'text', label: 'Text' },
  measure(props, ctx, available) {
    const style = textStyleFrom(props, ctx, 'body')
    const value = applyTransform(textContent(props), style.transform)
    if (!value) return null
    const layout = layoutText(value, style, available.width, ctx.measurer, {
      maxLines: num(props.maxLines),
      fit: bool(props.fit),
    })
    if (layout.lines.length === 0) return null
    return { width: layout.width, height: layout.height, meta: { layout, style } }
  },
  render(placed) {
    const meta = placed.meta as { layout: TextLayout; style: ResolvedTextStyle }
    return drawText(meta.layout, placed.rect, meta.style, 'text')
  },
}

/* ── image ────────────────────────────────────────────────────────────────── */

const imageSpec: ComponentSpec = {
  label: 'Photograph',
  imageProp: 'src',
  measure(props, ctx, available) {
    const matte = num(props.matte, 0) ?? 0
    const width = available.width
    const explicit = num(props.height)
    const ratio = num(props.ratio)
    const height = explicit ?? (ratio ? width / ratio : available.height ?? width)
    return { width, height: Math.max(0, height), meta: { matte } }
  },
  render(placed, ctx) {
    const { props, rect } = placed
    const id = placed.node.id ?? 'image'
    const matte = num(props.matte, 0) ?? 0
    const shape = str(props.shape) || 'rect'
    const radius =
      shape === 'circle'
        ? Math.min(rect.width, rect.height) / 2
        : ctx.style.radius(
            typeof props.radius === 'number' ? props.radius : str(props.radius) || undefined,
            0
          )

    const inner: Rect = {
      x: rect.x + matte,
      y: rect.y + matte,
      width: Math.max(0, rect.width - matte * 2),
      height: Math.max(0, rect.height - matte * 2),
    }
    const innerRadius = shape === 'circle' ? Math.min(inner.width, inner.height) / 2 : radius

    const src = str(props.src)
    const scale = num(props.__imageScale, 1) ?? 1
    const offsetX = num(props.__imageOffsetX, 0) ?? 0
    const offsetY = num(props.__imageOffsetY, 0) ?? 0

    const drawWidth = inner.width * scale
    const drawHeight = inner.height * scale
    const drawX = inner.x + (inner.width - drawWidth) / 2 + (offsetX * inner.width) / 2
    const drawY = inner.y + (inner.height - drawHeight) / 2 + (offsetY * inner.height) / 2

    const clipId = `clip_${id}`
    const overlay = paint(props.overlay as Fill | undefined, ctx, `overlay_${id}`)
    const treatment =
      (str(props.treatment) as ImageTreatment) || ctx.style.imageTreatment || 'none'
    const border = num(props.borderWidth, 0) ?? 0

    return (
      <g key={id}>
        <defs>
          <clipPath id={clipId}>
            <rect
              x={inner.x}
              y={inner.y}
              width={inner.width}
              height={inner.height}
              rx={innerRadius}
              ry={innerRadius}
            />
          </clipPath>
          {overlay.def}
        </defs>

        {matte > 0 ? (
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={shape === 'circle' ? rect.width / 2 : radius}
            ry={shape === 'circle' ? rect.height / 2 : radius}
            fill={ctx.style.color(str(props.matteColor) || 'surface')}
          />
        ) : null}

        {src ? (
          <image
            href={src}
            x={drawX}
            y={drawY}
            width={drawWidth}
            height={drawHeight}
            preserveAspectRatio={
              str(props.fit) === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'
            }
            clipPath={`url(#${clipId})`}
            filter={treatmentFilter(treatment)}
            crossOrigin="anonymous"
          />
        ) : (
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={inner.x}
              y={inner.y}
              width={inner.width}
              height={inner.height}
              fill={ctx.style.color('surfaceAlt')}
            />
            <g
              transform={`translate(${inner.x + inner.width / 2} ${inner.y + inner.height / 2})`}
              opacity={0.4}
            >
              <circle r={26} fill="none" stroke={ctx.style.color('inkSoft')} strokeWidth={2} />
              <path
                d="M0 -46V46M-46 0H46"
                stroke={ctx.style.color('inkSoft')}
                strokeWidth={1.5}
              />
            </g>
          </g>
        )}

        {overlay.value !== 'transparent' ? (
          <rect
            x={inner.x}
            y={inner.y}
            width={inner.width}
            height={inner.height}
            rx={innerRadius}
            ry={innerRadius}
            fill={overlay.value}
          />
        ) : null}

        {border > 0 ? (
          <rect
            x={inner.x + border / 2}
            y={inner.y + border / 2}
            width={Math.max(0, inner.width - border)}
            height={Math.max(0, inner.height - border)}
            rx={innerRadius}
            ry={innerRadius}
            fill="none"
            stroke={ctx.style.color(str(props.borderColor) || 'border')}
            strokeWidth={border}
          />
        ) : null}
      </g>
    )
  },
}

/* ── photoGrid ────────────────────────────────────────────────────────────── */

interface GridMeta {
  cells: { url: string; rect: Rect }[]
  radius: number
}

const photoGridSpec: ComponentSpec = {
  label: 'Photo grid',
  measure(props, ctx, available) {
    const photos = list(props.source)
      .map((photo) => (typeof photo === 'string' ? photo : str((photo as any)?.url)))
      .filter(Boolean)
      .slice(num(props.start, 0), (num(props.start, 0) ?? 0) + (num(props.count, 4) ?? 4))
    if (photos.length === 0) return null

    const columns = Math.max(1, num(props.columns, 2) ?? 2)
    const gap = ctx.style.space(props.gap as number | string, 8)
    const ratio = num(props.ratio, 1) ?? 1
    const cellWidth = (available.width - gap * (columns - 1)) / columns
    const cellHeight = cellWidth / ratio
    const rows = Math.ceil(photos.length / columns)

    const cells = photos.map((url, index) => ({
      url,
      rect: {
        x: (index % columns) * (cellWidth + gap),
        y: Math.floor(index / columns) * (cellHeight + gap),
        width: cellWidth,
        height: cellHeight,
      },
    }))

    return {
      width: available.width,
      height: rows * cellHeight + (rows - 1) * gap,
      meta: {
        cells,
        radius: ctx.style.radius(str(props.radius) || 'image', 0),
      } satisfies GridMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as GridMeta
    const id = placed.node.id ?? 'grid'
    const treatment =
      (str(placed.props.treatment) as ImageTreatment) || ctx.style.imageTreatment || 'none'

    return (
      <g key={id}>
        <defs>
          {meta.cells.map((cell, index) => (
            <clipPath id={`${id}_cell_${index}`} key={index}>
              <rect
                x={placed.rect.x + cell.rect.x}
                y={placed.rect.y + cell.rect.y}
                width={cell.rect.width}
                height={cell.rect.height}
                rx={meta.radius}
                ry={meta.radius}
              />
            </clipPath>
          ))}
        </defs>
        {meta.cells.map((cell, index) => (
          <image
            key={index}
            href={cell.url}
            x={placed.rect.x + cell.rect.x}
            y={placed.rect.y + cell.rect.y}
            width={cell.rect.width}
            height={cell.rect.height}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${id}_cell_${index})`}
            filter={treatmentFilter(treatment)}
            crossOrigin="anonymous"
          />
        ))}
      </g>
    )
  },
}

/* ── photoStack ───────────────────────────────────────────────────────────── */

interface StackMeta {
  photos: string[]
  frame: { width: number; height: number }
  matte: number
  spread: number
  caption: string
  captionStyle: ResolvedTextStyle
  captionLayout: TextLayout | null
}

const photoStackSpec: ComponentSpec = {
  label: 'Photo stack',
  measure(props, ctx, available) {
    const photos = list(props.source)
      .map((photo) => (typeof photo === 'string' ? photo : str((photo as any)?.url)))
      .filter(Boolean)
      .slice(0, Math.max(1, num(props.count, 3) ?? 3))

    const height = available.height ?? available.width * 1.15
    const matte = num(props.matteWidth, 24) ?? 24
    const ratio = num(props.ratio, 1) ?? 1

    // The top print is the reference; the ones behind it are the same size,
    // just rotated, so the stack reads as one object.
    const frameWidth = Math.min(available.width * 0.78, (height - matte * 2) * ratio)
    const frameHeight = frameWidth / ratio + matte * 2.4

    const caption = str(props.caption)
    const captionStyle = ctx.style.text('caption', { align: 'center' })
    const captionLayout = caption
      ? layoutText(caption, captionStyle, frameWidth - matte * 2, ctx.measurer, { maxLines: 1 })
      : null

    return {
      width: available.width,
      height,
      meta: {
        photos,
        frame: { width: frameWidth + matte * 2, height: frameHeight },
        matte,
        spread: num(props.spread, 6) ?? 6,
        caption,
        captionStyle,
        captionLayout,
      } satisfies StackMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as StackMeta
    const id = placed.node.id ?? 'stack'
    const { rect } = placed
    const centreX = rect.x + rect.width / 2
    const centreY = rect.y + rect.height / 2
    const treatment =
      (str(placed.props.treatment) as ImageTreatment) || ctx.style.imageTreatment || 'none'

    // Back to front, so the newest print sits on top and stays square.
    const slots = meta.photos.length > 0 ? meta.photos : ['']
    const order = slots.map((url, index) => ({ url, index })).reverse()

    return (
      <g key={id}>
        <defs>
          {order.map(({ index }) => {
            const inner = {
              x: centreX - meta.frame.width / 2 + meta.matte,
              y: centreY - meta.frame.height / 2 + meta.matte,
              width: meta.frame.width - meta.matte * 2,
              height: meta.frame.height - meta.matte * 2 - meta.matte * 1.6,
            }
            return (
              <clipPath id={`${id}_print_${index}`} key={index}>
                <rect x={inner.x} y={inner.y} width={inner.width} height={inner.height} />
              </clipPath>
            )
          })}
        </defs>

        {order.map(({ url, index }) => {
          // The first photograph is the subject: it sits on top and square,
          // and the ones behind it fan out further the deeper they are.
          const depth = index
          const angle = depth === 0 ? 0 : (index % 2 === 0 ? 1 : -1) * meta.spread * depth
          const inner = {
            x: centreX - meta.frame.width / 2 + meta.matte,
            y: centreY - meta.frame.height / 2 + meta.matte,
            width: meta.frame.width - meta.matte * 2,
            height: meta.frame.height - meta.matte * 2 - meta.matte * 1.6,
          }

          return (
            <g key={index} transform={`rotate(${angle} ${centreX} ${centreY})`}>
              <rect
                x={centreX - meta.frame.width / 2}
                y={centreY - meta.frame.height / 2}
                width={meta.frame.width}
                height={meta.frame.height}
                fill={ctx.style.color('surface')}
              />
              {url ? (
                <image
                  href={url}
                  x={inner.x}
                  y={inner.y}
                  width={inner.width}
                  height={inner.height}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${id}_print_${index})`}
                  filter={treatmentFilter(treatment)}
                  crossOrigin="anonymous"
                />
              ) : (
                <rect
                  x={inner.x}
                  y={inner.y}
                  width={inner.width}
                  height={inner.height}
                  fill={ctx.style.color('surfaceAlt')}
                />
              )}
              {depth === 0 && meta.captionLayout ? (
                drawText(
                  meta.captionLayout,
                  {
                    x: inner.x,
                    y: inner.y + inner.height + meta.matte * 0.35,
                    width: inner.width,
                    height: meta.matte * 1.6,
                  },
                  meta.captionStyle,
                  'caption'
                )
              ) : null}
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── quote ────────────────────────────────────────────────────────────────── */

interface QuoteMeta {
  layout: TextLayout
  style: ResolvedTextStyle
  authorLayout: TextLayout | null
  authorStyle: ResolvedTextStyle
  markSize: number
  indent: number
}

const quoteSpec: ComponentSpec = {
  label: 'Quote',
  content: { prop: 'value', kind: 'text', label: 'Quote' },
  measure(props, ctx, available) {
    const style = textStyleFrom(props, ctx, 'quote')
    const value = str(props.value).trim()
    if (!value) return null

    const showMark = bool(props.mark) ?? false
    const markSize = showMark ? style.size * 1.9 : 0
    const indent = showMark ? markSize * 0.62 : 0

    const layout = layoutText(`“${value}”`, style, available.width - indent, ctx.measurer, {
      maxLines: num(props.maxLines, 4),
    })

    const authorStyle = textStyleFrom(props, ctx, 'label', 'author')
    const author = str(props.author).trim()
    const authorLayout = author
      ? layoutText(
          applyTransform(`— ${author}`, authorStyle.transform),
          authorStyle,
          available.width - indent,
          ctx.measurer,
          { maxLines: 1 }
        )
      : null

    return {
      width: available.width,
      height: layout.height + (authorLayout ? authorLayout.height + 12 : 0),
      meta: { layout, style, authorLayout, authorStyle, markSize, indent } satisfies QuoteMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as QuoteMeta
    const { rect } = placed
    const body: Rect = { ...rect, x: rect.x + meta.indent, width: rect.width - meta.indent }

    return (
      <g key={placed.node.id ?? 'quote'}>
        {meta.markSize > 0 ? (
          <text
            x={rect.x}
            y={rect.y + meta.markSize * 0.78}
            fontFamily={meta.style.fontFamily}
            fontSize={meta.markSize}
            fill={ctx.style.color('accent')}
            opacity={0.35}
          >
            “
          </text>
        ) : null}
        {drawText(meta.layout, body, meta.style, 'quote')}
        {meta.authorLayout
          ? drawText(
              meta.authorLayout,
              { ...body, y: body.y + meta.layout.height + 12 },
              meta.authorStyle,
              'author'
            )
          : null}
      </g>
    )
  },
}

/* ── tagList ──────────────────────────────────────────────────────────────── */

interface TagMeta {
  variant: string
  style: ResolvedTextStyle
  chips: { text: string; rect: Rect }[]
  inline: TextLayout | null
  padX: number
  padY: number
  radius: number
}

const tagListSpec: ComponentSpec = {
  label: 'Tags',
  content: { prop: 'source', kind: 'lines', label: 'Tags' },
  measure(props, ctx, available) {
    const items = list(props.source).map(str).map((item) => item.trim()).filter(Boolean)
    const max = num(props.max, 8) ?? 8
    const shown = items.slice(0, max)
    if (shown.length === 0) return null

    const style = textStyleFrom(props, ctx, 'tag')
    const variant = str(props.variant) || 'pill'

    // The dot variant is one flowing line, not chips — it wraps as prose.
    if (variant === 'dot' || variant === 'inline') {
      const separator = str(props.separator) || '  ·  '
      const inline = layoutText(
        applyTransform(shown.join(separator), style.transform),
        style,
        available.width,
        ctx.measurer,
        { maxLines: num(props.maxLines, 2) }
      )
      return {
        width: inline.width,
        height: inline.height,
        meta: { variant, style, chips: [], inline, padX: 0, padY: 0, radius: 0 } satisfies TagMeta,
      }
    }

    const padX = num(props.padX, style.size * 0.7) ?? 16
    const padY = num(props.padY, style.size * 0.42) ?? 10
    const gap = ctx.style.space(props.gap as number | string, 10)
    const chipHeight = style.size * style.lineHeight + padY * 2
    const radius = ctx.style.radius(str(props.radius) || 'pill', 999)

    const chips: TagMeta['chips'] = []
    let x = 0
    let y = 0
    for (const item of shown) {
      const label = applyTransform(item, style.transform)
      const width = ctx.measurer.width(label, style) + padX * 2
      if (x > 0 && x + width > available.width) {
        x = 0
        y += chipHeight + gap
      }
      chips.push({ text: label, rect: { x, y, width, height: chipHeight } })
      x += width + gap
    }

    return {
      width: available.width,
      height: y + chipHeight,
      meta: { variant, style, chips, inline: null, padX, padY, radius } satisfies TagMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as TagMeta
    const { rect } = placed
    const id = placed.node.id ?? 'tags'

    if (meta.inline) {
      return drawText(meta.inline, rect, meta.style, id)
    }

    const filled = meta.variant === 'pill'
    return (
      <g key={id}>
        {meta.chips.map((chip, index) => {
          const x = rect.x + chip.rect.x
          const y = rect.y + chip.rect.y
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={chip.rect.width}
                height={chip.rect.height}
                rx={meta.radius}
                ry={meta.radius}
                fill={filled ? ctx.style.color('surfaceAlt') : 'transparent'}
                stroke={filled ? undefined : ctx.style.color('border')}
                strokeWidth={filled ? undefined : 1.5}
              />
              <text
                x={x + chip.rect.width / 2}
                y={y + firstBaseline(meta.style.size, meta.style.lineHeight) + meta.padY}
                textAnchor="middle"
                fontFamily={meta.style.fontFamily}
                fontSize={meta.style.size}
                fontWeight={meta.style.weight}
                letterSpacing={meta.style.letterSpacing || undefined}
                fill={meta.style.color}
              >
                {chip.text}
              </text>
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── list ─────────────────────────────────────────────────────────────────── */

interface ListRow {
  marker: string
  primary: TextLayout
  secondary: TextLayout | null
  y: number
  height: number
}

interface ListMeta {
  rows: ListRow[]
  style: ResolvedTextStyle
  secondaryStyle: ResolvedTextStyle
  markerStyle: ResolvedTextStyle
  markerWidth: number
  markerKind: string
  markerColor: string
}

const listSpec: ComponentSpec = {
  label: 'List',
  content: { prop: 'source', kind: 'lines', label: 'List' },
  measure(props, ctx, available) {
    const field = str(props.field)
    const secondaryField = str(props.secondaryField)
    const items = list(props.source)
      .slice(0, num(props.max, 6) ?? 6)
      .map((item) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          return {
            primary: str(field ? record[field] : record.title ?? record.label ?? ''),
            secondary: secondaryField ? str(record[secondaryField]) : '',
          }
        }
        return { primary: str(item), secondary: '' }
      })
      .filter((item) => item.primary.trim() !== '')

    if (items.length === 0) return null

    const style = textStyleFrom(props, ctx, 'body')
    const secondaryStyle = textStyleFrom(props, ctx, 'caption', 'secondary')
    const markerStyle = textStyleFrom(props, ctx, 'statLabel', 'marker')
    const markerKind = str(props.marker) || 'dot'
    const gap = ctx.style.space(props.gap as number | string, 12)

    const markerWidth =
      markerKind === 'none'
        ? 0
        : markerKind === 'number'
          ? Math.max(38, markerStyle.size * 2.2)
          : markerKind === 'bar'
            ? 26
            : 30

    const rows: ListRow[] = []
    let y = 0
    items.forEach((item, index) => {
      if (index > 0) y += gap
      const primary = layoutText(
        applyTransform(item.primary, style.transform),
        style,
        available.width - markerWidth,
        ctx.measurer,
        { maxLines: num(props.maxLines, 2) }
      )
      const secondary = item.secondary
        ? layoutText(
            applyTransform(item.secondary, secondaryStyle.transform),
            secondaryStyle,
            available.width - markerWidth,
            ctx.measurer,
            { maxLines: 1 }
          )
        : null
      const height = primary.height + (secondary ? secondary.height + 2 : 0)
      rows.push({
        marker: markerKind === 'number' ? `${index + 1}` : '',
        primary,
        secondary,
        y,
        height,
      })
      y += height
    })

    return {
      width: available.width,
      height: y,
      meta: {
        rows,
        style,
        secondaryStyle,
        markerStyle,
        markerWidth,
        markerKind,
        markerColor: ctx.style.color(str(props.markerColor) || 'accent'),
      } satisfies ListMeta,
    }
  },
  render(placed) {
    const meta = placed.meta as ListMeta
    const { rect } = placed
    const id = placed.node.id ?? 'list'

    return (
      <g key={id}>
        {meta.rows.map((row, index) => {
          const y = rect.y + row.y
          const textRect: Rect = {
            x: rect.x + meta.markerWidth,
            y,
            width: rect.width - meta.markerWidth,
            height: row.height,
          }
          const centre = y + meta.style.size * meta.style.lineHeight * 0.5

          return (
            <g key={index}>
              {meta.markerKind === 'number' ? (
                <text
                  x={rect.x}
                  y={y + firstBaseline(meta.style.size, meta.style.lineHeight)}
                  fontFamily={meta.markerStyle.fontFamily}
                  fontSize={meta.markerStyle.size}
                  fontWeight={meta.markerStyle.weight}
                  letterSpacing={meta.markerStyle.letterSpacing || undefined}
                  fill={meta.markerColor}
                >
                  {String(index + 1).padStart(2, '0')}
                </text>
              ) : null}
              {meta.markerKind === 'dot' ? (
                <circle cx={rect.x + 8} cy={centre} r={5} fill={meta.markerColor} />
              ) : null}
              {meta.markerKind === 'dash' ? (
                <line
                  x1={rect.x}
                  y1={centre}
                  x2={rect.x + 18}
                  y2={centre}
                  stroke={meta.markerColor}
                  strokeWidth={2}
                />
              ) : null}
              {meta.markerKind === 'bar' ? (
                <rect x={rect.x} y={y + 2} width={5} height={row.height - 4} fill={meta.markerColor} />
              ) : null}

              {drawText(row.primary, textRect, meta.style, `p${index}`)}
              {row.secondary
                ? drawText(
                    row.secondary,
                    { ...textRect, y: y + row.primary.height + 2 },
                    meta.secondaryStyle,
                    `s${index}`
                  )
                : null}
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── statGroup ────────────────────────────────────────────────────────────── */

interface StatMeta {
  cells: { value: TextLayout; label: TextLayout | null; rect: Rect }[]
  valueStyle: ResolvedTextStyle
  labelStyle: ResolvedTextStyle
  divider: boolean
  columnWidth: number
  height: number
}

const statGroupSpec: ComponentSpec = {
  label: 'Statistics',
  measure(props, ctx, available) {
    const items = list(props.source)
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>
        return { value: str(record.value), label: str(record.label) }
      })
      .filter((item) => item.value.trim() !== '')
      .slice(0, num(props.max, 4) ?? 4)

    if (items.length === 0) return null

    const columns = Math.min(items.length, Math.max(1, num(props.columns, 3) ?? 3))
    const gap = ctx.style.space(props.gap as number | string, 16)
    const columnWidth = (available.width - gap * (columns - 1)) / columns

    const valueStyle = textStyleFrom(props, ctx, 'stat', 'value')
    const labelStyle = textStyleFrom(props, ctx, 'statLabel', 'label')

    const cells = items.map((item, index) => {
      const value = layoutText(
        applyTransform(item.value, valueStyle.transform),
        valueStyle,
        columnWidth,
        ctx.measurer,
        { maxLines: 1, fit: true }
      )
      const label = item.label
        ? layoutText(
            applyTransform(item.label, labelStyle.transform),
            labelStyle,
            columnWidth,
            ctx.measurer,
            { maxLines: 2 }
          )
        : null
      return {
        value,
        label,
        rect: {
          x: (index % columns) * (columnWidth + gap),
          y: Math.floor(index / columns) * 0,
          width: columnWidth,
          height: 0,
        },
      }
    })

    const height =
      Math.max(...cells.map((cell) => cell.value.height + (cell.label ? cell.label.height + 8 : 0)))

    return {
      width: available.width,
      height,
      meta: {
        cells,
        valueStyle,
        labelStyle,
        divider: bool(props.divider) ?? false,
        columnWidth,
        height,
      } satisfies StatMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as StatMeta
    const { rect } = placed

    return (
      <g key={placed.node.id ?? 'stats'}>
        {meta.cells.map((cell, index) => {
          const x = rect.x + cell.rect.x
          return (
            <g key={index}>
              {meta.divider && index > 0 ? (
                <line
                  x1={x - 8}
                  y1={rect.y}
                  x2={x - 8}
                  y2={rect.y + meta.height}
                  stroke={ctx.style.color('border')}
                  strokeWidth={1}
                  opacity={0.5}
                />
              ) : null}
              {drawText(
                cell.value,
                { x, y: rect.y, width: cell.rect.width, height: cell.value.height },
                meta.valueStyle,
                `v${index}`
              )}
              {cell.label
                ? drawText(
                    cell.label,
                    {
                      x,
                      y: rect.y + cell.value.height + 8,
                      width: cell.rect.width,
                      height: cell.label.height,
                    },
                    meta.labelStyle,
                    `l${index}`
                  )
                : null}
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── timeline ─────────────────────────────────────────────────────────────── */

interface TimelineRow {
  year: TextLayout
  title: TextLayout
  note: TextLayout | null
  y: number
  height: number
}

interface TimelineMeta {
  rows: TimelineRow[]
  yearStyle: ResolvedTextStyle
  titleStyle: ResolvedTextStyle
  noteStyle: ResolvedTextStyle
  yearWidth: number
  marker: string
}

const timelineSpec: ComponentSpec = {
  label: 'Timeline',
  measure(props, ctx, available) {
    const items = list(props.source)
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>
        return { year: str(record.year), title: str(record.title), note: str(record.note) }
      })
      .filter((item) => item.title.trim() !== '')
      .slice(0, num(props.max, 5) ?? 5)

    if (items.length === 0) return null

    const yearStyle = textStyleFrom(props, ctx, 'year', 'year')
    const titleStyle = textStyleFrom(props, ctx, 'body', 'title')
    const noteStyle = textStyleFrom(props, ctx, 'caption', 'note')
    const gap = ctx.style.space(props.gap as number | string, 22)
    const yearWidth = num(props.yearWidth, 150) ?? 150
    const contentWidth = available.width - yearWidth

    const rows: TimelineRow[] = []
    let y = 0
    items.forEach((item, index) => {
      if (index > 0) y += gap
      const year = layoutText(
        applyTransform(item.year, yearStyle.transform),
        yearStyle,
        yearWidth - 20,
        ctx.measurer,
        { maxLines: 1 }
      )
      const title = layoutText(
        applyTransform(item.title, titleStyle.transform),
        titleStyle,
        contentWidth,
        ctx.measurer,
        { maxLines: 2 }
      )
      const note = item.note
        ? layoutText(
            applyTransform(item.note, noteStyle.transform),
            noteStyle,
            contentWidth,
            ctx.measurer,
            { maxLines: 2 }
          )
        : null
      const height = Math.max(year.height, title.height + (note ? note.height + 4 : 0))
      rows.push({ year, title, note, y, height })
      y += height
    })

    return {
      width: available.width,
      height: y,
      meta: {
        rows,
        yearStyle,
        titleStyle,
        noteStyle,
        yearWidth,
        marker: str(props.marker) || 'dot',
      } satisfies TimelineMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as TimelineMeta
    const { rect } = placed
    const markerX = rect.x + meta.yearWidth - 34
    const accent = ctx.style.color('accent')
    const border = ctx.style.color('border')
    const last = meta.rows[meta.rows.length - 1]

    return (
      <g key={placed.node.id ?? 'timeline'}>
        {meta.marker !== 'none' && meta.rows.length > 1 ? (
          <line
            x1={markerX}
            y1={rect.y + meta.titleStyle.size * 0.6}
            x2={markerX}
            y2={rect.y + last.y + meta.titleStyle.size * 0.6}
            stroke={border}
            strokeWidth={1.5}
          />
        ) : null}

        {meta.rows.map((row, index) => {
          const y = rect.y + row.y
          const markerY = y + meta.titleStyle.size * 0.6
          return (
            <g key={index}>
              {drawText(
                row.year,
                { x: rect.x, y, width: meta.yearWidth - 20, height: row.year.height },
                meta.yearStyle,
                `y${index}`
              )}

              {meta.marker === 'cross' ? (
                <g transform={`translate(${markerX} ${markerY})`}>
                  <circle r={7} fill={ctx.style.color('background')} stroke={accent} strokeWidth={1.5} />
                  <path d="M0 -11V11M-11 0H11" stroke={accent} strokeWidth={1} />
                </g>
              ) : null}
              {meta.marker === 'dot' ? (
                <circle cx={markerX} cy={markerY} r={6} fill={accent} />
              ) : null}
              {meta.marker === 'rule' ? (
                <line
                  x1={markerX - 12}
                  y1={markerY}
                  x2={markerX + 12}
                  y2={markerY}
                  stroke={accent}
                  strokeWidth={2}
                />
              ) : null}

              {drawText(
                row.title,
                {
                  x: rect.x + meta.yearWidth,
                  y,
                  width: rect.width - meta.yearWidth,
                  height: row.title.height,
                },
                meta.titleStyle,
                `t${index}`
              )}
              {row.note
                ? drawText(
                    row.note,
                    {
                      x: rect.x + meta.yearWidth,
                      y: y + row.title.height + 4,
                      width: rect.width - meta.yearWidth,
                      height: row.note.height,
                    },
                    meta.noteStyle,
                    `n${index}`
                  )
                : null}
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── socialLinks ──────────────────────────────────────────────────────────── */

const socialLinksSpec: ComponentSpec = {
  label: 'Social links',
  measure(props, ctx, available) {
    const items = list(props.source)
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>
        const handle = str(record.handle)
        const platform = str(record.platform)
        return handle ? (platform ? `${platform} ${handle}` : handle) : ''
      })
      .filter(Boolean)
      .slice(0, num(props.max, 4) ?? 4)

    if (items.length === 0) return null

    const style = textStyleFrom(props, ctx, 'handle')
    const stacked = str(props.layout) !== 'row'
    const gap = ctx.style.space(props.gap as number | string, 6)

    if (!stacked) {
      const layout = layoutText(
        applyTransform(items.join(str(props.separator) || '   ·   '), style.transform),
        style,
        available.width,
        ctx.measurer,
        { maxLines: 2 }
      )
      return { width: layout.width, height: layout.height, meta: { rows: [layout], style, gap } }
    }

    const rows = items.map((item) =>
      layoutText(applyTransform(item, style.transform), style, available.width, ctx.measurer, {
        maxLines: 1,
      })
    )
    return {
      width: available.width,
      height: rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1),
      meta: { rows, style, gap },
    }
  },
  render(placed) {
    const meta = placed.meta as { rows: TextLayout[]; style: ResolvedTextStyle; gap: number }
    const { rect } = placed
    let y = rect.y
    return (
      <g key={placed.node.id ?? 'socials'}>
        {meta.rows.map((row, index) => {
          const node = drawText(row, { ...rect, y, height: row.height }, meta.style, `s${index}`)
          y += row.height + meta.gap
          return node
        })}
      </g>
    )
  },
}

/* ── divider ──────────────────────────────────────────────────────────────── */

const dividerSpec: ComponentSpec = {
  label: 'Rule',
  measure(props, ctx, available) {
    const weight = num(props.weight, ctx.style.tokens.effects.rule ?? 1) ?? 1
    const width = resolveSize(props.width, available.width) ?? available.width
    return { width: Math.min(width, available.width), height: weight }
  },
  render(placed, ctx) {
    const { props, rect } = placed
    const weight = num(props.weight, ctx.style.tokens.effects.rule ?? 1) ?? 1
    const width = resolveSize(props.width, rect.width) ?? rect.width
    const dashed = bool(props.dashed)
    return (
      <line
        key={placed.node.id ?? 'rule'}
        x1={rect.x}
        y1={rect.y + weight / 2}
        x2={rect.x + Math.min(width, rect.width)}
        y2={rect.y + weight / 2}
        stroke={ctx.style.color(str(props.color) || 'border')}
        strokeWidth={weight}
        strokeDasharray={dashed ? `${weight * 4} ${weight * 3}` : undefined}
      />
    )
  },
}

/* ── mark ─────────────────────────────────────────────────────────────────── */

/**
 * The press marks from the app's own design language — a registration cross, a
 * crosshair, a trim corner, a strip of sprocket holes. They are the one
 * ornament vocabulary the cards share with the rest of Folio.
 */
const markSpec: ComponentSpec = {
  label: 'Press mark',
  measure(props) {
    const size = num(props.size, 28) ?? 28
    const kind = str(props.kind) || 'cross'
    return { width: kind === 'sprocket' ? size * 2.6 : size, height: size }
  },
  render(placed, ctx) {
    const { props, rect } = placed
    const size = num(props.size, 28) ?? 28
    const kind = str(props.kind) || 'cross'
    const color = ctx.style.color(str(props.color) || 'inkSoft')
    const opacity = num(props.opacity, 1)
    const cx = rect.x + size / 2
    const cy = rect.y + size / 2
    const r = size / 2

    const shape = () => {
      switch (kind) {
        case 'crosshair':
          return (
            <path
              d={`M${cx} ${cy - r}V${cy - r * 0.35}M${cx} ${cy + r * 0.35}V${cy + r}M${cx - r} ${cy}H${cx - r * 0.35}M${cx + r * 0.35} ${cy}H${cx + r}`}
              stroke={color}
              strokeWidth={size * 0.08}
              fill="none"
            />
          )
        case 'corner':
          return (
            <path
              d={`M${rect.x} ${rect.y + size}V${rect.y}H${rect.x + size}`}
              stroke={color}
              strokeWidth={size * 0.08}
              fill="none"
            />
          )
        case 'dot':
          return <circle cx={cx} cy={cy} r={r * 0.4} fill={color} />
        case 'sprocket':
          return (
            <g>
              {[0, 1, 2, 3, 4].map((index) => (
                <rect
                  key={index}
                  x={rect.x + index * size * 0.52}
                  y={cy - size * 0.18}
                  width={size * 0.32}
                  height={size * 0.36}
                  rx={size * 0.08}
                  fill={color}
                />
              ))}
            </g>
          )
        default:
          return (
            <g>
              <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke={color} strokeWidth={size * 0.07} />
              <path
                d={`M${cx} ${cy - r}V${cy + r}M${cx - r} ${cy}H${cx + r}`}
                stroke={color}
                strokeWidth={size * 0.055}
              />
            </g>
          )
      }
    }

    return (
      <g key={placed.node.id ?? 'mark'} opacity={opacity}>
        {shape()}
      </g>
    )
  },
}

/* ── shape ────────────────────────────────────────────────────────────────── */

const shapeSpec: ComponentSpec = {
  label: 'Shape',
  measure(props, ctx, available) {
    const width = resolveSize(props.width, available.width) ?? available.width
    const height = num(props.height, available.height ?? 80) ?? 80
    return { width, height }
  },
  render(placed, ctx) {
    const { props, rect } = placed
    const id = placed.node.id ?? 'shape'
    const fill = paint(props.fill as Fill | undefined, ctx, `shapefill_${id}`)
    const stroke = str(props.stroke) ? ctx.style.color(str(props.stroke)) : undefined
    const strokeWidth = num(props.strokeWidth, stroke ? 2 : 0)
    const kind = str(props.kind) || 'rect'

    return (
      <g key={id}>
        {fill.def ? <defs>{fill.def}</defs> : null}
        {kind === 'circle' || kind === 'ring' ? (
          <circle
            cx={rect.x + rect.width / 2}
            cy={rect.y + rect.height / 2}
            r={Math.min(rect.width, rect.height) / 2}
            fill={kind === 'ring' ? 'none' : fill.value}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ) : kind === 'line' ? (
          <line
            x1={rect.x}
            y1={rect.y + rect.height / 2}
            x2={rect.x + rect.width}
            y2={rect.y + rect.height / 2}
            stroke={stroke ?? fill.value}
            strokeWidth={strokeWidth || 2}
          />
        ) : (
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={ctx.style.radius(num(props.radius) ?? str(props.radius), 0)}
            fill={fill.value}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        )}
      </g>
    )
  },
}

/* ── badge ────────────────────────────────────────────────────────────────── */

const badgeSpec: ComponentSpec = {
  label: 'Badge',
  content: { prop: 'value', kind: 'text', label: 'Badge' },
  measure(props, ctx, available) {
    const style = textStyleFrom(props, ctx, 'label')
    const value = applyTransform(str(props.value), style.transform)
    if (!value) return null
    const padX = num(props.padX, 18) ?? 18
    const padY = num(props.padY, 10) ?? 10
    const layout = layoutText(value, style, available.width - padX * 2, ctx.measurer, { maxLines: 1 })
    return {
      width: Math.min(available.width, layout.width + padX * 2),
      height: layout.height + padY * 2,
      meta: { layout, style, padX, padY },
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as {
      layout: TextLayout
      style: ResolvedTextStyle
      padX: number
      padY: number
    }
    const { props, rect } = placed
    const solid = str(props.variant) !== 'outline'
    const background = ctx.style.color(str(props.bg) || 'accent')

    return (
      <g key={placed.node.id ?? 'badge'}>
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={ctx.style.radius(str(props.radius) || 'pill', 999)}
          fill={solid ? background : 'transparent'}
          stroke={solid ? undefined : background}
          strokeWidth={solid ? undefined : 1.5}
        />
        {drawText(
          meta.layout,
          {
            x: rect.x + meta.padX,
            y: rect.y + meta.padY,
            width: rect.width - meta.padX * 2,
            height: meta.layout.height,
          },
          {
            ...meta.style,
            color: solid ? ctx.style.color(str(props.color) || 'accentInk') : meta.style.color,
          },
          'badge'
        )}
      </g>
    )
  },
}

/* ── meter ────────────────────────────────────────────────────────────────── */

interface MeterMeta {
  rows: { label: TextLayout; value: number }[]
  labelStyle: ResolvedTextStyle
  barHeight: number
  gap: number
  rowHeight: number
}

const meterSpec: ComponentSpec = {
  label: 'Meters',
  measure(props, ctx, available) {
    const items = list(props.source)
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>
        return { label: str(record.label), value: Math.max(0, Math.min(100, num(record.value, 0) ?? 0)) }
      })
      .filter((item) => item.label.trim() !== '')
      .slice(0, num(props.max, 5) ?? 5)

    if (items.length === 0) return null

    const labelStyle = textStyleFrom(props, ctx, 'statLabel', 'label')
    const barHeight = num(props.height, 10) ?? 10
    const gap = ctx.style.space(props.gap as number | string, 18)

    const rows = items.map((item) => ({
      label: layoutText(
        applyTransform(item.label, labelStyle.transform),
        labelStyle,
        available.width,
        ctx.measurer,
        { maxLines: 1 }
      ),
      value: item.value,
    }))

    const rowHeight = rows[0].label.height + 8 + barHeight
    return {
      width: available.width,
      height: rows.length * rowHeight + (rows.length - 1) * gap,
      meta: { rows, labelStyle, barHeight, gap, rowHeight } satisfies MeterMeta,
    }
  },
  render(placed, ctx) {
    const meta = placed.meta as MeterMeta
    const { rect, props } = placed
    const track = ctx.style.color(str(props.track) || 'surfaceAlt')
    const fill = ctx.style.color(str(props.fillColor) || 'accent')
    const radius = meta.barHeight / 2

    return (
      <g key={placed.node.id ?? 'meters'}>
        {meta.rows.map((row, index) => {
          const y = rect.y + index * (meta.rowHeight + meta.gap)
          const barY = y + row.label.height + 8
          return (
            <g key={index}>
              {drawText(row.label, { ...rect, y, height: row.label.height }, meta.labelStyle, `m${index}`)}
              <rect
                x={rect.x}
                y={barY}
                width={rect.width}
                height={meta.barHeight}
                rx={radius}
                fill={track}
              />
              <rect
                x={rect.x}
                y={barY}
                width={(rect.width * row.value) / 100}
                height={meta.barHeight}
                rx={radius}
                fill={fill}
              />
            </g>
          )
        })}
      </g>
    )
  },
}

/* ── sticker ──────────────────────────────────────────────────────────────── */

const stickerSpec: ComponentSpec = {
  label: 'Sticker',
  content: { prop: 'value', kind: 'text', label: 'Sticker' },
  measure(props) {
    const value = str(props.value)
    if (!value) return null
    const size = num(props.size, 60) ?? 60
    return { width: size * 1.2, height: size * 1.2 }
  },
  render(placed, ctx) {
    const { props, rect } = placed
    const size = num(props.size, 60) ?? 60
    return (
      <text
        key={placed.node.id ?? 'sticker'}
        x={rect.x + rect.width / 2}
        y={rect.y + rect.height / 2 + size * 0.36}
        textAnchor="middle"
        fontSize={size}
        fill={ctx.style.color(str(props.color) || 'accent')}
        fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
      >
        {str(props.value)}
      </text>
    )
  },
}

/* ── The registry ─────────────────────────────────────────────────────────── */

export const COMPONENTS: Record<string, ComponentSpec> = {
  text: textSpec,
  image: imageSpec,
  photoGrid: photoGridSpec,
  photoStack: photoStackSpec,
  quote: quoteSpec,
  tagList: tagListSpec,
  list: listSpec,
  statGroup: statGroupSpec,
  timeline: timelineSpec,
  socialLinks: socialLinksSpec,
  divider: dividerSpec,
  mark: markSpec,
  shape: shapeSpec,
  badge: badgeSpec,
  meter: meterSpec,
  sticker: stickerSpec,
}

export const COMPONENT_TYPES = Object.keys(COMPONENTS)

export function renderComponent(placed: Placed, ctx: EngineContext): ReactNode {
  const spec = COMPONENTS[placed.node.type]
  if (!spec) return null
  return spec.render(placed, ctx)
}

export function isComponentNode(node: CardNode): boolean {
  return COMPONENTS[node.type] !== undefined
}
