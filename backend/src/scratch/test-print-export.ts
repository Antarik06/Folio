import { query } from '../db'
import { processPrintJob } from '../utils/printProcessor'

async function runTest() {
  console.log('--- Print Export Pipeline Test ---')
  
  // 1. Find or seed a mock user profile
  const userRes = await query('SELECT id FROM public.profiles LIMIT 1')
  const userId = userRes.rows[0]?.id
  if (!userId) {
    console.error('No profiles found in the database. Please run migrations and seed profiles first.')
    process.exit(1)
  }

  // 2. Build a mock layout structure
  const mockLayout = {
    spreads: [
      {
        id: 'test-spread-1',
        isCover: true,
        background: '#FAF9F6',
        front: {
          background: '#FAF9F6',
          elements: [
            {
              id: 'el-title',
              type: 'text',
              text: 'MEMORIES OF SUMMER',
              x: 100,
              y: 200,
              width: 500,
              height: 100,
              fontSize: 36,
              fill: '#1A1A1A'
            },
            {
              id: 'el-photo-1',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
              x: 100,
              y: 350,
              width: 500,
              height: 400,
              crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
            }
          ]
        }
      },
      {
        id: 'test-spread-2',
        isCover: false,
        background: '#FFFFFF',
        front: {
          background: '#FFFFFF',
          elements: [
            {
              id: 'el-photo-2',
              type: 'image',
              src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800',
              x: 50,
              y: 100,
              width: 600,
              height: 800,
              crop: null
            }
          ]
        },
        back: {
          background: '#FFFFFF',
          elements: [
            {
              id: 'el-text-2',
              type: 'text',
              text: 'THE END OF AN ADVENTURE',
              x: 100,
              y: 400,
              width: 500,
              height: 80,
              fontSize: 24,
              fill: '#000000'
            }
          ]
        }
      }
    ]
  }

  // 3. Insert mock order
  console.log('Inserting mock order...')
  const orderRes = await query(
    `INSERT INTO public.orders 
     (user_id, product_type, quantity, unit_price, total_price, currency, payment_status, tracking_status, album_layout_json, contact_details_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      userId,
      'softcover_small',
      1,
      1500,
      1500,
      'inr',
      'paid',
      'order placed',
      JSON.stringify(mockLayout),
      JSON.stringify({ name: 'Test User', email: 'test@example.com', phone: '1234567890' })
    ]
  )
  const orderId = orderRes.rows[0].id
  console.log(`Mock order created: ${orderId}`)

  // 4. Run print export pipeline
  try {
    const logLogs: string[] = []
    const logCb = (msg: string) => {
      console.log(`[TEST LOG] ${msg}`)
      logLogs.push(msg)
    }

    const result = await processPrintJob(orderId, logCb)
    console.log('--- TEST COMPLETED ---')
    console.log('PDF URL:', result.pdfPath)
    console.log('Report:', JSON.stringify(result.report, null, 2))
    process.exit(0)
  } catch (err: any) {
    console.error('Test compilation failed:', err.message)
    process.exit(1)
  }
}

void runTest()
