import { query } from '../db'
import { processPrintJob } from '../utils/printProcessor'

let isProcessing = false

/**
 * Progress writes are throttled: a 200-page album would otherwise issue 200
 * UPDATEs while the render competes for the same connection pool. A page
 * boundary that lands inside the window still gets written by the final
 * transition, so the bar never stalls short of 100%.
 */
const PROGRESS_WRITE_INTERVAL_MS = 750

export async function processNextJob() {
  if (isProcessing) return
  isProcessing = true

  let jobId: string | null = null
  let orderId: string | null = null
  const logs: string[] = []

  const addLog = (msg: string) => {
    console.log(`[PrintQueue] ${msg}`)
    logs.push(`[${new Date().toISOString()}] ${msg}`)
  }

  try {
    // 1 + 2. Claim the next queued job atomically.
    // The previous read-then-update sequence, guarded only by a module-level
    // boolean, let two server instances (or a restarted process) pick up the
    // same job and render it twice. FOR UPDATE SKIP LOCKED makes the claim
    // exclusive across every worker sharing the database.
    const jobRes = await query(
      `UPDATE public.print_jobs
       SET status = 'processing', started_at = NOW()
       WHERE id = (
         SELECT id FROM public.print_jobs
         WHERE status = 'queued'
         ORDER BY queued_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       RETURNING id, order_id`
    )

    if (jobRes.rows.length === 0) {
      return
    }

    const job = jobRes.rows[0]
    jobId = job.id
    orderId = job.order_id

    addLog(`Claimed queued job ${jobId} for order ${orderId}`)

    // 3. Process, publishing progress so the buyer and the admin fulfilment
    // queue can show "Rendered 12 of 30 pages" instead of an opaque spinner.
    let lastWriteAt = 0
    let lastStage = ''
    let pendingWrite: Promise<unknown> = Promise.resolve()

    const writeProgress = (progress: {
      stage: string
      current: number
      total: number
      message: string
    }) => {
      const now = Date.now()
      const stageChanged = progress.stage !== lastStage
      const isFinalPage = progress.total > 0 && progress.current === progress.total

      if (!stageChanged && !isFinalPage && now - lastWriteAt < PROGRESS_WRITE_INTERVAL_MS) {
        return
      }

      lastWriteAt = now
      lastStage = progress.stage

      // Fire-and-forget so a slow write never stalls the render, but keep the
      // handle so the job does not complete with an update still in flight.
      pendingWrite = query(
        `UPDATE public.print_jobs
         SET progress_stage = $2,
             progress_current = $3,
             progress_total = $4,
             progress_message = $5,
             progress_updated_at = NOW()
         WHERE id = $1`,
        [jobId, progress.stage, progress.current, progress.total, progress.message]
      ).catch((err: any) => {
        console.warn(`[PrintQueue] Progress update failed: ${err.message}`)
      })
    }

    const { pdfPath, report } = await processPrintJob(orderId!, addLog, writeProgress)
    await pendingWrite

    // 4. Update job to complete
    await query(
      `UPDATE public.print_jobs
       SET status = 'completed',
           completed_at = NOW(),
           output_pdf_path = $2,
           preflight_report = $3,
           job_log = $4,
           progress_stage = 'completed',
           progress_current = GREATEST(progress_total, 1),
           progress_total = GREATEST(progress_total, 1),
           progress_message = 'Print-ready PDF is available',
           progress_updated_at = NOW()
       WHERE id = $1`,
      [jobId, pdfPath, JSON.stringify(report), logs.join('\n')]
    )

    // 5. Update order to sent-to-print.
    // preflight_report_path previously stored the PDF url; the report itself
    // lives on the print job, so point at that instead of duplicating the PDF.
    await query(
      `UPDATE public.orders
       SET status = 'sent-to-print',
           print_ready_pdf_path = $2,
           preflight_report_path = $3,
           print_job_id = $1,
           tracking_status = 'printed',
           updated_at = NOW()
       WHERE id = $4`,
      [jobId, pdfPath, `print_jobs/${jobId}`, orderId]
    )

    addLog(`Job ${jobId} finished successfully`)
  } catch (err: any) {
    addLog(`Error processing job: ${err.message}`)
    if (jobId) {
      try {
        // Update job to failed
        await query(
          `UPDATE public.print_jobs
           SET status = 'failed',
               completed_at = NOW(),
               error_message = $2,
               job_log = $3,
               progress_stage = 'failed',
               progress_message = $2,
               progress_updated_at = NOW()
           WHERE id = $1`,
          [jobId, err.message, logs.join('\n')]
        )
        // Update order status to preflight-failed
        if (orderId) {
          await query(
            `UPDATE public.orders 
             SET status = 'preflight-failed', updated_at = NOW()
             WHERE id = $1`,
            [orderId]
          )
        }
      } catch (innerErr: any) {
        console.error('Failed to update job status to failed:', innerErr.message)
      }
    }
  } finally {
    isProcessing = false
  }
}

export function startPrintQueueDaemon(intervalMs: number = 15000) {
  if (process.env.DISABLE_PRINT_QUEUE === 'true') {
    console.log('[PrintQueue] Daemon disabled via DISABLE_PRINT_QUEUE.')
    return
  }

  console.log('[PrintQueue] Print queue daemon started.')

  // A self-rescheduling timeout rather than setInterval: a job that takes
  // longer than the interval no longer stacks up pending ticks behind it.
  const tick = async () => {
    try {
      await processNextJob()
    } catch (err: any) {
      console.error('[PrintQueue] Unexpected loop error:', err.message)
    } finally {
      timer = setTimeout(tick, intervalMs)
      // Do not hold the event loop open just for the poller.
      timer.unref?.()
    }
  }

  let timer = setTimeout(tick, intervalMs)
  timer.unref?.()
}
