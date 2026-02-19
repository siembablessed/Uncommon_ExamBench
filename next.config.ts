import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse'],

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
