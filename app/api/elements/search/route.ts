import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('perPage') || '24'
  const category = searchParams.get('category') || 'all'
  const source = searchParams.get('source') || 'pixabay'

  try {
    if (source === 'pixabay') {
      const PIXABAY_KEY = process.env.PIXABAY_API_KEY
      if (!PIXABAY_KEY) {
        return NextResponse.json({ error: 'Pixabay API key not configured' }, { status: 500 })
      }

      let imageType = 'all'
      if (category === 'vectors') imageType = 'vector'
      if (category === 'illustrations') imageType = 'illustration'
      if (category === 'photos') imageType = 'photo'

      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=${imageType}&page=${page}&per_page=${perPage}&safesearch=true`
      )
      const data = await response.json()

      const hits = (data.hits || []).map((hit: any) => ({
        id: hit.id,
        source: 'pixabay',
        previewURL: hit.previewURL,
        largeURL: hit.webformatURL || hit.largeImageURL,
        width: hit.imageWidth,
        height: hit.imageHeight,
        tags: hit.tags,
        type: hit.type,
      }))

      return NextResponse.json({
        hits,
        totalHits: data.totalHits || 0,
      })
    }

    if (source === 'pexels') {
      const PEXELS_KEY = process.env.PEXELS_API_KEY
      if (!PEXELS_KEY) {
        return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 })
      }

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: PEXELS_KEY,
          },
        }
      )
      const data = await response.json()

      const hits = (data.photos || []).map((photo: any) => ({
        id: photo.id,
        source: 'pexels',
        previewURL: photo.src.medium,
        largeURL: photo.src.large2x || photo.src.large,
        width: photo.width,
        height: photo.height,
        tags: photo.alt || 'Texture',
        type: 'photo',
      }))

      return NextResponse.json({
        hits,
        totalHits: data.total_results || 0,
      })
    }

    if (source === 'svgrepo') {
      // SVG Repo doesn't have a standard public API key system.
      // We might use a fallback or a specific endpoint if provided.
      return NextResponse.json({
        hits: [],
        totalHits: 0,
        message: 'SVG Repo integration pending specific API endpoint configuration.',
      })
    }

    return NextResponse.json({ error: 'Unsupported source' }, { status: 400 })
  } catch (error) {
    console.error('Element search error:', error)
    return NextResponse.json({ error: 'Failed to search elements' }, { status: 500 })
  }
}
