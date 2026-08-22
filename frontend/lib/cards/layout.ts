import { COMPONENTS } from './registry'
import {
  type EngineContext,
  type Measured,
  type Placed,
  type Edges,
  NO_EDGES,
  resolveCoord,
  resolveSize,
  toEdges,
} from './context'
import type { CardNode, Rect, TemplateDefinition } from './types'

/**
 * The layout engine.
 *
 * Two passes, the way every layout system worth trusting does it: measure each
 * node against the width it has been offered, then arrange the measured tree
 * into absolute rectangles. Splitting them is what makes `flex`, `justify:
 * between` and vertical centring possible — none of which can be decided until
 * every sibling's size is known.
 *
 * Everything happens in canvas units (a 1080-wide card is 1080 units wide), so
 * the result scales to a 320px preview or a 2160px export with no relayout.
 */

const LAYOUT_TYPES = new Set(['stack', 'grid', 'absolute', 'overlay', 'spacer'])

function isLayout(node: CardNode): boolean {
  return LAYOUT_TYPES.has(node.type)
}

/** Text bindings resolve to raw values when the whole prop is one binding. */
function resolveProps(
  node: CardNode,
  ctx: EngineContext
): Record<string, unknown> {
  const source = node.props ?? {}
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      out[key] = ctx.resolver.value(value)
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        typeof item === 'string' ? ctx.resolver.value(item) : item
      )
    } else {
      out[key] = value
    }
  }

  // A user's own words win over the template's binding, but only on the prop
  // the component declared as its content — never on its layout props.
  const spec = COMPONENTS[node.type]
  if (node.id && spec?.content) {
    const override = ctx.customization.content?.[node.id]
    if (override !== undefined && override !== null) {
      const wantsLines = spec.content.kind === 'lines'
      if (wantsLines) {
        out[spec.content.prop] = Array.isArray(override)
          ? override
          : String(override)
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
      } else if (!Array.isArray(override)) {
        out[spec.content.prop] = override
      }
    }
  }

  if (node.id && spec?.imageProp) {
    const image = ctx.customization.images?.[node.id]
    if (image?.url) {
      out[spec.imageProp] = image.url
      out.__imageOffsetX = image.offsetX
      out.__imageOffsetY = image.offsetY
      out.__imageScale = image.scale
      if (image.treatment) out.treatment = image.treatment
    }
  }

  return out
}

function isVisible(node: CardNode, ctx: EngineContext): boolean {
  if (node.hidden) return false
  if (node.id && ctx.customization.visibility?.[node.id] === false) return false
  if (node.when && !ctx.resolver.test(node.when)) return false
  return true
}

function gapOf(node: CardNode, ctx: EngineContext): number {
  return ctx.style.space(node.gap, 0)
}

/* ── Measure ──────────────────────────────────────────────────────────────── */

function measureChildren(
  node: CardNode,
  ctx: EngineContext,
  width: number,
  height: number | undefined
): Measured[] {
  const children = node.children ?? []
  return children
    .map((child) => measureNode(child, ctx, width, height))
    .filter((child): child is Measured => child !== null)
}

/** How a child of a horizontal stack wants to be sized. */
function widthIntent(child: CardNode): 'fixed' | 'flex' | 'intrinsic' {
  if (typeof child.flex === 'number' && child.flex > 0) return 'flex'
  if (child.width === 'fill') return 'flex'
  if (child.width === undefined || child.width === 'auto') return 'intrinsic'
  return 'fixed'
}

