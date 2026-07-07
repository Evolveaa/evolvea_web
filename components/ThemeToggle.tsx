"use client";

import { useTranslations } from "next-intl";

/**
 * Light/dark theme toggle. The theme is applied before paint by the inline
 * script in the root layout (no flash) and lives entirely in the `data-theme`
 * attribute on <html>; the icon shown is CSS-driven by that attribute, so this
 * component needs no React state — it just flips the attribute and persists it.
 */
export default function ThemeToggle() {
  const t = useTranslations("common");
  const label = t("themeToggle");

  function toggle() {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode — ignore */
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {/* moon shows in light mode (→ go dark), sun shows in dark mode (→ go light) */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="tt-moon">
        <path
          d="M20 14.5A8 8 0 0 1 9.5 4a.5.5 0 0 0-.66-.6A9 9 0 1 0 20.6 15.2a.5.5 0 0 0-.6-.7z"
          fill="currentColor"
        />
      </svg>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="tt-sun">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3" />
        </g>
      </svg>
    </button>
  );
}
