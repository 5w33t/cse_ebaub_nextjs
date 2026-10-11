# Progress

Session-to-session task tracker for the EBAUB CSE website. The specification is
`public/resources/ebaub_cse_project_specification_prompt.md` (v2). Update this file at the end of every
working session: move items between sections, add dates, note blockers.

## Delivery steps

| Step | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: tokens, fonts, locale routing, cacheComponents, Firebase modules, schemas, asset manifest, brand exports | Done 2026-10-11 (commit 53fa4c9) |
| 2 | Auth: login, session cookie route, proxy, requireAdmin, set-admin script, Firestore rules and indexes | Done 2026-10-11 (commit 53fa4c9) |
| 3 | Seed: `scripts/seed.ts` from `scripts/seed/content.json` + syllabus markdown | Built and dry-run verified 2026-10-11; real run blocked on `.env.local` |
| 4 | Admin CMS: shell, form builder, image library, pickers, modules, translation-gap widget | Not started |
| 5 | Public site: utility bar, floating nav, footer, Home, About, Academics, OBE, Faculty, Notices, Events, Research, Downloads, Contact | Not started |
| 6 | Polish: SEO + hreflang, sitemap, OG images, a11y audit, contrast report, Lighthouse, empty states, not-found | Not started |
| 7 | Deploy: Vercel, env vars, `firebase deploy --only firestore`, authorized domains, first super admin | Not started |

## Step 3 (Seed) summary

- `scripts/seed/parse-syllabus.ts` parses `Syllabus V2 __ Final.md` into 79 courses (8 semesters, Table I/II electives) with CLOs (255, all PO-mapped), outlines, strategies and books. Run it alone for a summary with anomalies.
- `scripts/seed.ts --dry-run` validates 99 documents against the zod schemas and writes `lib/generated/seed-preview.json`. Without `--dry-run` it writes only missing documents; `--force` overwrites; `--only=courses,obe,...` limits groups.
- Schemas added: `lib/schemas/academics.ts` (programs, courses, obe/framework), `people.ts` (faculty, staff), `content.ts` (notices, categories, events, downloads, researchAreas, labs, publications, messages, pages/contact, pages/about).
- Seeded as **draft** (hidden from the public): `pages/chairmanMessage`, the sample notice and sample event.
- Temporary stand-ins until real assets arrive: hero image and chairman photo/signature point at brand images.
- Required credits from the syllabus: 164 (core + GED) plus electives; `programs.totalCredits` stays `null` until confirmed.

### Source issues found in the syllabus (for the department to confirm)

- 1st Year 2nd Semester "Electronic Devices and Circuits Sessional" is printed as **EEE 1104**, the same code as its prerequisite. Seeded as **EEE 1204**.
- CSE 1101 (Discrete Mathematics) book 1 is "Kenneth H. Rosen: Introduction to Computer, McGraw-Hill" (title copied from CSE 1100; should be *Discrete Mathematics and Its Applications*). Seeded as printed.
- MGT 4105 has a duplicated empty "Rationale:" line (handled).
- CSE 4100, CSE 4200, CSE 4205 have no recommended books; CSE 4205 (Industrial Attachment) has no outline.
- Course Status "GED" appears on some courses; stored as `courseStatus: "ged"`.

## Next up: step 4 (Admin CMS)

- [ ] Install shadcn/ui (dialog, tabs, accordion, form primitives) and Tiptap
- [ ] Admin shell: sidebar groups from the spec (3.2), responsive, lucide icons allowed here
- [ ] Generic list/table + zod-driven form builder with localized-field (EN | বাংলা) control
- [ ] Image Library (reads `lib/generated/asset-manifest.json`) and image/file pickers, Phosphor icon picker
- [ ] Server Actions per content type: validate → requireAdminForAction → sanitize HTML → write → revision → audit → updateTag
- [ ] Modules: Pages, Academics, People, Content, Inbox, Settings (incl. UI labels table), Users, Activity log
- [ ] Dashboard with missing-Bangla count
- [ ] Draft Mode preview, bulk actions, scheduling

## Blocked / waiting on the department

- Emails, phones, office hours, Google Maps embed URL, social links
- Stat values (students, faculty, labs, publications)
- Chairman: name, photo, signature, message (en + bn)
- Program: total credits, intake, eligibility
- Hero image(s) for `public/images/hero/`
- Faculty and staff photos and profiles; lab list; publications
- Bangla copy review by a native speaker (`scripts/seed/content.json`)
- Confirmation of the syllabus source issues listed above
- Vector logo, if one exists

## Environment setup still needed

- `.env.local` from `.env.example` (Firebase web config + service account)
- Create first admin user in Firebase console, then `npm run set-admin -- <email> superAdmin`
- `firebase deploy --only firestore` (rules + indexes); the current deployed test rules expire 2026-11-03
- Then `npm run seed` (first real run)

## Decisions log

- 2026-10-11: Editorial Academic design direction; palette navy/orange/sky from the seal (no green)
- 2026-10-11: Native i18n (root param + proxy rewrite); next-intl rejected
- 2026-10-11: `NEXT_LOCALE` cookie never redirects
- 2026-10-11: Two root layouts, `app/(site)/[locale]` and `app/(admin)/admin`
- 2026-10-11: Static editorial hero by default; slider is an admin variant
- 2026-10-11: lucide only in admin; Phosphor light on the public site
- 2026-10-11: Course content stored structured (CLOs, outline rows, books) rather than one rich-text blob; `courseStatus` (core/elective/ged) is separate from publish `status`
- 2026-10-11: Seed never overwrites existing documents unless `--force`

## Notes

- `app/(site)/[locale]/page.tsx` is a temporary type specimen; replaced in step 5
- `lib/generated/` is gitignored and rebuilt on `predev`/`prebuild`
- Scripts run under tsx as CommonJS: no top-level `await`, wrap in `main()`
- Verify commands: `npm run typecheck`, `npx eslint .`, `npm run build`, `npm run seed -- --dry-run`
