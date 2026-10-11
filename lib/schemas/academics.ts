import { z } from "zod";
import { docMeta, fileRef, lhtml, lstr, lstrOptional, seo, slug } from "./common";

/** Firestore `programs/{slug}` */
export const programSchema = z
  .object({
    name: lstr,
    slug,
    degree: lstr,
    durationYears: z.number().int().min(1).max(6),
    /** null until the department confirms the figure; never hardcode it. */
    totalCredits: z.number().positive().nullable().default(null),
    intake: lstrOptional,
    eligibility: lhtml,
    description: lhtml,
    curriculumPdf: fileRef.optional(),
    seo: seo.optional(),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Program = z.infer<typeof programSchema>;

const coCode = z.string().regex(/^CO\d{1,2}$/);
const poCode = z.string().regex(/^PO\d{1,2}$/);

export const cloSchema = z.object({
  code: coCode,
  text: lstr,
  taxonomy: z.string().default(""),
  poMap: z.array(poCode).default([]),
  wk: z.array(z.string().regex(/^WK\d{1,2}$/)).default([]),
  wp: z.array(z.string().regex(/^WP\d{1,2}$/)).default([]),
  ea: z.array(z.string().regex(/^EA\d{1,2}$/)).default([]),
});

export const outlineRowSchema = z.object({
  topic: lstr,
  weeks: z.number().nullable().default(null),
  cos: z.array(coCode).default([]),
});

export const strategyRowSchema = z.object({
  co: coCode,
  instructional: z.string().default(""),
  assessment: z.string().default(""),
});

export const bookSchema = z.object({
  authors: z.string().default(""),
  title: z.string().min(1),
  isTextbook: z.boolean().default(false),
});

export const courseCode = z.string().regex(/^[A-Z]{2,4} \d{4}$/, "Course code like CSE 1101");

/** Firestore `courses/{slug}` */
export const courseSchema = z
  .object({
    code: courseCode,
    slug,
    title: lstr,
    credit: z.number().positive(),
    totalMarks: z.number().int().positive().nullable().default(null),
    type: z.enum(["theory", "lab"]),
    courseStatus: z.enum(["core", "elective", "ged"]).default("core"),
    electiveGroup: z.enum(["I", "II"]).nullable().default(null),
    semester: z.number().int().min(1).max(8),
    programId: slug,
    prerequisites: z.array(courseCode).default([]),
    rationale: lhtml,
    clos: z.array(cloSchema).default([]),
    outline: z.array(outlineRowSchema).default([]),
    strategies: z.array(strategyRowSchema).default([]),
    books: z.array(bookSchema).default([]),
    order: z.number().int().default(0),
  })
  .extend(docMeta.shape);
export type Course = z.infer<typeof courseSchema>;

const coded = (pattern: RegExp) =>
  z.object({
    code: z.string().regex(pattern),
    text: lstr,
  });

/** Firestore `obe/framework` */
export const obeFrameworkSchema = z
  .object({
    graduateAttributes: z.array(coded(/^GA\d{1,2}$/)).default([]),
    peos: z.array(coded(/^PEO\d{1,2}$/).extend({ title: lstr })).default([]),
    pos: z.array(coded(/^PO\d{1,2}$/).extend({ title: lstr })).default([]),
    wks: z.array(coded(/^WK\d{1,2}$/)).default([]),
    /** PEO → mission codes, e.g. { PEO1: ["PM1"] } */
    peoPmMap: z.record(z.string(), z.array(z.string())).default({}),
    /** PO → PEO codes */
    poPeoMap: z.record(z.string(), z.array(z.string())).default({}),
    seo: seo.optional(),
  })
  .extend(docMeta.shape);
export type ObeFramework = z.infer<typeof obeFrameworkSchema>;
