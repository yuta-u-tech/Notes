import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    devtoolSegmentExplorer: false
  },
  outputFileTracingRoot: __dirname
};

export default nextConfig;
