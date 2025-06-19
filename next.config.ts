import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Using compressed base64 data URLs for images, no external domains needed
    remotePatterns: [],
  },
};

export default nextConfig;
