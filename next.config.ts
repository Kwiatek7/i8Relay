import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署支持
  output: 'standalone',

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
