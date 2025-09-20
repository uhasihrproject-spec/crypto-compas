import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["coin-images.coingecko.com"],
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true, // 🚀 ignore ESLint errors in production build
  },
  typescript: {
    ignoreBuildErrors: true, // 🚀 ignore TypeScript errors in production build
  },
};

export default nextConfig;

