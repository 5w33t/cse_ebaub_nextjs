import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { htmlLang, isLocale, locales } from "@/lib/i18n/config";
import "@/app/globals.css";

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/images/brand/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/images/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Root layout for the public site. Each locale is a root param, so `lang` is set here. */
export default async function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();

  return (
    <html lang={htmlLang[locale]} suppressHydrationWarning className={`${fontVariables} h-full`}>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
