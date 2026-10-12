import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // We run tests & type checking explicitly via jest and tsc without crashing the memory-constrained dev server
    ignoreBuildErrors: false,
  },
  // Ensure we do not bloat RAM
  reactStrictMode: true,
};

export default nextConfig;