function measureHorizontal(
  node: CardNode,
  ctx: EngineContext,
  contentWidth: number,
  contentHeight: number | undefined
): Measured[] {
  const children = (node.children ?? []).filter((child) => isVisible(child, ctx))
  if (children.length === 0) return []

  const gap = gapOf(node, ctx)
  const margins = children.map((child) => toEdges(child.margin))
  const widths = new Array<number>(children.length).fill(0)

  let used = gap * (children.length - 1) + margins.reduce((sum, m) => sum + m.left + m.right, 0)

  // Fixed first: they never move, whatever else is on the row.
  children.forEach((child, index) => {
    if (widthIntent(child) !== 'fixed') return
    const width = resolveSize(child.width, contentWidth) ?? 0
    widths[index] = width
    used += width
  })

  // Then intrinsic, each measured against what is genuinely left.
  children.forEach((child, index) => {
    if (widthIntent(child) !== 'intrinsic') return
    const available = Math.max(0, contentWidth - used)
    const measured = measureNode(child, ctx, available, contentHeight)
    widths[index] = measured?.width ?? 0
    used += widths[index]
  })

  // Whatever remains is shared between the flexible ones.
  const flexTotal = children.reduce((sum, child, index) => {
    if (widthIntent(child) !== 'flex') return sum
    return sum + (typeof child.flex === 'number' && child.flex > 0 ? child.flex : 1)
  }, 0)
  const remainder = Math.max(0, contentWidth - used)

  children.forEach((child, index) => {
    if (widthIntent(child) !== 'flex') return
    const share = typeof child.flex === 'number' && child.flex > 0 ? child.flex : 1
    widths[index] = flexTotal > 0 ? (remainder * share) / flexTotal : 0
  })

  return children
    .map((child, index) => measureNode(child, ctx, widths[index], contentHeight, widths[index]))
    .filter((child): child is Measured => child !== null)
}

