# EBAUB CSE Department Website — Development Specification

**System Role & Objective:**
Act as a senior full-stack engineer and product designer. Build a modern, content-driven website for the **Department of Computer Science and Engineering (CSE), Exim Bank Agricultural University Bangladesh (EBAUB)**.

**Core principle — zero hardcoded copy.** Every piece of visible text on the public site (hero headlines, mission, vision, chairman's message, section headings, button labels, footer text, contact details, SEO metadata) lives in Firestore and is editable from the Admin Panel. The codebase only ships layout, components and a seed script. If a non-technical admin cannot change a sentence from `/admin`, the feature is not done.

---

## ⚙️ PART 0: TECH STACK (pinned to this repository)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.3** (App Router, TypeScript, React 19.2) | Read `node_modules/next/dist/docs/` before coding. Next 16 renames Middleware to **Proxy** (`proxy.ts`). |
| Styling | **Tailwind CSS v4** | CSS-first config: design tokens are declared with `@theme` in `app/globals.css`. There is no `tailwind.config.js`. |
| UI primitives | shadcn/ui (Radix) + `lucide-react` icons | Accessible dialogs, tabs, accordions and forms for both the public site and the admin. |
| Motion | `motion` (Framer Motion) | Subtle reveals only. Respect `prefers-reduced-motion`. |
| Forms & validation | `react-hook-form` + `zod` | One zod schema per content type, shared by the admin forms, Server Actions and the seed script. |
| Rich text | Tiptap editor → stored as sanitized HTML | Sanitize on write (server) with `isomorphic-dompurify`. |
| Auth | **Firebase Authentication** | Email/Password (plus optional Google sign-in restricted to an allowlist). Roles come from **custom claims**. |
| Database | **Cloud Firestore** (`asia-southeast1`, already set in `firebase.json`) | Free **Spark plan**, no billing account. |
| Images & files | **Static assets in `public/`** | No Firebase Storage (it needs the Blaze plan). Images live in `public/images/**` and are added by a developer commit. PDFs go in `public/files/**` or are linked externally (see Part 4). |
| Server SDK | `firebase-admin` | Used only in server code (`import 'server-only'`). Works on the Spark plan. |
| Caching | Next 16 **Cache Components** (`cacheComponents: true`, `'use cache'`, `cacheTag`, `updateTag`) | Public pages are cached; admin saves invalidate exactly the affected tags. |
| Hosting | **Vercel** (recommended) | Native support for every Next 16 feature used here, with no credit card required. Firebase App Hosting and Cloud Functions both need the Blaze plan. Keep the code host-agnostic so moving to Firebase App Hosting later needs only config changes. |

> **Spark-plan constraints (no billing):** no Storage, no Cloud Functions, no App Hosting. Firestore free quota is 50K reads, 20K writes and 20K deletes per day and 1 GiB stored, which is plenty for a department site when public pages are cached. Never read Firestore from the browser on public pages; every visitor request must hit the Next.js cache, not Firestore.

---

## 🎨 PART 1: DESIGN SYSTEM

A modern academic look: calm, typographic and confident, more like a good research-lab site than a generic university template.

* **Palette (as `@theme` tokens):** deep academic navy (primary), an EBAUB green accent drawn from the logo (`public/resources/EBAUB_CSE_LOGO_transparent.png`), warm off-white surfaces, slate neutrals. Full **dark mode** using the same tokens.
* **Typography:** a geometric sans for headings (e.g. *Plus Jakarta Sans* or *Geist*), a readable sans for body copy, a mono for code and course codes. Load with `next/font`. Use a fluid type scale (`clamp()`).
* **Layout:** 12-column grid, generous whitespace, bento-style cards for stats and highlights, max content width ~1280px.
* **Components:** soft 1px borders, restrained shadows, `rounded-2xl` cards, glassy sticky navbar that condenses on scroll.
* **Motion:** fade/slide-in on scroll, animated stat counters, hover lift on cards. Nothing autoplaying that blocks content.
* **Accessibility:** WCAG 2.2 AA contrast, full keyboard navigation, visible focus rings, semantic landmarks, `alt` text required on every image reference (enforced by the admin form).
* **Performance budget:** Lighthouse ≥ 90 in all categories. `next/image` everywhere (it generates responsive sizes for the static images). Source images should be ≤ 2400px wide and ideally WebP or AVIF.

---

## 🏛️ PART 2: PUBLIC SITE (all copy loaded from Firestore)

Every section can be **shown/hidden and reordered** from the admin (`pages/home.sections[]`). Section headings and subheadings are content fields, not code.

### 1. Home (`/`)
* **Hero:** slider of admin-managed slides (image, headline, subtext, CTA label + link). Default CTA: "Explore B.Sc. in CSE".
* **At a glance:** stat counters (students, faculty, labs, publications). Values and labels are editable.
* **Message from the Chairman (teaser):** photo, name, designation, a short excerpt, and a "Read full message" link.
* **Mission & Vision:** department vision statement plus mission cards (PM1–PM4), each with a title, body and optional icon.
* **Latest Notices:** the 5 newest notices; pinned and urgent ones first.
* **News & Events:** carousel of upcoming and recent items.
* **Faculty highlight:** a rotating strip of faculty cards linking to `/faculty`.
* **Footer:** logo, address (Chapai Nawabganj, Bangladesh), emails, phones, quick links, social icons (LinkedIn, Facebook, YouTube). All of it comes from `settings/site`.

### 2. About (`/about`)
* Department overview (rich text), history timeline (editable entries).
* **Vision & Mission:** full statements of both the university and the department, plus the department's objectives.
* **Chairman's Message (`/about/chairman`):** full rich-text message, photo, digital signature image, name, designation, effective date.

### 3. Academics (`/academics`)
* **Programs:** program cards (initially the B.Sc. in CSE). Name, duration, total credits, intake, eligibility and description are all editable. Do not hardcode the credit count.
* **Curriculum (`/academics/curriculum`):** 8-semester view (4 years × 2) with tabs or an accordion. Course code, title, credit, type (theory/lab), prerequisites. Includes a downloadable curriculum PDF.
* **Course detail (`/academics/courses/[code]`):** rationale, content, CLOs, CLO–PO mapping, references.
* **OBE Framework (`/academics/obe`):** Graduate Attributes, PEOs (PEO1–5), POs (PO1–12), Washington Accord knowledge profile (WK), and a PEO↔PM mapping matrix, laid out to support BAETE accreditation.
* Seed all of this from `public/resources/Curriculum V2.md` and `Syllabus V2 __ Final.md`.

### 4. Faculty & Staff (`/faculty`, `/faculty/[slug]`)
* Filterable grid (designation, research area). Profile pages show photo, designation, education, research interests, publications, Google Scholar / ORCID / ResearchGate links, email, office and room number.
* Separate officers/staff list.

### 5. Research & Labs (`/research`)
* Research areas, lab cards (name, description, equipment, photo, in-charge), and a publications list filterable by year and faculty member.

### 6. Notices & Downloads (`/notices`, `/notices/[id]`)
* Categorized, filterable and searchable list (Academic, Exam, Admission, Events, General; categories are editable). Paginated.
* Detail page: full rich text, attachments (static PDFs or external links, e.g. Google Drive), publish date, "pinned" and "urgent" badges.
* **Downloads (`/downloads`):** forms, routines, syllabus and curriculum PDFs grouped by category.

### 7. News & Events (`/events`, `/events/[slug]`)
* Upcoming and past tabs, cover image, date/time, venue, rich-text body, photo gallery for each event.

### 8. Contact (`/contact`)
* Address, map embed URL, phone numbers, emails, office hours, all from `settings/site`. Optional contact form that writes to a `messages` collection the admin can read.

> **Removed from scope:** Student Life, Clubs, Official Groups and Alumni pages.

**Every public page** uses `generateMetadata`, reading its title, description and OG image from that page's `seo` field in Firestore.

---

## 🔒 PART 3: ADMIN PANEL — the CMS for the whole site

The admin panel at `/admin` is the single place where all content is managed. It should feel like a lightweight headless CMS.

### 3.1 Authentication & Authorization (Firebase Auth)
1. **Sign-in (`/admin/login`):** Firebase Auth client SDK (Email/Password; optional Google sign-in). Also provides "Forgot password" (`sendPasswordResetEmail`).
2. **Session:** after sign-in the client sends the ID token to a Route Handler (`app/api/auth/session/route.ts`). The handler verifies it with `firebase-admin` and sets an **HTTP-only, Secure, SameSite=Strict session cookie** (`createSessionCookie`, 5–14 days). Sign-out revokes the token and clears the cookie.
3. **Proxy (`proxy.ts`, project root):** an optimistic check only. Requests to `/admin/*` (except `/admin/login`) without a session cookie are redirected to `/admin/login`. Per the Next 16 docs, Proxy is not the authorization layer.
4. **Real check:** `app/admin/(protected)/layout.tsx` and **every Server Action** call `requireAdmin(role?)`. That helper runs `verifySessionCookie(cookie, true)` and checks custom claims.
5. **Roles (custom claims):**
   * `superAdmin`: everything, including user management and site settings.
   * `editor`: create, edit and publish content; no user management.
   * `contributor` (optional): create drafts only; an editor must publish.
6. **First super admin:** bootstrapped with a one-off script (`scripts/set-admin.ts`) that sets the claim through the Admin SDK. After that, super admins invite users from the UI.
7. **Firestore security rules** enforce the same roles (`request.auth.token.role`). The public can read only `status == "published"` documents; only authenticated roles can write. Replace the current open test rules in `firestore.rules` (they expire 2026-11-03).

### 3.2 Admin Information Architecture

Sidebar groups:

| Group | Modules |
| --- | --- |
| **Dashboard** | Stats (notices, events, faculty, drafts), recent activity, quick actions ("New notice", "New event") |
| **Pages** | Home (hero slides, stats, section order/visibility), About, Chairman's Message, Mission & Vision, Contact |
| **Academics** | Programs, Curriculum & Courses, OBE (GAs, PEOs, POs, WKs, mappings) |
| **People** | Faculty, Staff, Chairman assignment |
| **Content** | Notices, Events & News, Downloads, Research areas, Labs, Publications |
| **Inbox** | Contact-form messages |
| **Image Library** | Read-only browser of the static images in `public/images/**`, with folder filter, search, preview and "copy path" |
| **Settings** | Site identity (name, logo, favicon), contact info, social links, navigation menu editor, footer, UI labels, default SEO |
| **Users** *(superAdmin)* | Invite, assign role, disable, revoke sessions |
| **Activity Log** | Who changed what, and when |

### 3.3 Editing Experience
* **Typed forms, not raw JSON.** Each content type has a form generated from its zod schema: text inputs, a Tiptap rich-text editor, image pickers backed by the Image Library, repeatable lists with drag-to-reorder (e.g. mission items, hero slides, curriculum courses).
* **Image picker (no uploads):** opens a grid of images from the static manifest, filtered by the relevant folder (e.g. `faculty/` for a faculty photo). The admin picks one and must enter alt text. Only the path and alt text are saved to Firestore. A broken or missing path shows a warning in the form.
* **Attachments (no uploads):** the admin either picks a PDF from `public/files/**` (also in the manifest) or pastes an external link (e.g. a Google Drive "anyone with the link" URL). External links are validated as `https://`.
* **Draft → Published workflow:** every document has `status: "draft" | "published"`. "Preview" opens the public page in Next.js **Draft Mode** to show unpublished content.
* **Live validation** with inline errors; unsaved-changes guard on navigation.
* **Version history:** each save stores a snapshot in a `revisions` subcollection, with one-click restore (keep the last 20).
* **Bulk actions:** publish/unpublish/delete several notices or events at once.
* **Scheduling:** `publishAt` on notices and events (the public query filters `publishAt <= now`).
* **Cache invalidation:** each Server Action calls `updateTag('<type>')` / `updateTag('<type>:<id>')` after writing, so changes appear on the public site immediately.
* **Responsive admin:** usable on a tablet; core actions (post a notice) work on a phone.
* **Audit:** every write appends to `auditLogs` (uid, action, collection, docId, timestamp, diff summary).

### 3.4 UI Labels / i18n-ready strings
Short interface strings (nav items, button labels such as "Read more", empty states, footer headings) live in `settings/ui` as a key–value map and are edited in **Settings → UI Labels**. Keep the structure `{ en: {...} }` so a Bangla (`bn`) locale can be added later without schema changes.

---

## 🗄️ PART 4: FIRESTORE DATA MODEL

Conventions: every document has `status`, `createdAt`, `updatedAt`, `updatedBy` (uid), and `order` (number) where lists are sortable. Rich text is sanitized HTML.

**Image references** are stored as `{ src, alt }`. `src` is a site-relative path such as `/images/faculty/jane-doe.webp`. Width and height are read from the generated manifest at render time, not stored. This shape lets a CDN or Firebase Storage be added later by allowing `https://` values in `src`, with no data migration.

**File references** are stored as `{ name, href, kind: "static" | "external" }`, for example `/files/routines/fall-2026.pdf` or a Google Drive link.

**Static asset layout** (images provided by the department and committed to the repo):
```
public/images/
  brand/      logo, favicon, OG image
  hero/       home slider images
  chairman/   photo, signature (transparent PNG)
  faculty/    one photo per member, named by slug
  staff/
  events/     <event-slug>/cover.webp, <event-slug>/01.webp …
  labs/
  about/
public/files/ curriculum, syllabus, forms, routines (PDF)
```
`scripts/generate-asset-manifest.ts` runs on `predev` and `prebuild`. It scans `public/images` and `public/files` and writes `lib/generated/asset-manifest.json` with each asset's path, folder, width, height and size (via `image-size`). Both the admin pickers and `next/image` use it.

**Adding a new image** = drop the file in the right folder, commit and push. Vercel redeploys automatically, and the image then appears in the admin picker.

### Singleton documents (site-wide copy)
| Path | Key fields |
| --- | --- |
| `settings/site` | `name`, `shortName`, `tagline`, `logo`, `favicon`, `address`, `emails[]`, `phones[]`, `officeHours`, `mapEmbedUrl`, `socials{facebook, linkedin, youtube}`, `nav[] {label, href, children[]}`, `footer{about, columns[]}`, `defaultSeo` |
| `settings/ui` | `en { key: string }` |
| `pages/home` | `hero[] {image, headline, subtext, ctaLabel, ctaHref}`, `stats[] {label, value, suffix}`, `sections[] {key, visible, heading, subheading}`, `seo` |
| `pages/about` | `overview` (html), `history[] {year, title, text}`, `seo` |
| `pages/missionVision` | `universityVision`, `universityMission[] {code, text}`, `deptVision`, `deptMission[] {code, title, text, icon}`, `objectives[] {title, text}` |
| `pages/chairmanMessage` | `facultyRef`, `name`, `designation`, `photo`, `signature`, `excerpt`, `message` (html), `effectiveFrom`, `seo` |
| `pages/contact` | `intro`, `formEnabled`, `seo` |
| `obe/framework` | `graduateAttributes[]`, `peos[] {code, title, text}`, `pos[] {code, title, text}`, `wks[] {code, text}`, `peoPmMap{}`, `poPeoMap{}` |

### Collections
| Collection | Key fields |
| --- | --- |
| `programs` | `name`, `slug`, `degree`, `durationYears`, `totalCredits`, `intake`, `eligibility`, `description`, `curriculumPdf` |
| `courses` | `code`, `title`, `credit`, `type` (`theory`/`lab`), `semester` (1–8), `programId`, `prerequisites[]`, `rationale`, `content`, `clos[] {code, text, poMap[]}`, `references[]` |
| `faculty` | `name`, `slug`, `designation`, `photo`, `email`, `phone`, `office`, `education[]`, `researchInterests[]`, `bio` (html), `links{scholar, orcid, researchgate, website}`, `isChairman`, `order` |
| `staff` | `name`, `designation`, `photo`, `email`, `phone`, `order` |
| `notices` | `title`, `slug`, `category`, `content` (html), `attachments[]` (file refs), `pinned`, `urgent`, `publishAt` |
| `noticeCategories` | `name`, `slug`, `order` |
| `events` | `title`, `slug`, `type` (`event`/`news`), `startAt`, `endAt`, `venue`, `cover`, `excerpt`, `body` (html), `gallery[]` |
| `downloads` | `title`, `category`, `file`, `order` |
| `researchAreas` | `title`, `description`, `icon` |
| `labs` | `name`, `description`, `photo`, `equipment[]`, `inChargeRef` |
| `publications` | `title`, `authors[]`, `facultyRefs[]`, `venue`, `year`, `doi`, `url` |
| `messages` | `name`, `email`, `subject`, `body`, `read` (public create only, admin read) |
| `users` | `uid`, `email`, `displayName`, `role`, `disabled`, `lastLoginAt` (mirror of Auth plus claims) |
| `auditLogs` | `uid`, `action`, `collection`, `docId`, `summary`, `at` |
| `{any}/{id}/revisions` | full snapshot, `savedBy`, `savedAt` |

Add composite indexes to `firestore.indexes.json` for `notices (status, category, publishAt desc)`, `events (status, startAt)` and `courses (programId, semester, order)`.

---

## 🧱 PART 5: ARCHITECTURE

```
app/
  (public)/
    layout.tsx            # Navbar + Footer (data from settings/site)
    page.tsx              # Home
    about/ page.tsx  chairman/page.tsx
    academics/ page.tsx  curriculum/page.tsx  obe/page.tsx  courses/[code]/page.tsx
    faculty/ page.tsx  [slug]/page.tsx
    research/page.tsx
    notices/ page.tsx  [id]/page.tsx
    downloads/page.tsx
    events/ page.tsx  [slug]/page.tsx
    contact/page.tsx
  admin/
    login/page.tsx
    (protected)/
      layout.tsx          # requireAdmin() + sidebar shell
      page.tsx            # Dashboard
      pages/[page]/page.tsx
      academics/…  people/…  content/[collection]/…  images/  settings/  users/  activity/
  api/auth/session/route.ts
lib/
  generated/asset-manifest.json   # built by scripts/generate-asset-manifest.ts (gitignored)
  firebase/client.ts      # client SDK init (NEXT_PUBLIC_ env)
  firebase/admin.ts       # Admin SDK init, 'server-only'
  auth/require-admin.ts
  content/                # typed fetchers: getSiteSettings(), getHomePage(), getNotices()… ('use cache' + cacheTag)
  schemas/                # zod schemas (single source of truth)
  actions/                # Server Actions per content type (validate → requireAdmin → write → revision → audit → updateTag)
components/ ui/ public/ admin/
scripts/ seed.ts  set-admin.ts  generate-asset-manifest.ts
proxy.ts
```

* **Reads:** public pages are Server Components that call `lib/content/*` (Admin SDK, cached with `'use cache'` and `cacheTag`). No Firestore client SDK on public pages, so no API keys are needed to render content.
* **Writes:** only through Server Actions, which always run `requireAdmin` first. There are no file uploads; image and file fields store references to static assets or external links.
* **Environment:** `NEXT_PUBLIC_FIREBASE_*` for the client (Auth only); `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (service-account key, set as Vercel environment variables) for the Admin SDK. Commit `.env.example`; never commit `.env.local`.
* **Fallbacks:** if a content document is missing, render the section's skeleton or hide it. Never fall back to hardcoded copy.

---

## 🚀 PART 6: DELIVERY PLAN

1. **Foundation:** install dependencies, set Tailwind v4 `@theme` tokens, `next/font`, enable `cacheComponents`, Firebase client and admin modules, zod schemas, static folder layout and asset-manifest script.
2. **Auth:** login page, session cookie route, `proxy.ts`, `requireAdmin`, `set-admin` script, Firestore rules.
3. **Seed:** `scripts/seed.ts` populates every singleton and collection with real content from `Curriculum V2.md` and `Syllabus V2 __ Final.md` (vision, missions, PEOs, POs, courses) plus placeholders for the rest.
4. **Admin CMS:** shell and sidebar, generic list/table and form builder, Image Library and pickers, then each module.
5. **Public site:** layout, Home, About and Chairman, Academics and OBE, Faculty, Notices, Events, Research, Downloads, Contact.
6. **Polish:** SEO (`generateMetadata`, `sitemap.ts`, `robots.ts`, OG images), accessibility audit, Lighthouse pass, error and empty states, `not-found.tsx`.
7. **Deploy:** connect the GitHub repo to Vercel, set environment variables, deploy Firestore rules and indexes with `firebase deploy --only firestore` (works on Spark), add the Vercel domain to Firebase Auth → Authorized domains, create the first super admin.

**Future upgrade path (once billing is available):** enable Firebase Storage and add an upload button to the image picker that writes `https://` URLs into the same `{ src, alt }` field. Optionally move hosting to Firebase App Hosting. No schema changes are needed.

**Acceptance criteria**
* Changing any visible sentence (including the chairman's message, mission, vision, nav labels and footer) in `/admin` updates the public page on the next request, with no redeploy.
* An unauthenticated user cannot reach `/admin/*` or invoke any Server Action. An `editor` cannot reach Users.
* Firestore rules reject direct client writes from non-admins (verify with the Firebase Emulator Suite).
* No hardcoded user-facing copy in `app/(public)/**` (lint check: no string literals in JSX outside `components/ui`).

**Action required:** Start with step 1 and step 2. Output the dependency install commands, `app/globals.css` theme tokens, `lib/firebase/client.ts`, `lib/firebase/admin.ts`, `lib/auth/require-admin.ts`, `app/api/auth/session/route.ts`, `proxy.ts`, the zod schemas for `settings/site`, `pages/home`, `pages/missionVision` and `pages/chairmanMessage`, `scripts/generate-asset-manifest.ts`, and production-ready `firestore.rules`.
