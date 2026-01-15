import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to support API routes
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
