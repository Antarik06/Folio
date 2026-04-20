/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/polaroid',
        destination: '/polaroid',
      },
      {
        source: '/dashboard/events/:path*',
        destination: '/events/:path*',
      },
      {
        source: '/dashboard/templates/:path*',
        destination: '/templates/:path*',
      },
      {
         source: '/dashboard/join',
         destination: '/join',
      }
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
