import { z } from "zod";
import { docMeta, imageRef, lhtml, lstr, lstrOptional, slug, urlOrEmpty } from "./common";

const emailOrEmpty = z.union([z.literal(""), z.email()]).default("");

/** Firestore `faculty/{slug}` */
export const facultySchema = z
  .object({
    name: lstr,
    slug,
    designation: lstr,
    photo: imageRef.optional(),
    email: emailOrEmpty,
    phone: z.string().trim().default(""),
    office: lstrOptional,
    education: z.array(lstr).default([]),
    researchInterests: z.array(lstr).default([]),
    bio: lhtml,
    links: z
      .object({
        scholar: urlOrEmpty,
        orcid: urlOrEmpty,
        researchgate: urlOrEmpty,
        website: urlOrEmpty,
      })
      .default({ scholar: "", orcid: "", researchgate: "", website: "" }),
    isChairman: z.boolean().default(false),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Faculty = z.infer<typeof facultySchema>;

/** Firestore `staff/{id}` */
export const staffSchema = z
  .object({
    name: lstr,
    designation: lstr,
    photo: imageRef.optional(),
    email: emailOrEmpty,
    phone: z.string().trim().default(""),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Staff = z.infer<typeof staffSchema>;
