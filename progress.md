# Progress

Session-to-session task tracker for the EBAUB CSE website. The specification is
`public/resources/ebaub_cse_project_specification_prompt.md` (v2). Update this file at the end of every
working session: move items between sections, add dates, note blockers.

## Delivery steps

| Step | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: tokens, fonts, locale routing, cacheComponents, Firebase modules, schemas, asset manifest, brand exports | Done 2026-10-11 (commit 53fa4c9) |
| 2 | Auth: login, session cookie route, proxy, requireAdmin, set-admin script, Firestore rules and indexes | Done 2026-10-11 (commit 53fa4c9) |
| 3 | Seed: `scripts/seed.ts` from `scripts/seed/content.json` + syllabus markdown | Done 2026-10-11; real run wrote 99 docs to `ebaub-cse` (commit 7242496 + 0c9c6d7) |
| 4 | Admin CMS: shell, form builder, image library, pickers, modules, translation-gap widget | Built 2026-10-11; build + authenticated smoke test green; needs a manual browser pass (see below) |
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

## Step 4 (Admin CMS) summary

Built on Radix primitives (`radix-ui`), Tiptap 3, dnd-kit, sonner. shadcn's CLI was skipped because its init overwrites `globals.css`; components are hand-written to the design tokens instead.

- `lib/admin/registry.ts` is the single description of every content type: path, zod schema, field specs, list columns, cache tag, preview path, min role. Adding a content type = one registry entry.
- `lib/admin/fields.ts` field kinds: text, textarea, slug, email, url, number, boolean, date, datetime, select, lstr, lstrarea, lhtml, image, file, icon, tags, list (sortable, or bare image/file items), object, json.
- `components/admin/form/*`: FormBuilder (recursive), LocalizedInput with EN | বাংলা switch and missing-dot, RichTextField (Tiptap, one instance per locale), ImagePicker/FilePicker over the asset manifest, IconPicker (curated Phosphor set in `lib/icons.ts`), Repeatable (dnd-kit), DocumentEditor (status, save, preview via Draft Mode, history/restore, delete, unsaved guard).
- `lib/actions/content.ts`: saveDocument (validate → sanitize lhtml → role rules → revision snapshot (keep 20) → write → audit → updateTag), deleteDocument, bulkSetStatus, bulkDelete, restoreRevision, messages, saveUiLabels. `lib/actions/users.ts`: invite (returns password-setup link), setUserRole, setUserDisabled, revokeUserSessions.
- Routes: `/admin` dashboard (bento stats, translation gaps, recent activity), `/admin/pages/[page]` singletons (home, about, missionVision, chairmanMessage, contact, site, obe), `/admin/content/[collection]` list with search/status/bulk, `/admin/content/[collection]/[id|new]`, `/admin/images`, `/admin/settings/ui-labels`, `/admin/users`, `/admin/activity`, `/admin/inbox`, `/api/draft` + `/api/draft/disable`.
- **Security finding fixed:** under Cache Components the layout and page render in parallel, so a layout-only gate still streams page data for a forged cookie. Every admin page now calls `requireAdmin()` itself; `scripts/smoke-admin.ts` asserts no leak.
- **Firestore bug fixed:** `settings()` guard moved to `globalThis` because Next loads `admin-core.ts` once per bundle.
- Verify: `npx next build`, then `npx next start -p 3100` and `npx tsx scripts/smoke-admin.ts <admin email>` (20 checks).

### Manual browser pass still needed (cannot be scripted here)

- [ ] Log in at `/admin/login` with the real password; forgot-password email
- [ ] Edit Home → change a headline in both locales → Save → Preview opens Draft Mode
- [ ] Reorder hero items / mission cards by drag; add and remove list items
- [ ] Rich text: formatting toolbar, link dialog, switching EN/বাংলা keeps both texts
- [ ] Image picker alt text validation; file picker external https link
- [ ] Create a notice from `/admin/content/notices/new`, publish, bulk unpublish, delete
- [ ] History → Restore
- [ ] Users → Invite (copy setup link), role change, disable
- [ ] Mobile: hamburger morph, staggered overlay links
- [ ] Dark mode on every admin page

## Next up: step 5 (Public site)

- [ ] `app/(site)/[locale]/(public)/layout.tsx`: utility strip (university link, locale switch, theme toggle) + floating glass nav (condenses on scroll, mobile overlay) + editorial footer, all from `settings/site` and `settings/ui`
- [ ] `lib/content/*` cached fetchers per type (`'use cache'`, `cacheLife('max')`, `cacheTag`) honouring Draft Mode for previews
- [ ] Home: editorial split hero (slider variant), bento stats with locale-aware counters, chairman teaser, mission cards, latest notices, events, faculty strip
- [ ] About, Chairman, Academics, Curriculum (8 semester tabs), Course detail, OBE, Faculty list + profile, Research, Notices list + detail (client-side search), Downloads, Events list + detail, Contact (+ form writing to `messages`)
- [ ] Motion: `whileInView` blur-up reveals, stagger, reduced-motion fallback
- [ ] Replace the temporary specimen page; lint rule against string literals in `app/(site)/**`

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

## Environment (done 2026-10-11)

- `.env.local` present (lines 15–19 use `:` instead of `=` and are ignored; harmless)
- Super admin: sweet.csevu@gmail.com (claim verified with `npx tsx scripts/check-admin.ts <email>`)
- Production rules + 4 composite indexes deployed to `ebaub-cse` with `firebase deploy --only firestore`
- `npm run seed` wrote 99 documents; a second run skipped all 99 (idempotent)

## Decisions log

- 2026-10-11: Editorial Academic design direction; palette navy/orange/sky from the seal (no green)
- 2026-10-11: Native i18n (root param + proxy rewrite); next-intl rejected
- 2026-10-11: `NEXT_LOCALE` cookie never redirects
- 2026-10-11: Two root layouts, `app/(site)/[locale]` and `app/(admin)/admin`
- 2026-10-11: Static editorial hero by default; slider is an admin variant
- 2026-10-11: lucide only in admin; Phosphor light on the public site
- 2026-10-11: Course content stored structured (CLOs, outline rows, books) rather than one rich-text blob; `courseStatus` (core/elective/ged) is separate from publish `status`
- 2026-10-11: Seed never overwrites existing documents unless `--force`
- 2026-10-11: OBE framework, program description/eligibility/intake, curriculum and syllabus content are **English only** (user decision). Their `bn` fields stay empty and render the English fallback. Site chrome, page titles and the program's short name/degree remain bilingual.

## Notes

- `app/(site)/[locale]/page.tsx` is a temporary type specimen; replaced in step 5
- `lib/generated/` is gitignored and rebuilt on `predev`/`prebuild`
- Scripts run under tsx as CommonJS: no top-level `await`, wrap in `main()`
- Verify commands: `npm run typecheck`, `npx eslint .`, `npm run build`, `npm run seed -- --dry-run`
