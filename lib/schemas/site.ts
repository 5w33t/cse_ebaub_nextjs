import { z } from "zod";
import { assetPath, docMeta, href, imageRef, lstr, lstrOptional, seo, urlOrEmpty } from "./common";

export const navLink = z.object({
  label: lstr,
  href,
});

export const navItem = navLink.extend({
  children: z.array(navLink).default([]),
});

export const footerColumn = z.object({
  heading: lstr,
  links: z.array(navLink).default([]),
});

/** Firestore `settings/site` */
export const siteSettingsSchema = z
  .object({
    name: lstr,
    shortName: lstr,
    tagline: lstr,
    universityName: lstr,
    universityUrl: z.url({ protocol: /^https$/ }),
    logo: imageRef,
    logoDark: imageRef.optional(),
    logoMono: imageRef.optional(),
    favicon: assetPath,
    address: lstr,
    emails: z.array(z.email()).default([]),
    phones: z.array(z.string().trim().min(3)).default([]),
    officeHours: lstrOptional,
    mapEmbedUrl: urlOrEmpty,
    socials: z
      .object({
        facebook: urlOrEmpty,
        linkedin: urlOrEmpty,
        youtube: urlOrEmpty,
      })
      .default({ facebook: "", linkedin: "", youtube: "" }),
    nav: z.array(navItem).default([]),
    footer: z.object({
      about: lstr,
      columns: z.array(footerColumn).default([]),
    }),
    useBanglaDigits: z.boolean().default(true),
    defaultSeo: seo,
  })
  .extend(docMeta.shape);

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type NavItem = z.infer<typeof navItem>;
