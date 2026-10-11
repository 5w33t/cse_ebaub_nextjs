import "server-only";
import { locale as rootLocale } from "next/root-params";
import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Current public-site locale, read from the `[locale]` root segment.
 * Server Components only. Returns the default locale on admin routes, where no root param exists.
 */
export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  return isLocale(value) ? value : defaultLocale;
}
