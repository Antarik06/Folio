import Link from 'next/link'
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { MonoLabel, PageMasthead, StampButton } from '@/components/folio/primitives'
import { LibrarySheet } from '@/components/photos/library-sheet'
import { monoCount } from '@/lib/photo-clusters'

export const metadata = {
  title: 'Library — Folio',
}

const PAGE_SIZE = 120

/**
 * The full contact sheet. One unbroken grid, capture-date order, paged rather
 * than infinitely scrolled so a deep link into page 4 is a real address.
 */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = (await searchParams) || {}
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  let library: { total: number; photos: any[] } = { total: 0, photos: [] }
  try {
    library = await serverFetch(
      `/api/library/photos?limit=${PAGE_SIZE}&offset=${offset}`,
      token
    )
  } catch (err) {
    console.error('[Library] Fetch failed:', err)
  }

  const lastPage = Math.max(1, Math.ceil(library.total / PAGE_SIZE))
  const from = library.total === 0 ? 0 : offset + 1
  const to = Math.min(offset + library.photos.length, library.total)

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <PageMasthead
        eyebrow="Photos — Library"
        title="Library"
        meta={`Private · ${monoCount(library.total)} photos · sheet ${page} of ${lastPage}`}
        actions={
          <StampButton href="/photos" tone="ghost" size="sm">
            ← Photos
          </StampButton>
        }
      />

      <div className="mt-8">
        <LibrarySheet photos={library.photos} />
      </div>

      {library.total > 0 ? (
        <nav
          aria-label="Library pages"
          className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5"
        >
          <MonoLabel>
            {monoCount(from)}–{monoCount(to)} of {monoCount(library.total)}
          </MonoLabel>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/photos/library?page=${page - 1}`}
                className="inline-flex min-h-[44px] items-center rounded-[2px] border border-border px-4 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground hover:border-foreground"
              >
                ← Prev
              </Link>
            ) : null}
            {page < lastPage ? (
              <Link
                href={`/photos/library?page=${page + 1}`}
                className="inline-flex min-h-[44px] items-center rounded-[2px] border border-border px-4 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground hover:border-foreground"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
