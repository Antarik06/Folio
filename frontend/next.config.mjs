/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The project type-checks cleanly, so let build failures surface instead of
    // shipping type errors silently.
    ignoreBuildErrors: false,
  },
  async redirects() {
    // The app now has three tabs — Photos, Create, Profile — plus two
    // role-gated areas. Everything used to hang off /dashboard, and several
    // screens carried a second parallel tree on top of that.
    //
    // These keep old links, QR codes and bookmarks working. Temporary (307) on
    // purpose: a 308 would be cached in browsers indefinitely, and these paths
    // are expected to retire once the old links age out.
    return [
      // ── Photos ────────────────────────────────────────────────────────────
      { source: '/dashboard', destination: '/photos', permanent: false },
      {
        source: '/dashboard/events/:id/my-photos',
        destination: '/photos/events/:id/me',
        permanent: false,
      },
      { source: '/dashboard/events', destination: '/photos/events', permanent: false },
      { source: '/dashboard/events/:path*', destination: '/photos/events/:path*', permanent: false },
      { source: '/events', destination: '/photos/events', permanent: false },
      { source: '/events/:path*', destination: '/photos/events/:path*', permanent: false },

      // ── Create ────────────────────────────────────────────────────────────
      // Ordered before the generic /dashboard/templates/:path* catch-all.
      {
        source: '/dashboard/templates/use/:id',
        destination: '/create/:id',
        permanent: false,
      },
      {
        source: '/dashboard/templates/preview/:id',
        destination: '/create/:id/preview',
        permanent: false,
      },
      {
        source: '/dashboard/templates/editor/:id',
        destination: '/create/editor/:id?mode=simple',
        permanent: false,
      },
      {
        source: '/dashboard/templates/builder/:id',
        destination: '/create/editor/:id?mode=simple',
        permanent: false,
      },
      // The bespoke Adventure flow and its template are both gone.
      { source: '/dashboard/templates/adventure', destination: '/create', permanent: false },
      { source: '/dashboard/templates', destination: '/create', permanent: false },
      { source: '/dashboard/templates/:path*', destination: '/create/:path*', permanent: false },
      { source: '/templates', destination: '/create', permanent: false },
      { source: '/templates/:path*', destination: '/create/:path*', permanent: false },

      // The Polaroid studio is retired; old links land in the catalogue.
      { source: '/dashboard/polaroid', destination: '/create', permanent: false },
      { source: '/polaroid', destination: '/create', permanent: false },
      { source: '/create/polaroid', destination: '/create', permanent: false },
      { source: '/preview/polaroid', destination: '/create', permanent: false },

      // "Concierge" / "Premium" are all one thing now: Ask an Artist.
      { source: '/dashboard/premium', destination: '/create/artist', permanent: false },
      { source: '/dashboard/premium/:path*', destination: '/create/artist/:path*', permanent: false },

      { source: '/editor/:id', destination: '/create/editor/:id', permanent: false },
      { source: '/dashboard/orders', destination: '/create/orders', permanent: false },
      { source: '/dashboard/orders/:path*', destination: '/create/orders/:path*', permanent: false },
      {
        source: '/dashboard/albums/:id/order',
        destination: '/create/orders/:id',
        permanent: false,
      },

      // ── Role-gated areas ──────────────────────────────────────────────────
      { source: '/dashboard/artist', destination: '/artist-studio', permanent: false },
      { source: '/dashboard/artist/:path*', destination: '/artist-studio/:path*', permanent: false },
      { source: '/dashboard/admin', destination: '/admin', permanent: false },
      { source: '/dashboard/admin/:path*', destination: '/admin/:path*', permanent: false },

      // ── Preview ───────────────────────────────────────────────────────────
      { source: '/preview/template/:id', destination: '/preview/:id', permanent: false },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/join',
        destination: '/join',
      },
    ]
  },
  images: {
    // Every next/image in the app points at a local file in /public, so the
    // built-in optimizer can serve resized AVIF/WebP instead of the raw PNGs.
    // Gallery photos use plain <img> with Supabase URLs and are unaffected.
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
