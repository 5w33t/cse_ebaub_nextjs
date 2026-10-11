import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Admin · CSE EBAUB", template: "%s · Admin · CSE EBAUB" },
  robots: { index: false, follow: false },
  icons: { icon: "/images/brand/icon-32.png" },
};

/** Root layout for the admin panel. English UI only, outside the locale segment. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontVariables} h-full`}>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
