import { z } from "zod";
import { docMeta, imageRef, lhtml, lstr, seo } from "./common";

/** Firestore `pages/chairmanMessage` */
export const chairmanMessageSchema = z
  .object({
    /** Optional link to a `faculty/{id}` document. */
    facultyRef: z.string().trim().optional(),
    name: lstr,
    designation: lstr,
    photo: imageRef,
    signature: imageRef,
    /** Light-on-transparent variant for dark mode. Falls back to a CSS invert when absent. */
    signatureDark: imageRef.optional(),
    excerpt: lstr,
    message: lhtml,
    effectiveFrom: z.iso.date(),
    seo,
  })
  .extend(docMeta.shape);

export type ChairmanMessage = z.infer<typeof chairmanMessageSchema>;
