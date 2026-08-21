/**
 * Capture-time clustering.
 *
 * The Photos tab distinguishes Library from an Event entirely through grid
 * rhythm and metadata density — no "shared" badge, no icon. The rhythm comes
 * from here: an Event's frames break into loose clusters around the moments
 * they were actually shot, each stamped with its own timestamp, while the
 * Library stays one unbroken sheet.
 */

export interface ClusterablePhoto {
  id: string
  url: string
  taken_at?: string | null
  created_at?: string | null
  width?: number | null
  height?: number | null
  uploader_id?: string
}

export interface PhotoCluster {
  /** Stamp shown above the row, e.g. "CLUSTER — 8:12PM". */
  label: string
  /** ISO time the cluster starts at, for a stable React key. */
  startedAt: string
  photos: ClusterablePhoto[]
}

/** Gap that starts a new cluster. 45 minutes reads as "a different moment". */
const CLUSTER_GAP_MS = 45 * 60 * 1000

function timeOf(photo: ClusterablePhoto): number {
  const raw = photo.taken_at ?? photo.created_at
  const t = raw ? Date.parse(raw) : NaN
  return Number.isNaN(t) ? 0 : t
}

function stamp(ms: number): string {
  if (!ms) return 'UNDATED'
  return new Date(ms)
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\s/g, '')
    .toUpperCase()
}

/**
 * Groups photos into capture-time clusters, newest first.
 *
 * `maxClusters` caps how many the caller renders — the Photos tab shows two
 * per event, enough to establish the rhythm without turning the tab into the
 * event page.
 */
export function clusterByCaptureTime(
  photos: ClusterablePhoto[],
  { maxClusters = 2, maxPerCluster = 8 }: { maxClusters?: number; maxPerCluster?: number } = {}
): PhotoCluster[] {
  if (photos.length === 0) return []

  const sorted = [...photos].sort((a, b) => timeOf(b) - timeOf(a))

  const clusters: ClusterablePhoto[][] = []
  let current: ClusterablePhoto[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const gap = timeOf(current[current.length - 1]) - timeOf(sorted[i])
    if (gap > CLUSTER_GAP_MS) {
      clusters.push(current)
      current = [sorted[i]]
    } else {
      current.push(sorted[i])
    }
  }
  clusters.push(current)

  return clusters.slice(0, maxClusters).map((group) => {
    const startMs = timeOf(group[0])
    return {
      label: `Cluster — ${stamp(startMs)}`,
      startedAt: startMs ? new Date(startMs).toISOString() : `undated-${group[0].id}`,
      photos: group.slice(0, maxPerCluster),
    }
  })
}

/** "14 NOV 2025" — the mono date voice used across every metadata line. */
export function monoDate(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

/** Thousands-separated counts, so "1,204 PHOTOS" reads as a catalogue figure. */
export function monoCount(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Joins metadata segments with the middot separator the design uses
 * throughout, dropping anything missing rather than leaving an empty slot.
 */
export function monoMeta(...parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ')
}
