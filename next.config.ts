import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Children's-data product → strict transport + framing + permissions defaults.
// CSP ships only in production: next dev needs eval/inline tooling. The theme
// bootstrap in app/layout.tsx is an inline script, hence script-src allows
// 'unsafe-inline' (no third-party scripts are loaded at all).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone stays first-party — speech exercises record with consent
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: CSP }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    // Client-side Router Cache lifetime. Next 16 defaults dynamic pages to 0s,
    // so every back-navigation refetched from the server. Our pages are dynamic
    // (auth-gated via cookies), so returning to a just-visited page felt like a
    // full reload. 120s makes revisits instant while keeping a small staleness
    // ceiling — mutations still bust the cache immediately via revalidatePath(),
    // so this only bounds cross-actor changes (e.g. a therapist editing a plan).
    staleTimes: {
      dynamic: 120,
      static: 300,
    },
  },
};

export default withNextIntl(nextConfig);
