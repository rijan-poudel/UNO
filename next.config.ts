import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "sonner"],
  },
  // Cached clients can still request the artwork's previous URL.
  redirects() {
    return [
      {
        source: "/artwork/cards/color-roulette.png",
        destination: "/artwork/cards/color-roulette.webp",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/audios/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/audio/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/loadingPage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
