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
