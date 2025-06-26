import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable ESLint during build for testing
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Using compressed base64 data URLs for images, no external domains needed
    remotePatterns: [],
  },
  // Force favicon reload
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon-:size.png',
        headers: [
          {
            key: 'Cache-Control', 
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
