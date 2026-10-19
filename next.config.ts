import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  async headers() {
    const commonHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    ];

    return [
      // The Sanity Dashboard embeds this self-hosted Studio. X-Frame-Options
      // cannot permit a named external origin, so Studio uses a narrow CSP
      // frame-ancestors allowlist instead.
      {
        source: "/studio/:path*",
        headers: [
          ...commonHeaders,
          { key: "Content-Security-Policy", value: "frame-ancestors https://*.sanity.io" },
        ],
      },
      {
        source: "/:path((?!studio(?:/|$)).*)",
        headers: [
          ...commonHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      {
        source: "/shoes-for-kids/manage/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/admin/shoes-for-kids/:path*",
        headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" }],
      },
    ];
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
