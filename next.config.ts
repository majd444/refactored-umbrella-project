import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint locally, but don't fail the CI/production build on lint errors
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      's.w.org',
      'upload.wikimedia.org',
      'assets-global.website-files.com',
      'example.com' // Add any other domains you need
    ],
  },
};

export default nextConfig;
