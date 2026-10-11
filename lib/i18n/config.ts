export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie that remembers the visitor's last chosen locale. Read-only hint; never used to redirect. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** BCP 47 tags used for Intl formatting. */
export const intlTag: Record<Locale, string> = {
  en: "en-US",
  bn: "bn-BD",
};

export const htmlLang: Record<Locale, string> = {
  en: "en",
  bn: "bn",
};

/** Build a public URL path for a locale. English is unprefixed; Bangla lives under /bn. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Strip a leading locale prefix from a browser pathname. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: defaultLocale, path: pathname || "/" };
}
