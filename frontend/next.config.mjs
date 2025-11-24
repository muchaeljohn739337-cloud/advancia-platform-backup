/**
 * Next.js configuration with API rewrites to the backend.
 * Destination is taken from NEXT_PUBLIC_API_URL at build time,
 * falling back to http://localhost:4000 for local development.
 */

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
