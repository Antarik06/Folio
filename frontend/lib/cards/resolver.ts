import type { CardProfileData } from './types'

/**
 * The data resolver.
 *
 * Templates reference profile data as `{{profile.name}}`. This file is the only
 * thing that turns those strings into values, and it is deliberately not an
 * expression language: there is no `eval`, no `Function`, no operators, no
 * property access that is not a plain identifier or an array index. A template
 * is a document, so the worst a malicious one can do is read a field of the
 * profile it was already being rendered against.
 *
 *     {{profile.name}}
 *     {{profile.photos[0].url}}
 *     {{profile.interests | take:3 | join: · }}
 *     {{profile.username | prefix:@}}
 *     {{profile.name | default:Your name | upper}}
 */

/** Keys that must never be traversed, whatever a template asks for. */
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor'])

const SEGMENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export interface ResolverScope {
  profile: CardProfileData
  now: { year: string; month: string; day: string; date: string }
}

export function createScope(profile: CardProfileData, at = new Date()): ResolverScope {
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    profile,
    now: {
      year: String(at.getFullYear()),
      month: pad(at.getMonth() + 1),
      day: pad(at.getDate()),
      date: `${pad(at.getDate())} · ${pad(at.getMonth() + 1)} · ${at.getFullYear()}`,
    },
  }
}

/**
 * Walks a dotted path with optional array indices. Returns undefined for
 * anything missing rather than throwing — a half-filled profile is the normal
 * case, not an error.
 */
function readPath(scope: ResolverScope, path: string): unknown {
  let current: unknown = scope

  for (const rawSegment of path.split('.')) {
    const match = rawSegment.match(/^([a-zA-Z_][a-zA-Z0-9_]*)((?:\[\d+\])*)$/)
    if (!match) return undefined

    const [, key, indices] = match
    if (FORBIDDEN.has(key) || !SEGMENT.test(key)) return undefined
    if (current === null || typeof current !== 'object') return undefined

    current = (current as Record<string, unknown>)[key]

    if (indices) {
      for (const index of indices.matchAll(/\[(\d+)\]/g)) {
        if (!Array.isArray(current)) return undefined
        current = current[Number(index[1])]
      }
    }
  }

  return current
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value)
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

type Filter = (value: unknown, arg: string) => unknown

const FILTERS: Record<string, Filter> = {
  /** Falls back to a literal when the value is missing or blank. */
  default: (value, arg) => (isEmpty(value) ? arg : value),
  upper: (value) => toText(value).toUpperCase(),
  lower: (value) => toText(value).toLowerCase(),
  title: (value) =>
    toText(value).replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  /** Prepends a marker, but only when there is something to mark. */
  prefix: (value, arg) => (isEmpty(value) ? '' : `${arg}${toText(value)}`),
  suffix: (value, arg) => (isEmpty(value) ? '' : `${toText(value)}${arg}`),
  take: (value, arg) => (Array.isArray(value) ? value.slice(0, Number(arg) || 0) : value),
  join: (value, arg) =>
    Array.isArray(value) ? value.map(toText).filter(Boolean).join(arg || ', ') : toText(value),
  count: (value) => (Array.isArray(value) ? String(value.length) : isEmpty(value) ? '0' : '1'),
  first: (value) => (Array.isArray(value) ? value[0] : value),
  truncate: (value, arg) => {
    const text = toText(value)
    const limit = Number(arg) || 60
    return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
  },
  initials: (value) =>
    toText(value)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? '')
      .join('')
      .toUpperCase(),
  year: (value) => {
    const date = new Date(toText(value))
    return Number.isNaN(date.getTime()) ? toText(value) : String(date.getFullYear())
  },
}

/**
 * Splits `path | filter:arg | filter`.
 *
 * The argument is taken verbatim, spaces and all: a separator is very often
 * exactly the spaces around it, and `join: · ` losing its padding would silently
 * set every list on every card too tight.
 */
function parseExpression(source: string): { path: string; filters: { name: string; arg: string }[] } {
  const [pathPart, ...filterParts] = source.split('|')
  return {
    path: pathPart.trim(),
    filters: filterParts.map((part) => {
      const colon = part.indexOf(':')
      return colon === -1
        ? { name: part.trim(), arg: '' }
        : { name: part.slice(0, colon).trim(), arg: part.slice(colon + 1) }
    }),
  }
}

function evaluate(scope: ResolverScope, source: string): unknown {
  const { path, filters } = parseExpression(source)
  let value = path ? readPath(scope, path) : undefined

  for (const filter of filters) {
    const fn = FILTERS[filter.name]
    // An unknown filter is a template authoring mistake, not a reason to blank
    // the field — pass the value through untouched.
    if (fn) value = fn(value, filter.arg)
  }

  return value
}

// Lazy up to the first `}}`, so a binding carrying stray braces still parses —
// and then resolves to nothing — rather than passing through as visible text.
const BINDING = /\{\{([\s\S]*?)\}\}/g
const WHOLE_BINDING = /^\s*\{\{([\s\S]*?)\}\}\s*$/

export interface Resolver {
  /** Interpolates every binding in a string. Always returns a string. */
  text(input: unknown): string
  /**
   * Returns the raw value when the input is exactly one binding — the only way
   * a component can receive an array or an object rather than its text form.
   */
  value(input: unknown): unknown
  /** Truthiness of a `when` expression: non-empty string, non-empty array, true. */
  test(expression: unknown): boolean
  scope: ResolverScope
}

export function createResolver(profile: CardProfileData, at?: Date): Resolver {
  const scope = createScope(profile, at)

  const value = (input: unknown): unknown => {
    if (typeof input !== 'string') return input
    const whole = input.match(WHOLE_BINDING)
    if (whole) return evaluate(scope, whole[1])
    return text(input)
  }

  const text = (input: unknown): string => {
    if (typeof input !== 'string') return toText(input)
    if (!input.includes('{{')) return input
    return input.replace(BINDING, (_match, source) => toText(evaluate(scope, source)))
  }

  return {
    text,
    value,
    test(expression) {
      if (typeof expression !== 'string' || expression.trim() === '') return true
      const source = expression.match(WHOLE_BINDING)?.[1] ?? expression
      return !isEmpty(evaluate(scope, source))
    },
    scope,
  }
}

export { isEmpty as isEmptyValue, toText as valueToText }
