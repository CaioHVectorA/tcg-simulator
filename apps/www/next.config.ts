import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  images: {
    domains: ["assets.tcgdex.net", "via.placeholder.com"],
  },
};

export default nextConfig;
