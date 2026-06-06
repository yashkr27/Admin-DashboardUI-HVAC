import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig


