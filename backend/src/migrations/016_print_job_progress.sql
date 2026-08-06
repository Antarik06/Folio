-- Migration: Real-time progress reporting for the print PDF export pipeline.
--
-- A 300 DPI multi-page compile takes 10-20s (longer for big albums) and the
-- only feedback was a status flipping from 'queued' to 'completed'. These
-- columns let the worker publish "rendered 12 of 30 pages" as it goes, which
-- the order screen and the admin fulfilment queue poll.

ALTER TABLE public.print_jobs
  ADD COLUMN IF NOT EXISTS progress_stage TEXT NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS progress_current INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_message TEXT,
  ADD COLUMN IF NOT EXISTS progress_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  ALTER TABLE public.print_jobs
    ADD CONSTRAINT print_jobs_progress_stage_check
    CHECK (progress_stage IN ('queued', 'preparing', 'rendering', 'compiling', 'uploading', 'completed', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill terminal jobs so the UI does not show finished work stuck at 0%.
UPDATE public.print_jobs
SET progress_stage = 'completed',
    progress_current = GREATEST(progress_current, 1),
    progress_total = GREATEST(progress_total, 1)
WHERE status = 'completed' AND progress_stage = 'queued';

UPDATE public.print_jobs
SET progress_stage = 'failed'
WHERE status = 'failed' AND progress_stage = 'queued';

-- The buyer polls their own job while it renders, so the lookup is by order.
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_queued
  ON public.print_jobs(order_id, queued_at DESC);

-- Buyers may read the job for their own order (progress only — the row carries
-- no other party's data). Writes stay service-role only.
DROP POLICY IF EXISTS "print_jobs_buyer_read" ON public.print_jobs;
CREATE POLICY "print_jobs_buyer_read" ON public.print_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = print_jobs.order_id AND o.user_id = auth.uid()
    )
  );
