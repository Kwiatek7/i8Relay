import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['api.dicebear.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      }
    ]
  }
};

export default nextConfig;
