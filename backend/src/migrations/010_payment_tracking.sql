-- ALTER ORDERS TABLE TO ADD TRACKING STATUS AND RAZORPAY COLUMNS

-- Add tracking_status column with a CHECK constraint for the progress steps
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'order placed' 
  CHECK (tracking_status IN ('order placed', 'reviewed by humans', 'finalize design', 'printed', 'out for delivery', 'order arrived'));

-- Add Razorpay specific columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
