/**
 * Seeds Firestore with the department's content.
 *
 *   npm run seed -- --dry-run          validate everything, write lib/generated/seed-preview.json, touch nothing
 *   npm run seed                       write documents that do not exist yet (safe to re-run)
 *   npm run seed -- --force            overwrite existing documents too (clobbers admin edits!)
 *   npm run seed -- --only=courses,obe limit to some groups (site, ui, pages, obe, program, courses, categories, samples)
 *
 * Sources: scripts/seed/content.json (bilingual copy) and public/resources/Syllabus V2 __ Final.md (courses).
 * Every document is validated with the shared zod schemas before anything is written.
 */
import { config as loadEnv } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  aboutPageSchema,
  chairmanMessageSchema,
  contactPageSchema,
  courseSchema,
  eventSchema,
  homePageSchema,
  missionVisionSchema,
  noticeCategorySchema,
  noticeSchema,
  obeFrameworkSchema,
  programSchema,
  researchAreaSchema,
  siteSettingsSchema,
  uiLabelsSchema,
} from "../lib/schemas";
import { loadSyllabusCourses, toHtml } from "./seed/parse-syllabus";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const ONLY = new Set(
  (args.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
const wants = (group: string) => ONLY.size === 0 || ONLY.has(group);

const PLACEHOLDER = /PLACEHOLDER/i;
const PROGRAM_SLUG = "bsc-in-cse";

type SeedDoc = { path: string; group: string; data: Record<string, unknown> };
const docs: SeedDoc[] = [];
const problems: string[] = [];

function add<T extends z.ZodTypeAny>(group: string, path: string, schema: T, input: unknown) {
  if (!wants(group)) return;
  const result = schema.safeParse(input);
  if (!result.success) {
    for (const issue of result.error.issues) {
      problems.push(`${path} → ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return;
  }
  docs.push({ path, group, data: result.data as Record<string, unknown> });
}

// ----------------------------------------------------------------------------------------------
// Load content.json
// ----------------------------------------------------------------------------------------------
type Json = Record<string, unknown>;
const content = JSON.parse(readFileSync(join(process.cwd(), "scripts", "seed", "content.json"), "utf8")) as Json;
const section = (key: string): Json => (content[key] ?? {}) as Json;

const stripPlaceholders = (list: unknown): string[] =>
  Array.isArray(list) ? list.filter((v): v is string => typeof v === "string" && !PLACEHOLDER.test(v)) : [];

// ----------------------------------------------------------------------------------------------
// Singletons
// ----------------------------------------------------------------------------------------------
const site = section("site");
add("site", "settings/site", siteSettingsSchema, {
  ...site,
  emails: stripPlaceholders(site.emails),
  phones: stripPlaceholders(site.phones),
  status: "published",
});

add("ui", "settings/ui", uiLabelsSchema, section("ui"));

const home = section("home");
const heroItems = Array.isArray(home.hero) ? (home.hero as Json[]) : [];
add("pages", "pages/home", homePageSchema, {
  ...home,
  // No hero photo has been supplied yet; use the brand OG image so the page renders.
  hero: heroItems.map((h) => {
    const image = (h.image ?? {}) as Json;
    const src = typeof image.src === "string" && !PLACEHOLDER.test(image.src) ? image.src : "/images/brand/og-base.png";
    return { ...h, image: { ...image, src } };
  }),
  status: "published",
});

add("pages", "pages/about", aboutPageSchema, { ...section("about"), status: "published" });
add("pages", "pages/missionVision", missionVisionSchema, { ...section("missionVision"), status: "published" });
add("pages", "pages/contact", contactPageSchema, {
  ...section("contact"),
  seo: (section("pageSeo").contact as Json) ?? undefined,
  status: "published",
});

// The chairman's message is unknown; seed it as a draft so the public site hides it until it is written.
const chairman = section("chairmanMessage");
add("pages", "pages/chairmanMessage", chairmanMessageSchema, {
  ...chairman,
  photo: { ...(chairman.photo as Json), src: "/images/brand/logo-512.webp" },
  signature: { ...(chairman.signature as Json), src: "/images/brand/logo-mono-512.png" },
  status: "draft",
});

const obe = section("obe");
add("obe", "obe/framework", obeFrameworkSchema, {
  ...obe,
  seo: (section("pageSeo").obe as Json) ?? undefined,
  status: "published",
});

// ----------------------------------------------------------------------------------------------
// Program
// ----------------------------------------------------------------------------------------------
const program = section("program");
add("program", `programs/${PROGRAM_SLUG}`, programSchema, {
  ...program,
  slug: PROGRAM_SLUG,
  intake: PLACEHOLDER.test(String((program.intake as Json)?.en ?? "")) ? { en: "", bn: "" } : program.intake,
  eligibility: PLACEHOLDER.test(String((program.eligibility as Json)?.en ?? ""))
    ? { en: "", bn: "" }
    : program.eligibility,
  seo: (section("pageSeo").academics as Json) ?? undefined,
  status: "published",
});

// ----------------------------------------------------------------------------------------------
// Courses from the syllabus
// ----------------------------------------------------------------------------------------------
const parsed = loadSyllabusCourses();
const perSemesterIndex = new Map<number, number>();
for (const c of parsed) {
  const order = perSemesterIndex.get(c.semester) ?? 0;
  perSemesterIndex.set(c.semester, order + 1);
  add("courses", `courses/${c.slug}`, courseSchema, {
    code: c.code,
    slug: c.slug,
    title: { en: c.title, bn: "" },
    credit: c.credit,
    totalMarks: c.totalMarks,
    type: c.type,
    courseStatus: c.status,
    electiveGroup: c.electiveGroup,
    semester: c.semester,
    programId: PROGRAM_SLUG,
    prerequisites: c.prerequisites,
    rationale: { en: toHtml(c.rationale), bn: "" },
    clos: c.clos.map((clo) => ({ ...clo, text: { en: clo.text, bn: "" } })),
    outline: c.outline.map((row) => ({ ...row, topic: { en: row.topic, bn: "" } })),
    strategies: c.strategies,
    books: c.books,
    order,
    status: "published",
  });
}
for (const c of parsed) {
  for (const note of c.anomalies) problems.push(`[source note] ${c.code} (line ${c.sourceLine}): ${note}`);
}

// ----------------------------------------------------------------------------------------------
// Notice categories and samples
// ----------------------------------------------------------------------------------------------
const categories = Array.isArray(content.noticeCategories) ? (content.noticeCategories as Json[]) : [];
categories.forEach((cat, i) =>
  add("categories", `noticeCategories/${cat.slug}`, noticeCategorySchema, { ...cat, order: i, status: "published" }),
);

const samples = section("samples");
const now = new Date();
const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
if (samples.notice) {
  const n = samples.notice as Json;
  add("samples", `notices/${n.slug}`, noticeSchema, {
    ...n,
    attachments: [],
    pinned: false,
    urgent: false,
    publishAt: now.toISOString(),
    status: "draft",
  });
}
if (samples.event) {
  const e = samples.event as Json;
  add("samples", `events/${e.slug}`, eventSchema, {
    ...e,
    type: "event",
    startAt: nextMonth.toISOString(),
    gallery: [],
    status: "draft",
  });
}
const areas = Array.isArray(samples.researchAreas) ? (samples.researchAreas as Json[]) : [];
areas.forEach((area, i) => {
  const id = String((area.title as Json)?.en ?? `area-${i}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  add("samples", `researchAreas/${id}`, researchAreaSchema, { ...area, order: i, status: "published" });
});

// ----------------------------------------------------------------------------------------------
// Report, then write
// ----------------------------------------------------------------------------------------------
const byGroup = new Map<string, number>();
for (const d of docs) byGroup.set(d.group, (byGroup.get(d.group) ?? 0) + 1);
console.log(`Prepared ${docs.length} documents:`);
for (const [group, count] of byGroup) console.log(`  ${group.padEnd(11)} ${count}`);

const validationErrors = problems.filter((p) => !p.startsWith("[source note]"));
const sourceNotes = problems.filter((p) => p.startsWith("[source note]"));
if (sourceNotes.length) {
  console.log(`\nSource notes (${sourceNotes.length}):`);
  for (const p of sourceNotes) console.log(`  ${p}`);
}
if (validationErrors.length) {
  console.error(`\nValidation errors (${validationErrors.length}):`);
  for (const p of validationErrors) console.error(`  ${p}`);
  process.exit(1);
}

if (DRY_RUN) {
  const outDir = join(process.cwd(), "lib", "generated");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, "seed-preview.json");
  writeFileSync(outFile, JSON.stringify(docs, null, 2) + "\n");
  console.log(`\nDry run: nothing written to Firestore. Preview saved to lib/generated/seed-preview.json`);
  process.exit(0);
}

async function writeAll() {
  const { adminDb } = await import("../lib/firebase/admin-core");
  const { FieldValue } = await import("firebase-admin/firestore");
  const db = adminDb();

  let written = 0;
  let skipped = 0;
  const CHUNK = 400;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);
    const refs = slice.map((d) => db.doc(d.path));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    slice.forEach((d, idx) => {
      const exists = snaps[idx].exists;
      if (exists && !FORCE) {
        skipped++;
        return;
      }
      const { createdAt: _c, updatedAt: _u, updatedBy: _b, ...rest } = d.data;
      void _c;
      void _u;
      void _b;
      batch.set(refs[idx], {
        ...rest,
        createdAt: exists ? (snaps[idx].get("createdAt") ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "seed",
      });
      written++;
    });
    await batch.commit();
  }
  console.log(`\nWrote ${written} documents, skipped ${skipped} existing${FORCE ? "" : " (use --force to overwrite)"}.`);
}

writeAll().catch((error) => {
  console.error(error);
  process.exit(1);
});
