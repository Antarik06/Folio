'use client'

import { useEffect, useState } from 'react'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * A date the server and the browser will always agree on.
 *
 * `toLocaleDateString` renders in the *server's* locale during SSR and the
 * *viewer's* on the client — "6 Jun 2026" against "Jun 6, 2026" — which React
 * reports as a hydration mismatch and repaints the whole subtree over. Reading
 * the parts in UTC and writing them out by hand removes both variables.
 */
export function absoluteDate(value?: string | null, withYear = true): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const day = date.getUTCDate()
  const month = MONTHS[date.getUTCMonth()]
  return withYear ? `${day} ${month} ${date.getUTCFullYear()}` : `${day} ${month}`
}

/** "2h ago", "3d ago" — needs `Date.now()`, so it is browser-only. */
function relativeDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return null
}

/**
 * The absolute date on the server and on the first paint, upgraded to "2h ago"
 * once mounted. Both renders agree, so hydration stays quiet, and the reader
 * still gets the friendlier form a frame later.
 */
export function useTimeAgo(value?: string | null, fallback = 'Undated'): string {
  const absolute = absoluteDate(value) ?? fallback
  const [label, setLabel] = useState(absolute)

  useEffect(() => {
    if (!value) {
      setLabel(fallback)
      return
    }
    setLabel(relativeDate(value) ?? absoluteDate(value) ?? fallback)
  }, [value, fallback])

  return label
}
