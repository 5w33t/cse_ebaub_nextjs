import { intlTag, type Locale } from "./config";

/** Localized string as stored in Firestore. `en` is required; `bn` may be empty and falls back to `en`. */
export type LStr = { en: string; bn: string };

/** Pick the value for a locale, falling back to English when the translation is empty. */
export function pick(value: LStr | string | null | undefined, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const chosen = value[locale];
  if (chosen && chosen.trim().length > 0) return chosen;
  return value.en ?? "";
}

/** Replace `{name}` placeholders. Unknown placeholders are left untouched. */
export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/** Convert Western digits in a string to Bangla digits. */
export function toBanglaDigits(input: string): string {
  return input.replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)]);
}

function numberingTag(locale: Locale, banglaDigits: boolean): string {
  if (locale !== "bn") return intlTag.en;
  return banglaDigits ? "bn-BD-u-nu-beng" : "bn-BD-u-nu-latn";
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: { banglaDigits?: boolean; intl?: Intl.NumberFormatOptions } = {},
): string {
  const { banglaDigits = true, intl } = options;
  return new Intl.NumberFormat(numberingTag(locale, banglaDigits), intl).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: { banglaDigits?: boolean; intl?: Intl.DateTimeFormatOptions } = {},
): string {
  const { banglaDigits = true, intl = { dateStyle: "long" } } = options;
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(numberingTag(locale, banglaDigits), {
    timeZone: "Asia/Dhaka",
    ...intl,
  }).format(date);
}

/** UI label dictionary for one locale, loaded from Firestore `settings/ui`. */
export type UiDict = Record<string, string>;

/** Build a `t()` for a locale with English fallback and `{var}` interpolation. */
export function makeT(dicts: { en: UiDict; bn: UiDict }, locale: Locale) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = dicts[locale]?.[key] || dicts.en?.[key] || "";
    return vars ? interpolate(raw, vars) : raw;
  };
}
export type T = ReturnType<typeof makeT>;
