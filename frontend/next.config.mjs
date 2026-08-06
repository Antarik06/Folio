/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The project type-checks cleanly, so let build failures surface instead of
    // shipping type errors silently.
    ignoreBuildErrors: false,
  },
  async redirects() {
    // The app router previously carried two parallel trees for the same
    // screens — /(dashboard)/events alongside /(dashboard)/dashboard/events —
    // where the shorter one was part duplicated page, part redirect stub. The
    // duplicates are gone; these keep old links, QR codes and bookmarks working.
    //
    // Temporary (307) on purpose: the deleted stubs redirected with the same
    // status, and a 308 would be cached in browsers indefinitely.
    return [
      { source: '/events', destination: '/dashboard/events', permanent: false },
      { source: '/events/:path*', destination: '/dashboard/events/:path*', permanent: false },
      { source: '/templates', destination: '/dashboard/templates', permanent: false },
      { source: '/templates/:path*', destination: '/dashboard/templates/:path*', permanent: false },
      { source: '/polaroid', destination: '/dashboard/polaroid', permanent: false },
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
