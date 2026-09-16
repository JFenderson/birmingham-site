import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    ] }];
  },
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