export function measureNode(
  node: CardNode,
  ctx: EngineContext,
  availableWidth: number,
  availableHeight?: number,
  forcedWidth?: number,
  forcedHeight?: number
): Measured | null {
  if (!isVisible(node, ctx)) return null

  const padding = toEdges(node.padding)
  const explicitWidth =
    forcedWidth ?? (node.width === 'fill' ? availableWidth : resolveSize(node.width, availableWidth))
  const isAutoWidth = forcedWidth === undefined && (node.width === undefined || node.width === 'auto')

  // 'auto' still measures against everything on offer; it shrinks afterwards.
  const boxWidth = explicitWidth ?? availableWidth
  const contentWidth = Math.max(0, boxWidth - padding.left - padding.right)

  // A frame is a box, not a suggestion: `frame.height` fixes the node's height
  // so a stack inside one can justify against a known bottom edge.
  const explicitHeight =
    forcedHeight ??
    (node.height === 'fill'
      ? availableHeight ?? 0
      : resolveSize(node.height, availableHeight ?? 0))
  const contentHeightHint =
    explicitHeight !== null && explicitHeight !== undefined
      ? Math.max(0, explicitHeight - padding.top - padding.bottom)
      : availableHeight !== undefined
        ? Math.max(0, availableHeight - padding.top - padding.bottom)
        : undefined

  const props = resolveProps(node, ctx)

  let children: Measured[] = []
  let intrinsicWidth = contentWidth
  let intrinsicHeight = 0
  let meta: unknown

  if (!isLayout(node)) {
    const spec = COMPONENTS[node.type]
    if (!spec) return null
    const result = spec.measure(props, ctx, { width: contentWidth, height: contentHeightHint }, node)
    if (!result) return null
    intrinsicWidth = result.width
    intrinsicHeight = result.height
    meta = result.meta
  } else if (node.type === 'spacer') {
    intrinsicWidth = contentWidth
    intrinsicHeight = node.size === 'flex' || node.size === undefined ? 0 : Number(node.size) || 0
  } else if (node.type === 'stack' && node.direction === 'horizontal') {
    children = measureHorizontal(node, ctx, contentWidth, contentHeightHint)
    const gap = gapOf(node, ctx)
    intrinsicWidth = children.reduce((sum, child, index) => {
      const margin = toEdges(child.node.margin)
      return sum + child.width + margin.left + margin.right + (index > 0 ? gap : 0)
    }, 0)
    intrinsicHeight = children.reduce((max, child) => {
      const margin = toEdges(child.node.margin)
      return Math.max(max, child.height + margin.top + margin.bottom)
    }, 0)
  } else if (node.type === 'stack') {
    children = measureChildren(node, ctx, contentWidth, undefined)
    const gap = gapOf(node, ctx)
    intrinsicHeight = children.reduce((sum, child, index) => {
      const margin = toEdges(child.node.margin)
      return sum + child.height + margin.top + margin.bottom + (index > 0 ? gap : 0)
    }, 0)
    intrinsicWidth = children.reduce((max, child) => Math.max(max, child.width), 0)
  } else if (node.type === 'grid') {
    const columns = Math.max(1, node.columns ?? 1)
    const gap = gapOf(node, ctx)
    const rowGap = ctx.style.space(node.rowGap, gap)
    const columnWidth = Math.max(0, (contentWidth - gap * (columns - 1)) / columns)
    children = (node.children ?? [])
      .map((child) => measureNode(child, ctx, columnWidth, undefined, columnWidth))
      .filter((child): child is Measured => child !== null)

    let total = 0
    for (let index = 0; index < children.length; index += columns) {
      const rowHeight = children
        .slice(index, index + columns)
        .reduce((max, child) => Math.max(max, child.height), 0)
      total += rowHeight + (index > 0 ? rowGap : 0)
    }
    intrinsicWidth = contentWidth
    intrinsicHeight = total
  } else {
    // absolute / overlay: children are positioned, not stacked, so they cannot
    // grow the box. Their own frames decide where they land.
    const boxHeight = explicitHeight ?? availableHeight ?? 0
    const innerHeight = Math.max(0, boxHeight - padding.top - padding.bottom)
    children = (node.children ?? [])
      .map((child) => {
        const frame = child.frame
        const width =
          frame?.width !== undefined
            ? (resolveSize(frame.width, contentWidth) ?? contentWidth)
            : frame
              ? Math.max(0, contentWidth - resolveCoord(frame.x, contentWidth))
              : contentWidth
        const height =
          frame?.height !== undefined
            ? (resolveSize(frame.height, innerHeight) ?? undefined)
            : undefined
        return measureNode(child, ctx, width, height ?? innerHeight, width, height ?? undefined)
      })
      .filter((child): child is Measured => child !== null)
    intrinsicWidth = contentWidth
    intrinsicHeight = innerHeight
  }

  let width = isAutoWidth
    ? Math.min(boxWidth, intrinsicWidth + padding.left + padding.right)
    : boxWidth
  let height = explicitHeight ?? intrinsicHeight + padding.top + padding.bottom

  if (node.minHeight !== undefined) height = Math.max(height, node.minHeight)
  if (node.maxHeight !== undefined) height = Math.min(height, node.maxHeight)

  return { node, props, width: Math.max(0, width), height: Math.max(0, height), children, meta }
}

/* ── Arrange ──────────────────────────────────────────────────────────────── */

function crossOffset(
  alignment: string | undefined,
  outer: number,
  inner: number
): number {
  if (alignment === 'center') return (outer - inner) / 2
  if (alignment === 'end') return outer - inner
  return 0
}

/** A user's move/scale/rotate, applied last so it always wins over layout. */
function withTransform(node: CardNode, rect: Rect, ctx: EngineContext): Rect {
  const transform = node.id ? ctx.customization.transforms?.[node.id] : undefined
  if (!transform) return rect
  const scale = transform.scale ?? 1
  const width = rect.width * scale
  const height = rect.height * scale
  return {
    x: rect.x + (transform.dx ?? 0) - (width - rect.width) / 2,
    y: rect.y + (transform.dy ?? 0) - (height - rect.height) / 2,
    width,
    height,
  }
}

function isFlexible(measured: Measured): boolean {
  const { node } = measured
  if (node.type === 'spacer') return node.size === 'flex' || node.size === undefined
  return typeof node.flex === 'number' && node.flex > 0
}

