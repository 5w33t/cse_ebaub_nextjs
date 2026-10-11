import { z } from "zod";
import { docMeta, fileRef, iconName, imageRef, lhtml, lstr, lstrOptional, slug, urlOrEmpty } from "./common";

/** Firestore `noticeCategories/{slug}` */
export const noticeCategorySchema = z
  .object({
    name: lstr,
    slug,
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type NoticeCategory = z.infer<typeof noticeCategorySchema>;

/** Firestore `notices/{id}` */
export const noticeSchema = z
  .object({
    title: lstr,
    slug,
    category: slug,
    content: lhtml,
    attachments: z.array(fileRef).default([]),
    pinned: z.boolean().default(false),
    urgent: z.boolean().default(false),
    /** ISO datetime; the public query filters publishAt <= now. */
    publishAt: z.iso.datetime(),
  })
  .extend(docMeta.shape);
export type Notice = z.infer<typeof noticeSchema>;

/** Firestore `events/{slug}` */
export const eventSchema = z
  .object({
    title: lstr,
    slug,
    type: z.enum(["event", "news"]).default("event"),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime().optional(),
    venue: lstrOptional,
    cover: imageRef.optional(),
    excerpt: lstrOptional,
    body: lhtml,
    gallery: z.array(imageRef).default([]),
  })
  .extend(docMeta.shape);
export type EventItem = z.infer<typeof eventSchema>;

/** Firestore `downloads/{id}` */
export const downloadSchema = z
  .object({
    title: lstr,
    category: lstr,
    file: fileRef,
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Download = z.infer<typeof downloadSchema>;

/** Firestore `researchAreas/{id}` */
export const researchAreaSchema = z
  .object({
    title: lstr,
    description: lstr,
    icon: iconName.optional(),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type ResearchArea = z.infer<typeof researchAreaSchema>;

/** Firestore `labs/{id}` */
export const labSchema = z
  .object({
    name: lstr,
    description: lhtml,
    photo: imageRef.optional(),
    equipment: z.array(lstr).default([]),
    /** faculty slug */
    inChargeRef: z.string().trim().optional(),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Lab = z.infer<typeof labSchema>;

/** Firestore `publications/{id}` */
export const publicationSchema = z
  .object({
    title: z.string().trim().min(1),
    authors: z.array(z.string().trim().min(1)).default([]),
    /** faculty slugs */
    facultyRefs: z.array(z.string()).default([]),
    venue: z.string().trim().default(""),
    year: z.number().int().min(1950).max(2100),
    doi: z.string().trim().default(""),
    url: urlOrEmpty,
  })
  .extend(docMeta.shape);
export type Publication = z.infer<typeof publicationSchema>;

/** Firestore `messages/{id}` (contact form inbox) */
export const messageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  read: z.boolean().default(false),
  createdAt: z.string().optional(),
});
export type Message = z.infer<typeof messageSchema>;

/** Firestore `pages/contact` */
export const contactPageSchema = z
  .object({
    intro: lstr,
    formEnabled: z.boolean().default(true),
    seo: z.object({ title: lstr, description: lstrOptional }).optional(),
  })
  .extend(docMeta.shape);
export type ContactPage = z.infer<typeof contactPageSchema>;

/** Firestore `pages/about` */
export const aboutPageSchema = z
  .object({
    overview: lhtml,
    history: z
      .array(
        z.object({
          year: z.string().trim().min(4).max(12),
          title: lstr,
          text: lstrOptional,
        }),
      )
      .default([]),
    seo: z.object({ title: lstr, description: lstrOptional }).optional(),
  })
  .extend(docMeta.shape);
export type AboutPage = z.infer<typeof aboutPageSchema>;
