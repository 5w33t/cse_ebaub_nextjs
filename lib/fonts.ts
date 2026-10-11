import { Fraunces, Geist, Geist_Mono, Noto_Sans_Bengali, Tiro_Bangla } from "next/font/google";

/**
 * Five faces, loaded once and shared by every root layout.
 * Latin display: Fraunces. Latin UI: Geist. Mono: Geist Mono.
 * Bengali display: Tiro Bangla. Bengali UI: Noto Sans Bengali.
 * The CSS in app/globals.css decides which face is primary per locale.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const tiroBangla = Tiro_Bangla({
  weight: "400",
  subsets: ["bengali"],
  variable: "--font-tiro",
  display: "swap",
});

export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const fontVariables = [
  fraunces.variable,
  geistSans.variable,
  geistMono.variable,
  tiroBangla.variable,
  notoSansBengali.variable,
].join(" ");
