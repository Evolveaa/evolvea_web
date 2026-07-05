import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
