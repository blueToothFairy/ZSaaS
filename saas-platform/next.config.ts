import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // destination: `${process.env.API_URL}/api/:path*`,
        destination: `http://localhost:5000/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
