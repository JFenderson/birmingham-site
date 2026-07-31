import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray package-lock.json in
  // an unrelated ancestor directory (C:\Users\josep) otherwise makes
  // Turbopack guess the wrong root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Local multi-tenant dev uses subdomains of lvh.me (miles.lvh.me, etc.)
  // instead of localhost. Without this, Next's dev server blocks
  // cross-origin requests for dev assets (including the hydration bundle)
  // on those hosts, silently leaving pages unhydrated.
  allowedDevOrigins: ["lvh.me", "*.lvh.me"],
};

export default nextConfig;