export function arrangeNode(measured: Measured, rect: Rect, ctx: EngineContext): Placed {
  const { node, children } = measured
  const box = withTransform(node, rect, ctx)
  const padding = toEdges(node.padding)
  const content: Rect = {
    x: box.x + padding.left,
    y: box.y + padding.top,
    width: Math.max(0, box.width - padding.left - padding.right),
    height: Math.max(0, box.height - padding.top - padding.bottom),
  }

  let placed: Placed[] = []

  if (node.type === 'stack' && node.direction === 'horizontal') {
    placed = arrangeAxis(children, content, ctx, node, 'horizontal')
  } else if (node.type === 'stack') {
    placed = arrangeAxis(children, content, ctx, node, 'vertical')
  } else if (node.type === 'grid') {
    placed = arrangeGrid(children, content, ctx, node)
  } else if (node.type === 'absolute' || node.type === 'overlay') {
    placed = children.map((child) => {
      const frame = child.node.frame
      const x = frame ? content.x + resolveCoord(frame.x, content.width) : content.x
      const y = frame ? content.y + resolveCoord(frame.y, content.height) : content.y
      return arrangeNode(child, { x, y, width: child.width, height: child.height }, ctx)
    })
  }

  return { node, props: measured.props, rect: box, children: placed, meta: measured.meta }
}

function arrangeAxis(
  children: Measured[],
  content: Rect,
  ctx: EngineContext,
  node: CardNode,
  axis: 'vertical' | 'horizontal'
): Placed[] {
  if (children.length === 0) return []

  const gap = gapOf(node, ctx)
  const margins = children.map((child) => toEdges(child.node.margin))

  const mainSize = (child: Measured, margin: Edges) =>
    axis === 'vertical' ? child.height + margin.top + margin.bottom : child.width + margin.left + margin.right

  const totalMain =
    children.reduce((sum, child, index) => sum + mainSize(child, margins[index]), 0) +
    gap * (children.length - 1)

  const available = axis === 'vertical' ? content.height : content.width
  let leftover = available - totalMain

  // Flexible children absorb the slack first; that is what a spacer is for.
  const flexible = children.filter(isFlexible)
  const grow = new Map<Measured, number>()
  if (leftover > 0 && flexible.length > 0) {
    const totalShare = flexible.reduce(
      (sum, child) => sum + (typeof child.node.flex === 'number' && child.node.flex > 0 ? child.node.flex : 1),
      0
    )
    for (const child of flexible) {
      const share = typeof child.node.flex === 'number' && child.node.flex > 0 ? child.node.flex : 1
      grow.set(child, (leftover * share) / totalShare)
    }
    leftover = 0
  }

  let cursor = axis === 'vertical' ? content.y : content.x
  let extraGap = 0

  if (leftover > 0) {
    if (node.justify === 'center') cursor += leftover / 2
    else if (node.justify === 'end') cursor += leftover
    else if (node.justify === 'between' && children.length > 1) {
      extraGap = leftover / (children.length - 1)
    }
  }

  return children.map((child, index) => {
    const margin = margins[index]
    if (index > 0) cursor += gap + extraGap

    const growth = grow.get(child) ?? 0
    const alignment = child.node.align ?? node.items ?? (axis === 'vertical' ? 'stretch' : 'start')

    if (axis === 'vertical') {
      const height = child.height + growth
      const width =
        alignment === 'stretch' && child.node.width === undefined ? content.width : child.width
      const x = content.x + margin.left + crossOffset(alignment, content.width - margin.left - margin.right, width)
      const y = cursor + margin.top
      cursor += height + margin.top + margin.bottom
      return arrangeNode(child, { x, y, width, height }, ctx)
    }

    const width = child.width + growth
    const height =
      alignment === 'stretch' && child.node.height === undefined ? content.height : child.height
    const x = cursor + margin.left
    const y = content.y + margin.top + crossOffset(alignment, content.height - margin.top - margin.bottom, height)
    cursor += width + margin.left + margin.right
    return arrangeNode(child, { x, y, width, height }, ctx)
  })
}

