import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import type { Locale } from "@/lib/i18n/config";
import { makeT, type UiDict } from "@/lib/i18n/t";
import { siteSettingsSchema, type SiteSettings } from "@/lib/schemas/site";
import { uiLabelsSchema } from "@/lib/schemas/ui";
import { serialize } from "./serialize";

/**
 * Site-wide settings (`settings/site`). Cached until an admin save calls updateTag('settings').
 * Returns null when the document is missing or invalid; callers render a skeleton, never hardcoded copy.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  "use cache";
  cacheLife("max");
  cacheTag("settings", "settings:site");

  const snap = await adminDb().doc("settings/site").get();
  if (!snap.exists) return null;
  const parsed = siteSettingsSchema.safeParse(serialize(snap.data()));
  if (!parsed.success) {
    console.error("[content] settings/site failed validation", parsed.error.issues);
    return null;
  }
  return parsed.data;
}

/** UI label dictionaries (`settings/ui`). */
export async function getUiLabels(): Promise<{ en: UiDict; bn: UiDict }> {
  "use cache";
  cacheLife("max");
  cacheTag("settings", "settings:ui");

  const snap = await adminDb().doc("settings/ui").get();
  if (!snap.exists) return { en: {}, bn: {} };
  const parsed = uiLabelsSchema.safeParse(serialize(snap.data()));
  if (!parsed.success) {
    console.error("[content] settings/ui failed validation", parsed.error.issues);
    return { en: {}, bn: {} };
  }
  return parsed.data;
}

/** Convenience: a `t()` bound to the given locale. */
export async function getT(locale: Locale) {
  const dicts = await getUiLabels();
  return makeT(dicts, locale);
}
