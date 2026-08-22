import type { ReactNode } from 'react'
import type { ResolvedStyle } from './style'
import type { Measurer } from './text'
import type { Resolver } from './resolver'
import type { CardCustomization, CardNode, Capabilities, Rect } from './types'

/**
 * The contract between the layout engine and the components it lays out.
 *
 * A component is two functions and a little metadata. `measure` answers "how
 * much room do you need in this much width", `render` draws into the box the
 * engine gave it. Neither ever positions itself, which is what keeps the
 * layout engine the only thing that knows about geometry.
 */

export interface EngineContext {
  style: ResolvedStyle
  resolver: Resolver
  measurer: Measurer
  customization: CardCustomization
  capabilities: Capabilities
  /** Canvas dimensions, for components that size against the whole card. */
  canvas: { width: number; height: number }
}

export interface MeasureResult {
  width: number
  height: number
  /** Work done during measuring that render should not repeat — wrapped lines. */
  meta?: unknown
}

export interface Measured {
  node: CardNode
  props: Record<string, unknown>
  width: number
  height: number
  children: Measured[]
  meta?: unknown
}

export interface Placed {
  node: CardNode
  props: Record<string, unknown>
  rect: Rect
  children: Placed[]
  meta?: unknown
}

export interface ComponentSpec {
  /** Human name, shown in the admin template editor. */
  label: string
  /**
   * Returns null when the component has nothing to draw — an empty quote, a
   * photo grid with no photos. The engine drops those nodes entirely so the
   * stack above does not leave a gap where they would have been.
   */
  measure(
    props: Record<string, unknown>,
    ctx: EngineContext,
    available: { width: number; height?: number },
    node: CardNode
  ): MeasureResult | null
  render(placed: Placed, ctx: EngineContext): ReactNode
  /**
   * Which prop a user's text edit replaces, and whether that edit is one string
   * or a list of them. Absent means the component carries no editable words.
   */
  content?: { prop: string; kind: 'text' | 'lines'; label: string }
  /** Which prop holds a replaceable image. */
  imageProp?: string
}

/* ── Geometry helpers shared by the engine and its components ─────────────── */

export interface Edges {
  top: number
  right: number
  bottom: number
  left: number
}

export const NO_EDGES: Edges = { top: 0, right: 0, bottom: 0, left: 0 }

export function toEdges(value: unknown): Edges {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value }
  }
  if (value && typeof value === 'object') {
    const e = value as Partial<Edges>
    return {
      top: e.top ?? 0,
      right: e.right ?? 0,
      bottom: e.bottom ?? 0,
      left: e.left ?? 0,
    }
  }
  return NO_EDGES
}

/**
 * Resolves a size against the space available. `fill` and `auto` are the
 * engine's business and return null so the caller can decide.
 */
export function resolveSize(value: unknown, available: number): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (value.endsWith('%')) {
      const pct = Number.parseFloat(value)
      return Number.isFinite(pct) ? (available * pct) / 100 : null
    }
  }
  return null
}

export function resolveCoord(value: unknown, available: number): number {
  return resolveSize(value, available) ?? 0
}

export function clampRect(rect: Rect): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  }
}
