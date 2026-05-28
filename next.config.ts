import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: 'export' to support API routes
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
