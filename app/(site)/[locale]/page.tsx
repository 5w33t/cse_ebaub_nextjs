import { LocaleSwitch } from "@/components/locale-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getLocale } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/i18n/t";

/**
 * TEMPORARY type-and-token specimen for the Foundation step.
 * It is replaced by the real Home page in delivery step 5, where every string comes from Firestore.
 * The literal copy below exists only so fonts, palette, locale rules and the theme toggle can be verified.
 */
const SPECIMEN = {
  en: {
    eyebrow: "Foundation specimen",
    headline: "Learn to build the systems the world runs on.",
    lede: "Fraunces for display, Geist for body, Geist Mono for course codes. Switch the theme and the language to check every token pair.",
    switchLabel: "বাংলা",
    theme: { theme: "Theme", light: "Light", dark: "Dark", system: "System" },
    primary: "Explore B.Sc. in CSE",
    secondary: "Meet the faculty",
    stat: "Students",
    date: "Effective from",
  },
  bn: {
    eyebrow: "ফাউন্ডেশন নমুনা",
    headline: "যে প্রযুক্তিতে পৃথিবী চলে, তা গড়তে শিখুন।",
    lede: "শিরোনামে তিরো বাংলা, মূল লেখায় নোটো সান্স বেঙ্গলি। থিম ও ভাষা বদলে প্রতিটি রঙের জোড়া যাচাই করুন।",
    switchLabel: "English",
    theme: { theme: "থিম", light: "হালকা", dark: "গাঢ়", system: "সিস্টেম" },
    primary: "বি.এসসি. ইন সিএসই সম্পর্কে জানুন",
    secondary: "শিক্ষকদের সঙ্গে পরিচিত হোন",
    stat: "শিক্ষার্থী",
    date: "কার্যকর",
  },
} as const;

export default async function SpecimenPage() {
  const locale = await getLocale();
  const s = SPECIMEN[locale];

  return (
    <main className="container-site flex flex-1 flex-col gap-16 py-24 md:py-32">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-xs text-ink-muted">CSE 101 · {locale}</span>
        <div className="flex items-center gap-2">
          <LocaleSwitch current={locale} label={s.switchLabel} />
          <ThemeToggle labels={s.theme} />
        </div>
      </div>

      <section className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <span className="eyebrow w-max">{s.eyebrow}</span>
          <h1 className="font-display text-display-xl font-medium text-ink">{s.headline}</h1>
          <p className="max-w-prose text-lede text-ink-muted">{s.lede}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href="#"
              className="group inline-flex items-center gap-3 rounded-full bg-primary py-2.5 pr-2.5 pl-6 font-medium text-primary-foreground transition-transform duration-500 ease-out-expo active:scale-[0.98]"
            >
              {s.primary}
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 ease-out-expo group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 dark:bg-black/10"
              >
                ↗
              </span>
            </a>
            <a
              href="#"
              className="hairline inline-flex items-center rounded-full bg-surface px-6 py-2.5 font-medium text-ink transition-[background-color,transform] duration-500 ease-out-expo hover:bg-paper-2 active:scale-[0.98]"
            >
              {s.secondary}
            </a>
          </div>
        </div>

        <div className="shell lg:col-span-5">
          <div className="core flex h-full flex-col justify-between gap-8 p-8">
            <p className="eyebrow w-max">{s.stat}</p>
            <p className="font-display text-display-lg text-ink">{formatNumber(1248, locale)}+</p>
            <p className="text-sm text-ink-muted">
              {s.date}: {formatDate("2026-06-01", locale)}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
