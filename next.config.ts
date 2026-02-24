import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
