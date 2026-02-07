import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/system-domains",
        destination: "/system",
        permanent: true,
      },
      {
        source: "/system-domains/:path*",
        destination: "/system/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
