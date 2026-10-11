import { z } from "zod";
import { docMeta, href, imageRef, lstr, lstrOptional, seo } from "./common";

export const heroItem = z.object({
  image: imageRef,
  eyebrow: lstrOptional,
  headline: lstr,
  subtext: lstrOptional,
  ctaLabel: lstr,
  ctaHref: href,
  secondaryCtaLabel: lstrOptional,
  secondaryCtaHref: href.optional(),
});

export const statItem = z.object({
  label: lstr,
  value: z.number().int().nonnegative(),
  suffix: z.string().trim().max(4).default(""),
});

export const homeSectionKey = z.enum(["stats", "chairman", "missionVision", "notices", "events", "faculty"]);

export const homeSection = z.object({
  key: homeSectionKey,
  visible: z.boolean().default(true),
  heading: lstr,
  subheading: lstrOptional,
});

/** Firestore `pages/home` */
export const homePageSchema = z
  .object({
    heroVariant: z.enum(["editorial", "slider"]).default("editorial"),
    hero: z.array(heroItem).min(1),
    stats: z.array(statItem).max(6).default([]),
    sections: z.array(homeSection).default([]),
    seo,
  })
  .extend(docMeta.shape);

export type HomePage = z.infer<typeof homePageSchema>;
export type HeroItem = z.infer<typeof heroItem>;
export type HomeSectionKey = z.infer<typeof homeSectionKey>;
