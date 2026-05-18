import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — projects/ has stray lockfiles above this dir.
  turbopack: { root: __dirname },
};

export default nextConfig;
