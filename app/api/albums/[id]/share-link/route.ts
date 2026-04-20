import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAlbumShareToken } from '@/lib/album-share-token'

const DEFAULT_EXPIRY_HOURS = 24 * 7

interface ShareRequestBody {
  protections?: {
    watermark?: boolean
    noRightClick?: boolean
    noDownload?: boolean
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (albumError || !album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 })
  }

  if (album.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as ShareRequestBody

  const protections = {
    watermark: body.protections?.watermark ?? true,
    noRightClick: body.protections?.noRightClick ?? true,
    noDownload: body.protections?.noDownload ?? true,
  }

  const token = createAlbumShareToken({
    albumId: album.id,
    exp: Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000,
    protections,
  })

  const path = `/album/share/${token}`
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')
  const shareUrl = origin ? `${origin}${path}` : path

  return NextResponse.json({ shareUrl, expiresInHours: DEFAULT_EXPIRY_HOURS })
}
