import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["sk", "en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sk";
export const LOCALE_COOKIE = "NEXT_LOCALE";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
