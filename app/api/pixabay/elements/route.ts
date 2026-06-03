import { NextResponse } from 'next/server'

const PIXABAY_BASE_URL = 'https://pixabay.com/api/'
const PIXABAY_IMAGE_TYPES = new Set(['all', 'photo', 'illustration', 'vector'])

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toImageType(value: string | null) {
  const normalized = (value || 'all').trim().toLowerCase()
  return PIXABAY_IMAGE_TYPES.has(normalized) ? normalized : 'all'
}

export async function GET(request: Request) {
  const apiKey = process.env.PIXABAY_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Element library key is missing on server.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || 'decorative').trim()
  const page = Math.max(1, toNumber(searchParams.get('page'), 1))
  const perPage = Math.min(60, Math.max(6, toNumber(searchParams.get('perPage'), 24)))
  const imageType = toImageType(searchParams.get('type'))

  const upstream = new URL(PIXABAY_BASE_URL)
  upstream.searchParams.set('key', apiKey)
  upstream.searchParams.set('q', query)
  upstream.searchParams.set('page', String(page))
  upstream.searchParams.set('per_page', String(perPage))
  upstream.searchParams.set('image_type', imageType)
  upstream.searchParams.set('safesearch', 'true')
  upstream.searchParams.set('order', 'popular')
  upstream.searchParams.set('lang', 'en')

  try {
    const response = await fetch(upstream.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch elements from the library.' }, { status: 502 })
    }

    const payload = await response.json()
    const hits = Array.isArray(payload?.hits) ? payload.hits : []

    return NextResponse.json({
      total: Number(payload?.total) || 0,
      totalHits: Number(payload?.totalHits) || hits.length,
      page,
      perPage,
      imageType,
      hits: hits.map((hit: any) => ({
        id: hit.id,
        type: hit.type,
        previewURL: hit.previewURL,
        webformatURL: hit.webformatURL,
        largeImageURL: hit.largeImageURL,
        imageWidth: hit.imageWidth,
        imageHeight: hit.imageHeight,
        tags: hit.tags,
        user: hit.user,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Network error while fetching elements.' }, { status: 502 })
  }
}
