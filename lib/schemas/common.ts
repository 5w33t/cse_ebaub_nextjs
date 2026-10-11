import { z } from "zod";

/** Localized string. English is required; Bangla may be empty and renders the English fallback. */
export const lstr = z.object({
  en: z.string().trim().min(1, "English text is required"),
  bn: z.string().trim().default(""),
});
export type LStr = z.infer<typeof lstr>;

/** Localized string where both locales may be empty (sub-headings, optional lines). */
export const lstrOptional = z.object({
  en: z.string().trim().default(""),
  bn: z.string().trim().default(""),
});

/** Localized sanitized HTML (Tiptap output). Sanitized on write by the Server Action. */
export const lhtml = z.object({
  en: z.string().default(""),
  bn: z.string().default(""),
});
export type LHtml = z.infer<typeof lhtml>;

const SITE_IMAGE = /^\/images\/[\w\-./%]+$/;
const SITE_FILE = /^\/files\/[\w\-./%]+$/;

export const assetPath = z
  .string()
  .regex(/^\/(images|files)\/[\w\-./%]+$/, "Must be a site-relative path under /images or /files");

/** Image source: a static path under /images now, or an https URL once a CDN or Storage is added. */
export const imageSrc = z.union([
  z.string().regex(SITE_IMAGE, "Must be a path under /images"),
  z.url({ protocol: /^https$/ }),
]);

export const imageRef = z.object({
  src: imageSrc,
  alt: lstr,
});
export type ImageRef = z.infer<typeof imageRef>;

export const fileRef = z
  .object({
    name: lstr,
    href: z.string().trim(),
    kind: z.enum(["static", "external"]),
  })
  .refine(
    (f) => (f.kind === "static" ? SITE_FILE.test(f.href) : /^https:\/\/\S+$/.test(f.href)),
    { message: "Static files must live under /files; external links must be https", path: ["href"] },
  );
export type FileRef = z.infer<typeof fileRef>;

/** Internal path, https URL, mailto or tel. */
export const href = z
  .string()
  .trim()
  .refine(
    (h) => h.startsWith("/") || h.startsWith("https://") || h.startsWith("mailto:") || h.startsWith("tel:"),
    "Must be an internal path, an https URL, a mailto: or a tel: link",
  );

export const urlOrEmpty = z.union([z.literal(""), z.url({ protocol: /^https$/ })]).default("");

/** Phosphor icon component name, e.g. "Books" or "UsersThree". The admin picker restricts the list. */
export const iconName = z.string().regex(/^[A-Z][A-Za-z0-9]*$/, "Invalid icon name");

export const seo = z.object({
  title: lstr,
  description: lstrOptional,
  ogImage: imageRef.optional(),
});
export type Seo = z.infer<typeof seo>;

export const status = z.enum(["draft", "published"]);
export type Status = z.infer<typeof status>;

/** Fields every stored document carries. Timestamps are ISO strings after serialization. */
export const docMeta = z.object({
  status: status.default("published"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and hyphens only");
