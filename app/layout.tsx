import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231b2336'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%238cc0ea'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "Evolvea · A digital companion to therapy",
  description:
    "Evolvea — a digital companion to speech and cognitive therapy. Ten minutes a night to rebuild how your child thinks. A logopedist-guided, parent-led daily exercise. Coming soon.",
  icons: { icon: FAVICON },
};

export const viewport: Viewport = {
  themeColor: "#0a0e18",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
