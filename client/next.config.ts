import type { NextConfig } from "next";

const piApiOrigin = process.env.PI_API_ORIGIN;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!piApiOrigin) {
      return [];
    }

    return [
      {
        source: "/api/biomath-lab/:path*",
        destination: `${piApiOrigin}/api/biomath-lab/:path*`,
      },
    ];
  },
};

export default nextConfig;