function arrangeGrid(
  children: Measured[],
  content: Rect,
  ctx: EngineContext,
  node: CardNode
): Placed[] {
  const columns = Math.max(1, node.columns ?? 1)
  const gap = gapOf(node, ctx)
  const rowGap = ctx.style.space(node.rowGap, gap)
  const columnWidth = Math.max(0, (content.width - gap * (columns - 1)) / columns)

  const placed: Placed[] = []
  let y = content.y

  for (let start = 0; start < children.length; start += columns) {
    const rowChildren = children.slice(start, start + columns)
    const rowHeight = rowChildren.reduce((max, child) => Math.max(max, child.height), 0)

    rowChildren.forEach((child, column) => {
      placed.push(
        arrangeNode(
          child,
          {
            x: content.x + column * (columnWidth + gap),
            y,
            width: columnWidth,
            height: child.height,
          },
          ctx
        )
      )
    })

    y += rowHeight + rowGap
  }

  return placed
}

/* ── Entry point ──────────────────────────────────────────────────────────── */

export interface CardLayout {
  width: number
  height: number
  root: Placed | null
  padding: Edges
}

export function buildCardLayout(definition: TemplateDefinition, ctx: EngineContext): CardLayout {
  const width = definition.canvas.width
  const height = definition.canvas.height
  const padding = definition.canvas.padding ? toEdges(definition.canvas.padding) : NO_EDGES

  const contentWidth = Math.max(0, width - padding.left - padding.right)
  const contentHeight = Math.max(0, height - padding.top - padding.bottom)

  const measured = measureNode(definition.root, ctx, contentWidth, contentHeight, contentWidth)
  if (!measured) return { width, height, root: null, padding }

  const root = arrangeNode(
    measured,
    {
      x: padding.left,
      y: padding.top,
      width: contentWidth,
      height: Math.max(measured.height, contentHeight),
    },
    ctx
  )

  return { width, height, root, padding }
}

/**
 * Every node a user may edit, in document order.
 *
 * The editor builds its Content panel from this rather than from a hand-written
 * list, so a template that adds a field gets an editor control for it with no
 * frontend change — the same promise the renderer makes.
 */
export interface EditableField {
  id: string
  label: string
  kind: 'text' | 'lines' | 'image'
  componentType: string
  /** The template's own value, shown as the placeholder. */
  placeholder: string
  canHide: boolean
}

export function collectEditableFields(
  definition: TemplateDefinition,
  resolver: Pick<EngineContext['resolver'], 'value'>
): EditableField[] {
  const fields: EditableField[] = []
  const caps = definition.capabilities

  const walk = (node: CardNode) => {
    const spec = COMPONENTS[node.type]
    if (node.id && spec) {
      const editable = node.editable ?? {}
      if (spec.content && caps.customText && editable.content !== false) {
        const resolved = resolver.value((node.props ?? {})[spec.content.prop])
        fields.push({
          id: node.id,
          label: node.label ?? spec.content.label,
          kind: spec.content.kind,
          componentType: node.type,
          placeholder: Array.isArray(resolved)
            ? resolved.map(String).join(', ')
            : String(resolved ?? ''),
          canHide: caps.sectionVisibility && editable.visibility !== false,
        })
      } else if (spec.imageProp && caps.photoReplacement && editable.image !== false) {
        fields.push({
          id: node.id,
          label: node.label ?? spec.label,
          kind: 'image',
          componentType: node.type,
          placeholder: '',
          canHide: caps.sectionVisibility && editable.visibility !== false,
        })
      } else if (caps.sectionVisibility && editable.visibility !== false && node.label) {
        fields.push({
          id: node.id,
          label: node.label,
          kind: 'text',
          componentType: node.type,
          placeholder: '',
          canHide: true,
        })
      }
    }
    for (const child of node.children ?? []) walk(child)
  }

  walk(definition.root)
  return fields
}
