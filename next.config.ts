import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint locally, but don't fail the CI/production build on lint errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Ensure Next.js does not bundle pdf-parse (and friends) into server chunks
    // which can otherwise pull test fixtures at build-time
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    domains: [
      's.w.org',
      'upload.wikimedia.org',
      'assets-global.website-files.com',
      'example.com', // Add any other domains you need
      'effervescent-mandrill-295.convex.cloud'
    ],
  },
};

export default nextConfig;
