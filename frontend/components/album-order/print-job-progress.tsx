'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Download, Printer } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface PrintJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress_stage: string
  progress_current: number
  progress_total: number
  progress_message: string | null
  error_message: string | null
  output_pdf_path: string | null
  percent: number
}

interface PrintJobProgressProps {
  orderId: string
  /** Admins get a download link to the finished print-ready PDF. */
  showDownload?: boolean
  /** Table-cell rendering: one line, no card chrome. */
  compact?: boolean
}

/** How often to re-poll while the job is still moving. */
const POLL_INTERVAL_MS = 2000

const STAGE_LABELS: Record<string, string> = {
  queued: 'Waiting in the print queue',
  preparing: 'Loading album layout',
  rendering: 'Rendering pages at 300 DPI',
  compiling: 'Compiling print-ready PDF/X-4',
  uploading: 'Uploading the finished file',
  completed: 'Print-ready PDF is available',
  failed: 'Export failed',
}

/**
 * Live progress for the server-side print PDF export.
 *
 * The pipeline takes 10-20s for a typical album and considerably longer for a
 * large one; before this it reported nothing between "queued" and "done".
 */
export function PrintJobProgress({ orderId, showDownload = false, compact = false }: PrintJobProgressProps) {
  const [job, setJob] = useState<PrintJob | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const poll = useCallback(async () => {
    try {
      const result = await apiClient.get(`/api/orders/${orderId}/print-job`)
      if (cancelledRef.current) return
      setJob(result?.job ?? null)
      setError(null)

      const status = result?.job?.status
      // Stop polling once the job reaches a terminal state, and never start if
      // nothing has been queued yet — an order awaiting artist review would
      // otherwise poll forever.
      if (result?.job && status !== 'completed' && status !== 'failed') {
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    } catch (err: any) {
      if (cancelledRef.current) return
      setError(err.message || 'Could not load print status.')
    } finally {
      if (!cancelledRef.current) setLoaded(true)
    }
  }, [orderId])

  useEffect(() => {
    cancelledRef.current = false
    void poll()
    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [poll])

  // Nothing queued yet, or the status endpoint is unreachable — stay silent
  // rather than showing a broken widget on every order card.
  if (!loaded || (!job && !error)) {
    return compact ? <span className="text-[10px] font-mono text-muted-foreground">—</span> : null
  }

  if (error) {
    if (compact) return <span className="text-[10px] font-mono text-muted-foreground">—</span>
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {error}
      </div>
    )
  }

  if (!job) {
    return compact ? <span className="text-[10px] font-mono text-muted-foreground">Not queued</span> : null
  }

  const isDone = job.status === 'completed'
  const isFailed = job.status === 'failed'
  const label = job.progress_message || STAGE_LABELS[job.progress_stage] || 'Preparing export'
  const percent = isFailed ? 100 : job.percent

  if (compact) {
    return (
      <div className="w-40 space-y-1">
        <div className="flex items-center gap-2">
          {isDone ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
          ) : isFailed ? (
            <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />
          ) : (
            <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
            {isFailed ? 'Failed' : isDone ? 'Ready' : job.progress_stage}
          </span>
          {!isFailed && !isDone && (
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">{percent}%</span>
          )}
        </div>

        {!isDone && !isFailed && (
          <>
            <div className="h-1 bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            {job.progress_total > 0 && (
              <p className="text-[9px] font-mono text-muted-foreground">
                {job.progress_current}/{job.progress_total} pages
              </p>
            )}
          </>
        )}

        {isDone && job.output_pdf_path && (
          <a
            href={job.output_pdf_path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
          >
            <Download className="w-3 h-3" />
            Print PDF
          </a>
        )}

        {isFailed && job.error_message && (
          <p className="text-[9px] font-mono text-rose-400 truncate" title={job.error_message}>
            {job.error_message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="border border-border bg-background/60 p-5 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : isFailed ? (
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
        ) : (
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
            Print Export
          </p>
          <p className="text-sm text-foreground truncate">
            {isFailed ? job.error_message || 'Export failed' : label}
          </p>
        </div>
        {!isFailed && (
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{percent}%</span>
        )}
      </div>

      <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFailed ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Page counter — the specific feedback the pipeline was missing. */}
      {!isDone && !isFailed && job.progress_total > 0 && (
        <p className="text-[11px] text-muted-foreground mt-2 font-mono">
          {job.progress_current} / {job.progress_total} pages
        </p>
      )}

      {showDownload && isDone && job.output_pdf_path && (
        <a
          href={job.output_pdf_path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download print-ready PDF
        </a>
      )}

      {job.status === 'queued' && (
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
          <Printer className="w-3 h-3" />
          Your book is in the queue and will start rendering shortly.
        </p>
      )}
    </div>
  )
}
