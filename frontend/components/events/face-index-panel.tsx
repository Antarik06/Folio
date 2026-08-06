'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanFace, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { detectFaces } from '@/lib/face-recognition'

interface FaceIndexPanelProps {
  eventId: string
}

interface FaceStats {
  total_photos: number
  pending_photos: number
  indexed_photos: number
  total_faces: number
  enrolled_guests: number
  total_matches: number
}

interface QueuePhoto {
  id: string
  blob_url: string
  thumbnail_url: string | null
  original_filename: string | null
}

/** Photos pulled per round-trip. Small enough to keep progress moving visibly. */
const BATCH_SIZE = 12

/**
 * Host-side backfill for the face index.
 *
 * Photos uploaded through the uploader are indexed inline, but anything that
 * arrived another way — a Google Drive import that failed mid-scan, photos
 * added before the engine existed — stays `pending`. This drains that backlog,
 * running detection in the browser exactly like the uploader does.
 */
export function FaceIndexPanel({ eventId }: FaceIndexPanelProps) {
  const [stats, setStats] = useState<FaceStats | null>(null)
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [failed, setFailed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentName, setCurrentName] = useState<string | null>(null)

  // Lets the Stop button interrupt the loop between photos.
  const cancelRef = useRef(false)

  const loadStats = useCallback(async () => {
    try {
      const next = await apiClient.get(`/api/events/${eventId}/face-stats`)
      setStats(next)
    } catch (err: any) {
      setError(err.message || 'Could not load indexing status.')
    }
  }, [eventId])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    // Stop the loop if the host navigates away mid-run.
    return () => {
      cancelRef.current = true
    }
  }, [])

  async function indexOne(photo: QueuePhoto): Promise<boolean> {
    // Detection needs the full-resolution original: a 640px thumbnail loses the
    // smaller faces in a group shot, which is exactly what this is for.
    const response = await fetch(photo.blob_url, { mode: 'cors' })
    if (!response.ok) throw new Error(`Could not download image (${response.status})`)
    const blob = await response.blob()

    const faces = await detectFaces(blob)
    await apiClient.post(`/api/photos/${photo.id}/faces`, {
      faces: faces.map((face) => ({
        descriptor: face.descriptor,
        box: face.box,
        score: face.score,
      })),
    })
    return true
  }

  async function runIndexer() {
    cancelRef.current = false
    setRunning(true)
    setError(null)
    setProcessed(0)
    setFailed(0)

    try {
      // Keep pulling batches: each indexed photo leaves the pending queue, so
      // the next request returns the next slice rather than the same one.
      while (!cancelRef.current) {
        const batch = await apiClient.get(
          `/api/events/${eventId}/face-scan-queue?limit=${BATCH_SIZE}`
        )
        const photos: QueuePhoto[] = batch?.photos || []
        if (photos.length === 0) break

        for (const photo of photos) {
          if (cancelRef.current) break
          setCurrentName(photo.original_filename || 'photo')

          try {
            await indexOne(photo)
            setProcessed((n) => n + 1)
          } catch (err) {
            console.warn(`Face indexing failed for ${photo.id}:`, err)
            setFailed((n) => n + 1)
            // Mark it so the queue does not hand back the same unreadable photo
            // forever; without this the loop would never terminate.
            await apiClient
              .post(`/api/photos/${photo.id}/faces/failed`, { reason: 'failed' })
              .catch(() => undefined)
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Indexing stopped unexpectedly.')
    } finally {
      setCurrentName(null)
      setRunning(false)
      void loadStats()
    }
  }

  const pending = stats?.pending_photos ?? 0
  const total = stats?.total_photos ?? 0
  const indexed = stats?.indexed_photos ?? 0
  const percent = total > 0 ? Math.round((indexed / total) * 100) : 0

  return (
    <div className="border border-border rounded-xl bg-card/60 p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ScanFace className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-foreground">Face Matching Index</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Guests who enrolled a selfie automatically see the photos they appear in. New uploads are
            indexed as they arrive — run this to catch up anything imported another way.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Photos indexed', value: `${indexed}/${total}` },
          { label: 'Faces found', value: stats?.total_faces ?? 0 },
          { label: 'Guests enrolled', value: stats?.enrolled_guests ?? 0 },
          { label: 'Photo matches', value: stats?.total_matches ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="p-3 bg-background/60 border border-border/60 rounded-lg">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-mono text-lg text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Index coverage</span>
          <span className="text-[10px] font-mono text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {running && (
        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
          <span className="truncate">
            Scanning {currentName ? `“${currentName}”` : 'photos'} · {processed} done
            {failed > 0 ? ` · ${failed} skipped` : ''}
          </span>
        </div>
      )}

      {!running && processed + failed > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Indexed {processed} {processed === 1 ? 'photo' : 'photos'}
          {failed > 0 ? `, skipped ${failed} that could not be read` : ''}.
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <button
            onClick={() => {
              cancelRef.current = true
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-background hover:bg-surface rounded-lg text-xs font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={runIndexer}
            disabled={pending === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ScanFace className="w-4 h-4" />
            {pending === 0 ? 'All photos indexed' : `Index ${pending} remaining ${pending === 1 ? 'photo' : 'photos'}`}
          </button>
        )}

        {stats !== null && stats.enrolled_guests === 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            No guests have enrolled a selfie yet
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        Indexing runs in this browser tab and downloads each photo once, so keep this page open until
        it finishes. Face data never leaves your event.
      </p>
    </div>
  )
}
