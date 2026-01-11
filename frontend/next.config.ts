import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
  // Prevent stale cache issues in production
  headers: async () => [
    {
      // Dashboard routes should always revalidate
      source: "/dashboard/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        {
          key: "Pragma",
          value: "no-cache",
        },
        {
          key: "Expires",
          value: "0",
        },
      ],
    },
    {
      // API routes should not be cached
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, must-revalidate",
        },
      ],
    },
  ],
};

export default nextConfig;
