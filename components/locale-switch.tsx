"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, localizePath, stripLocale, type Locale } from "@/lib/i18n/config";

/**
 * Links to the same page in the other locale. The label is the *target* language's own name,
 * which is the convention that works for people who cannot read the current one.
 */
export function LocaleSwitch({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() ?? "/";
  const { path } = stripLocale(pathname);
  const target: Locale = current === defaultLocale ? "bn" : defaultLocale;
  return (
    <Link
      href={localizePath(path, target)}
      hrefLang={target}
      lang={target}
      className="hairline inline-flex h-9 items-center rounded-full bg-surface px-3.5 text-sm font-medium text-ink transition-[background-color,transform] duration-500 ease-out-expo hover:bg-paper-2 active:scale-[0.98]"
    >
      {label}
    </Link>
  );
}
