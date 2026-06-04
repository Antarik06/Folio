import { query, pool } from '../db'

async function run() {
  console.log('Inserting Warm Memories 10-page template...')
  
  const artistId = '22222222-3333-4444-5555-555555555555' // Seed artist ID
  const templateId = '99999999-8888-7777-6666-555555555555' // Custom UUID for this template

  const spreads = [
    {
      id: "warm-memories-spread-1",
      isCover: true,
      background: "#FAF6F0",
      elements: [],
      front: {
        background: "#FAF6F0",
        elements: [
          {
            id: "warm-memories-p1-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    },
    {
      id: "warm-memories-spread-2",
      background: "#FFFFFF",
      elements: [],
      front: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p2-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      },
      back: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p3-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    },
    {
      id: "warm-memories-spread-3",
      background: "#FFFFFF",
      elements: [],
      front: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p4-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      },
      back: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p5-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    },
    {
      id: "warm-memories-spread-4",
      background: "#FFFFFF",
      elements: [],
      front: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p6-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      },
      back: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p7-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    },
    {
      id: "warm-memories-spread-5",
      background: "#FFFFFF",
      elements: [],
      front: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p8-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      },
      back: {
        background: "#FFFFFF",
        elements: [
          {
            id: "warm-memories-p9-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    },
    {
      id: "warm-memories-spread-6",
      background: "#FAF6F0",
      elements: [],
      front: {
        background: "#FAF6F0",
        elements: [
          {
            id: "warm-memories-p10-img",
            type: "image",
            src: null,
            x: 50,
            y: 100,
            width: 600,
            height: 800,
            rotation: 0,
            zIndex: 1,
            fitMode: "fill"
          }
        ]
      }
    }
  ]

  const layoutSchema = {
    spreads
  }

  try {
    // Delete existing Warm Memories template if any
    await query('DELETE FROM public.templates WHERE id = $1', [templateId])

    const res = await query(
      `INSERT INTO public.templates 
       (id, artist_id, name, description, category, tags, status, page_count, total_photo_slots, background_pdf_path, thumbnail_url, page_previews_urls, price_tier, available_sizes, paper_options, cover_options, layout_schema)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        templateId,
        artistId,
        'Warm Memories',
        'A warm, nostalgic layout spanning 10 pages, ideal for preserving intimate wedding memories and family stories.',
        'Love',
        JSON.stringify(['warm', 'nostalgic', 'wedding']),
        'published', // Live instantly
        10,
        10,
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop', // PDF fallback mockup
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop', // thumbnail
        JSON.stringify([]),
        'free',
        JSON.stringify(['A4']),
        JSON.stringify(['matte']),
        JSON.stringify(['hardcover']),
        JSON.stringify(layoutSchema)
      ]
    )

    console.log('Successfully inserted dynamic template:', res.rows[0].name)
  } catch (err) {
    console.error('Error inserting template:', err)
  } finally {
    await pool.end()
  }
}

run()
