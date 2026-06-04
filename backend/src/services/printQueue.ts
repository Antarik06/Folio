import { query } from '../db'
import { processPrintJob } from '../utils/printProcessor'

let isProcessing = false

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
    // 1. Fetch next queued job
    const jobRes = await query(
      `SELECT id, order_id FROM public.print_jobs 
       WHERE status = 'queued' 
       ORDER BY queued_at ASC LIMIT 1`
    )

    if (jobRes.rows.length === 0) {
      isProcessing = false
      return
    }

    const job = jobRes.rows[0]
    jobId = job.id
    orderId = job.order_id

    addLog(`Found queued job ${jobId} for order ${orderId}`)

    // 2. Lock job
    await query(
      `UPDATE public.print_jobs 
       SET status = 'processing', started_at = NOW() 
       WHERE id = $1`,
      [jobId]
    )

    // 3. Process
    const { pdfPath, report } = await processPrintJob(orderId!, addLog)

    // 4. Update job to complete
    await query(
      `UPDATE public.print_jobs 
       SET status = 'completed', completed_at = NOW(), output_pdf_path = $2, preflight_report = $3, job_log = $4
       WHERE id = $1`,
      [jobId, pdfPath, JSON.stringify(report), logs.join('\n')]
    )

    // 5. Update order to sent-to-print
    await query(
      `UPDATE public.orders 
       SET status = 'sent-to-print', print_ready_pdf_path = $2, preflight_report_path = $3, print_job_id = $1, updated_at = NOW()
       WHERE id = $4`,
      [jobId, pdfPath, pdfPath, orderId]
    )

    addLog(`Job ${jobId} finished successfully`)
  } catch (err: any) {
    addLog(`Error processing job: ${err.message}`)
    if (jobId) {
      try {
        // Update job to failed
        await query(
          `UPDATE public.print_jobs 
           SET status = 'failed', completed_at = NOW(), error_message = $2, job_log = $3
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
  console.log('[PrintQueue] Print queue daemon started.')
  setInterval(async () => {
    try {
      await processNextJob()
    } catch (err: any) {
      console.error('[PrintQueue] Unexpected loop error:', err.message)
    }
  }, intervalMs)
}
