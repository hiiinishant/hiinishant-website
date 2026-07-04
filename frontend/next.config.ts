import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["hiinishant-website-1.onrender.com"]
    }
  }
};

export default nextConfig;
