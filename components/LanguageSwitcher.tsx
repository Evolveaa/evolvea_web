"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { locale: "sk", label: "SK", full: "Slovenčina" },
  { locale: "en", label: "EN", full: "English" },
  { locale: "de", label: "DE", full: "Deutsch" },
] as const;

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persist the chosen locale so the server picks it up on the next render. */
function persistLocale(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${ONE_YEAR};samesite=lax`;
}

/**
 * Compact SK / EN / DE segmented control. Writes the NEXT_LOCALE cookie and
 * refreshes so the server re-renders every section in the chosen language.
 */
export default function LanguageSwitcher() {
  const active = useLocale();
  const t = useTranslations("lang");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(locale: string) {
    if (locale === active) return;
    persistLocale(locale);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="lang-switch"
      role="group"
      aria-label={t("label")}
      data-pending={isPending ? "" : undefined}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.locale}
          type="button"
          className={opt.locale === active ? "lang-opt is-active" : "lang-opt"}
          aria-pressed={opt.locale === active}
          aria-label={opt.full}
          onClick={() => select(opt.locale)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
