/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The project type-checks cleanly, so let build failures surface instead of
    // shipping type errors silently.
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/polaroid',
        destination: '/polaroid',
      },
      {
         source: '/dashboard/join',
         destination: '/join',
      }
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
