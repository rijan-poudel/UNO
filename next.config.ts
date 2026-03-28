import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "sonner"],
  },
  async headers() {
    return [
      {
        source: "/audios/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/voice/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/loadingPage/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
