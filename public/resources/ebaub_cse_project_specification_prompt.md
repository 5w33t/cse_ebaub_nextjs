# EBAUB CSE Department Website — Development Specification (v2)

**System Role & Objective:**
Act as a senior full-stack engineer and product designer. Build a modern, bilingual (English + Bangla), content-driven website for the **Department of Computer Science and Engineering (CSE), Exim Bank Agricultural University Bangladesh (EBAUB)**. The site must read as a serious academic institution: calm, typographic, confident, closer to a research-institute site than a generic university template.

**Core principle — zero hardcoded copy.** Every piece of visible text on the public site (hero headlines, mission, vision, chairman's message, section headings, button labels, footer text, contact details, SEO metadata) lives in Firestore **in both locales** and is editable from the Admin Panel. The codebase only ships layout, components and a seed script. If a non-technical admin cannot change a sentence in English *and* Bangla from `/admin`, the feature is not done.

**Non-negotiables (decided, do not re-open):**
1. Bilingual from day one: `en` (default) and `bn`. Localized fields use the shape `{ en, bn }`.
2. Light and dark theme with a three-state toggle (light / dark / system), no flash on load.
3. Design direction: *Editorial Academic* (see Part 1). Serif display + grotesk UI, warm paper surfaces in light, navy-tinted dark.
4. Palette is derived from the actual logo: **navy, orange, sky blue**. There is no green.
5. No hero slider by default. Static editorial hero; slider is an admin-selectable variant.

---

## ⚙️ PART 0: TECH STACK (pinned to this repository)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.3** (App Router, TypeScript, React 19.2) | Read `node_modules/next/dist/docs/` before coding. Next 16 renames Middleware to **Proxy** (`proxy.ts`). |
| Styling | **Tailwind CSS v4** | CSS-first config: design tokens are declared with `@theme` in `app/globals.css`. There is no `tailwind.config.js`. Dark mode via `@custom-variant dark (&:where(.dark, .dark *))`. |
| Theme switching | `next-themes` | `attribute="class"`, `enableSystem`, `disableTransitionOnChange`. Its inline script sets the class before paint, so public pages stay fully cacheable (no theme cookie read on the server). `<html suppressHydrationWarning>`. |
| i18n | **Native** (no library): `app/(site)/[locale]/…` root segment + `next/root-params` + `proxy.ts` rewrites | Locales `en` (default, unprefixed; `/en/...` is 308-redirected to the canonical unprefixed path) and `bn` (`/bn/...`). `proxy.ts` rewrites unprefixed paths to `/en/...` internally. The `NEXT_LOCALE` cookie only records the last choice; it never triggers a redirect (that would loop when switching back to English). UI strings come from Firestore `settings/ui` through `lib/i18n/t.ts` (`pick`, `makeT`, `formatNumber`, `formatDate`). `next-intl` was rejected to avoid a Cache Components compatibility risk for features the site does not need. |
| UI primitives | shadcn/ui (Radix) | Accessible dialogs, tabs, accordions and forms. shadcn installs `lucide-react`; **lucide is used in the admin only.** |
| Icons (public site) | `@phosphor-icons/react`, `weight="light"` (or `"thin"` for decorative) | Thin precise lines. Never thick-stroked icons on the public site. The admin icon picker exposes a curated allowlist of Phosphor icon names. |
| Motion | `motion` (Framer Motion) | Viewport reveals with `whileInView`, custom easing tokens only. Respect `prefers-reduced-motion`. |
| Forms & validation | `react-hook-form` + `zod` | One zod schema per content type, shared by the admin forms, Server Actions and the seed script. |
| Rich text | Tiptap editor → stored as sanitized HTML, one editor instance per locale | Sanitize on write (server) with `isomorphic-dompurify`. **Strip inline `style`, `color`, `bgcolor` and `font` attributes** so content respects the theme. |
| Auth | **Firebase Authentication** | Email/Password (plus optional Google sign-in restricted to an allowlist). Roles come from **custom claims**. |
| Database | **Cloud Firestore** (`asia-southeast1`, already set in `firebase.json`) | Free **Spark plan**, no billing account. |
| Images & files | **Static assets in `public/`** | No Firebase Storage (needs Blaze). Images live in `public/images/**` and are added by a developer commit. PDFs go in `public/files/**` or are linked externally. |
| Server SDK | `firebase-admin` | Used only in server code (`import 'server-only'`). Works on the Spark plan. |
| Caching | Next 16 **Cache Components** (`cacheComponents: true`, `'use cache'`, `cacheTag`, `updateTag`) | Public pages are cached; admin saves invalidate exactly the affected tags. **Cache tags are locale-agnostic; the locale is part of the cached function's arguments.** |
| Hosting | **Vercel** | Native support for every Next 16 feature used here, no credit card required. Keep the code host-agnostic. |

> **Spark-plan constraints (no billing):** no Storage, no Cloud Functions, no App Hosting. Firestore free quota is 50K reads, 20K writes and 20K deletes per day and 1 GiB stored, which is plenty when public pages are cached. Never read Firestore from the browser on public pages; every visitor request must hit the Next.js cache, not Firestore.

---

## 🎨 PART 1: DESIGN SYSTEM — "Editorial Academic"

The page should feel like a well-set university press publication that happens to be interactive. Large serif headlines, generous margins, paper-like surfaces, hairline rules, and restrained motion with physical easing. Nothing glows, nothing bounces, nothing is pure black.

### 1.1 Palette (declared as `@theme` tokens in `app/globals.css`)

Derived from `public/resources/EBAUB_CSE_LOGO_transparent.png` (navy ring and text, orange and sky-blue quadrants).

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--color-navy-950` | `#07172A` | — | Dark-mode page background base |
| `--color-navy-900` | `#0B2A47` | — | Dark-mode surfaces, light-mode hero bands |
| `--color-navy-800` | `#0F3D63` | — | **Primary** (buttons, links on paper, nav text) |
| `--color-navy-700` | `#164E80` | — | Primary hover |
| `--color-orange-500` | `#F58220` | — | **Accent fill** (badges, CTA fills with navy text, urgent markers, underline flourishes). Never for small text on light surfaces. |
| `--color-orange-700` | `#A8480A` | — | Text-safe accent for small text/links on paper (verify ≥ 4.5:1) |
| `--color-sky-500` | `#1B9BCC` | — | Secondary (info badges, link hover, data accents) |
| `--color-sky-700` | `#0E6E96` | — | Text-safe secondary on paper |
| `--color-paper` | `#FBF9F5` | `#07111F` | Page background |
| `--color-paper-2` | `#F4F0E8` | `#0C1A2E` | Section bands, card shells |
| `--color-surface` | `#FFFFFF` | `#122439` | Card cores, inputs |
| `--color-ink` | `#0E1726` | `#E9EEF5` | Body text |
| `--color-ink-muted` | `#5B6779` | `#9AAABF` | Secondary text |
| `--color-hairline` | `rgb(14 23 38 / 0.08)` | `rgb(233 238 245 / 0.10)` | Borders and rules |

Semantic aliases (`--color-background`, `--color-foreground`, `--color-primary`, `--color-accent`, `--color-muted`, `--color-border`) are set on `:root` and overridden under `.dark`. Components only ever use semantic aliases.

**Contrast rule:** every text/background token pair must pass WCAG 2.2 AA in both themes. Orange is a fill colour and a large-display colour only; small orange text uses `orange-700`. Dark mode is navy-tinted, never neutral grey and never `#000`.

### 1.2 Typography (loaded with `next/font`, fluid `clamp()` scale)

| Role | Latin | Bengali | Notes |
| --- | --- | --- | --- |
| Display / headings | **Fraunces** (variable, `opsz` axis, weights 300–600) | **Tiro Bangla** | Serif display is what makes it read "academic". Headline weight 400–500, tight line-height (1.05–1.15) for Latin, 1.3 for Bangla. |
| Body / UI | **Geist Sans** (`geist` package) | **Noto Sans Bengali** (variable) | Body 16px Latin, **17px Bangla**, line-height 1.6 Latin / **1.75 Bangla**. |
| Mono | **Geist Mono** | — | Course codes, credits, code snippets. Course codes are always Latin. |

Font stacks are per-locale CSS variables: `--font-display`, `--font-sans`, `--font-mono`, each with the Bengali face appended so mixed-script lines (course titles with Bangla descriptions) render correctly. `html[lang="bn"]` switches the primary face, bumps body size and line-height, and **disables letter-spacing and uppercase transforms** (Bangla has neither). Eyebrow labels in Bangla use weight and colour instead of tracking.

Numerals: when the locale is `bn`, numbers and dates are formatted with `Intl.NumberFormat('bn-BD')` / `Intl.DateTimeFormat('bn-BD')` (Bangla digits). `settings/site.useBanglaDigits` (default `true`) lets the admin turn this off. Animated counters must format the running value through the same formatter.

### 1.3 Layout archetypes

* **Container:** max content width `1280px`, 12-column grid, outer gutters `px-4` (mobile) → `px-8` (desktop).
* **Macro whitespace:** sections `py-24 md:py-32`. Section header block (eyebrow + H2 + lede) sits in a 7/12 column, never centred across the full width.
* **Home hero: Editorial Split.** Left 6–7 columns: eyebrow, large Fraunces headline (fluid, up to ~72px), lede, two CTAs. Right 5–6 columns: one image in a double-bezel frame, slightly offset upward. Below `md:` it stacks, text first.
* **Stats: Asymmetrical Bento.** Four stat tiles with unequal spans (e.g. one `col-span-6`, three `col-span-2`) on `lg:`; single column on mobile.
* **Lists (faculty, notices, events, publications):** editorial lists and 2-up / 3-up grids with wide gaps (`gap-8`+), never equal-height three-column rows glued together.
* **Utility strip + floating nav:** a slim top strip (university link, language switch, theme toggle) and, beneath it, a **detached floating glass bar** (`mt-4`, `mx-auto`, `max-w-7xl`, `rounded-full`, hairline border, `backdrop-blur-xl`) that condenses in height on scroll. On mobile the bar opens a full-screen blurred overlay; the hamburger morphs into an X; links reveal with a staggered rise.
* **Footer:** four-column editorial footer on a `paper-2` band with the monochrome logo, university affiliation line and link to the main EBAUB site.

### 1.4 Component language

* **Double-bezel cards.** Every card, image frame and feature tile is nested: an outer shell (`bg-paper-2`, `ring-1 ring-hairline`, `p-1.5`, `rounded-[1.75rem]`) and an inner core (`bg-surface`, inset top highlight, `rounded-[calc(1.75rem-0.375rem)]`). Hairlines use the `hairline` token; never generic grey `border`.
* **Shadows.** Only large, very diffuse, navy-tinted ambient shadows (e.g. `0 24px 60px -24px rgb(11 42 71 / 0.18)`), and only on hover/elevated states. No `shadow-md`, no dark drop shadows.
* **Buttons.** Primary: navy pill (`rounded-full px-6 py-3`), trailing arrow nested in its own circle (`size-8 rounded-full bg-white/10`). Secondary: hairline pill on paper. Accent: orange fill with navy text (large CTAs only). Pressed state scales to `0.98`; hover nudges the inner icon diagonally.
* **Eyebrow tags.** `rounded-full px-3 py-1 text-[11px] font-medium` with `uppercase tracking-[0.18em]` for Latin only.
* **Badges.** Notice categories: hairline pills. `urgent`: orange fill with navy text. `pinned`: sky outline.
* **Images.** `next/image` everywhere, always inside a double-bezel frame with `rounded-[1.5rem]`. Faculty portraits use a 4:5 ratio.
* **Signature & logo in dark mode.** `pages/chairmanMessage.signatureDark` is an optional second image; if absent, the signature gets `dark:invert dark:brightness-200`. The header uses `brand/logo.svg` (light) and `brand/logo-dark.svg` (dark); the footer uses `brand/logo-mono.svg`.
* **Grain.** A fixed, `pointer-events-none` noise overlay at `opacity-[0.035]` (light) / `opacity-[0.05]` (dark).

### 1.5 Motion

Tokens in `@theme`: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-spring: cubic-bezier(0.32, 0.72, 0, 1)`, durations 500 / 700 / 900 ms. **No `linear`, no `ease-in-out`.**

* **Reveals:** sections and cards enter with `opacity 0 → 1`, `translateY 24px → 0`, `blur 6px → 0` over ~800 ms, children staggered by 60–90 ms. Implemented with `whileInView` (`once: true`, margin `-10%`). Never `window.addEventListener('scroll')`.
* **Counters:** count up on first view, formatted per locale.
* **Hover:** cards lift 4px with the ambient shadow; images scale `1.02` inside their frame.
* **Nav:** height and blur interpolate on scroll; mobile menu links stagger in.
* **Performance:** animate `transform` and `opacity` only. `backdrop-blur` only on the fixed nav and overlays. `will-change` only while animating.
* **Reduced motion:** all reveals collapse to opacity-only, counters render the final value.

### 1.6 Accessibility & performance

* WCAG 2.2 AA in both themes and both locales. Visible focus rings (2px sky offset ring). Semantic landmarks. Skip link.
* `lang` attribute per locale on `<html>`; language switch preserves the current path.
* `alt` text required for every image reference, in both locales (enforced by the admin form).
* Lighthouse ≥ 90 in all categories on Home, Faculty, Notices, Curriculum in both locales.
* `next/image` with the manifest's intrinsic dimensions. Source images ≤ 2400px wide, WebP or AVIF.
* Fonts: `display: swap`, subsets `latin` and `bengali`, preloaded for the active locale only.

---

## 🏛️ PART 2: PUBLIC SITE (all copy loaded from Firestore, both locales)

Routes live under `app/(site)/[locale]/…`. English has no prefix; Bangla is `/bn/...`. Every section can be **shown/hidden and reordered** from the admin (`pages/home.sections[]`). Section headings and subheadings are localized content fields, not code.

### 1. Home (`/`)
* **Hero:** `pages/home.heroVariant` is `"editorial"` (default) or `"slider"`. Editorial renders the first item of `hero[]` as the static split hero; the remaining items (if any) render as a row of "spotlight" cards below. Slider renders `hero[]` as an accessible, pausable carousel. Default CTA: "Explore B.Sc. in CSE".
* **At a glance:** bento stat tiles (students, faculty, labs, publications). Values and labels editable; values formatted per locale.
* **Message from the Chairman (teaser):** photo, name, designation, a short excerpt, "Read full message".
* **Mission & Vision:** department vision statement plus mission cards (PM1–PM4), each with title, body and an optional Phosphor icon name.
* **Latest Notices:** the 5 newest; pinned and urgent first.
* **News & Events:** upcoming and recent items as an editorial list with cover thumbnails.
* **Faculty highlight:** a horizontally scrollable strip of faculty cards linking to `/faculty`.
* **Footer:** logo, address (Chapai Nawabganj, Bangladesh), emails, phones, quick links, social icons (LinkedIn, Facebook, YouTube), university affiliation line and EBAUB link. All from `settings/site`.

### 2. About (`/about`)
* Department overview (rich text), history timeline (editable entries).
* **Vision & Mission:** full statements of both the university and the department, plus the department's objectives.
* **Chairman's Message (`/about/chairman`):** full rich-text message, photo, digital signature image (plus optional dark variant), name, designation, effective date.

### 3. Academics (`/academics`)
* **Programs:** program cards (initially the B.Sc. in CSE). Name, duration, total credits, intake, eligibility and description are all editable. Do not hardcode the credit count.
* **Curriculum (`/academics/curriculum`):** 8-semester view (4 years × 2) with tabs. Course code (mono), title, credit, type (theory/lab), prerequisites. Downloadable curriculum PDF.
* **Course detail (`/academics/courses/[code]`):** rationale, content, CLOs, CLO–PO mapping, references.
* **OBE Framework (`/academics/obe`):** Graduate Attributes, PEOs (PEO1–5), POs (PO1–12), Washington Accord knowledge profile (WK), and a PEO↔PM mapping matrix, laid out to support BAETE accreditation.
* Seed all of this from `public/resources/Curriculum V2.md` and `Syllabus V2 __ Final.md`. These sources are English only; Bangla fields for course content may remain empty (English fallback) at launch, but program names, section headings and labels must be seeded in both locales.

### 4. Faculty & Staff (`/faculty`, `/faculty/[slug]`)
* Filterable grid (designation, research area). Profile pages show photo, designation, education, research interests, publications, Google Scholar / ORCID / ResearchGate links, email, office and room number.
* Separate officers/staff list.

### 5. Research & Labs (`/research`)
* Research areas, lab cards (name, description, equipment, photo, in-charge), and a publications list filterable by year and faculty member.

### 6. Notices & Downloads (`/notices`, `/notices/[id]`)
* Categorized, filterable and searchable list (Academic, Exam, Admission, Events, General; categories are editable and localized). Paginated. **Search is a client-side filter over the cached, published list** (Firestore has no full-text search); it matches both `en` and `bn` titles.
* Detail page: full rich text, attachments (static PDFs or external links), publish date, "pinned" and "urgent" badges.
* **Downloads (`/downloads`):** forms, routines, syllabus and curriculum PDFs grouped by category.

### 7. News & Events (`/events`, `/events/[slug]`)
* Upcoming and past tabs, cover image, date/time, venue, rich-text body, photo gallery for each event.

### 8. Contact (`/contact`)
* Address, map embed URL, phone numbers, emails, office hours, all from `settings/site`. Optional contact form writing to `messages`. Map embed is wrapped in a double-bezel frame; in dark mode it is dimmed with a `brightness-90 contrast-110` filter.

> **Removed from scope:** Student Life, Clubs, Official Groups and Alumni pages.

**Every public page** uses `generateMetadata`, reading its localized title, description and OG image from that page's `seo` field, and emits `alternates.languages` (`hreflang`) for `en`, `bn` and `x-default`. `sitemap.ts` lists both locales with alternates.

**Fallback rule:** if a `bn` field is empty, render the `en` value. Never render an empty string, a raw key, or a hardcoded string.

---

## 🔒 PART 3: ADMIN PANEL — the CMS for the whole site

The admin panel at `/admin` (English UI only, no locale prefix) is the single place where all content is managed. It should feel like a lightweight headless CMS.

### 3.1 Authentication & Authorization (Firebase Auth)
1. **Sign-in (`/admin/login`):** Firebase Auth client SDK (Email/Password; optional Google sign-in). Also provides "Forgot password" (`sendPasswordResetEmail`).
2. **Session:** after sign-in the client sends the ID token to a Route Handler (`app/api/auth/session/route.ts`). The handler verifies it with `firebase-admin` and sets an **HTTP-only, Secure, SameSite=Strict session cookie** (`createSessionCookie`, 5–14 days). Sign-out revokes the token and clears the cookie.
3. **Proxy (`proxy.ts`, project root):** an optimistic check only. Requests to `/admin/*` (except `/admin/login`) without a `__session` cookie are redirected to `/admin/login?next=…`. Proxy also performs the locale rewrite/redirect for public routes. Per the Next 16 docs, Proxy is not the authorization layer.
4. **Real check:** `app/(admin)/admin/(protected)/layout.tsx` wraps children in `<Suspense>` and a `Gate` component that calls `requireAdmin(role?)` (session reads must sit behind Suspense under Cache Components). **Every Server Action** calls `requireAdminForAction(role?)`, which throws instead of redirecting. Both helpers run `verifySessionCookie(cookie, true)` and check the `role` custom claim.
5. **Roles (custom claims):**
   * `superAdmin`: everything, including user management and site settings.
   * `editor`: create, edit and publish content; no user management.
   * `contributor` (optional): create drafts only; an editor must publish.
6. **First super admin:** bootstrapped with a one-off script (`scripts/set-admin.ts`) that sets the claim through the Admin SDK. After that, super admins invite users from the UI.
7. **Firestore security rules** enforce the same roles (`request.auth.token.role`). The public can read only `status == "published"` documents; only authenticated roles can write. Replace the current open test rules in `firestore.rules` (they expire 2026-11-03).

### 3.2 Admin Information Architecture

| Group | Modules |
| --- | --- |
| **Dashboard** | Stats (notices, events, faculty, drafts), **missing-Bangla-translation count with a link to the list**, recent activity, quick actions ("New notice", "New event") |
| **Pages** | Home (hero variant, hero items, stats, section order/visibility), About, Chairman's Message, Mission & Vision, Contact |
| **Academics** | Programs, Curriculum & Courses, OBE (GAs, PEOs, POs, WKs, mappings) |
| **People** | Faculty, Staff, Chairman assignment |
| **Content** | Notices, Events & News, Downloads, Research areas, Labs, Publications |
| **Inbox** | Contact-form messages |
| **Image Library** | Read-only browser of the static images in `public/images/**`, with folder filter, search, preview and "copy path" |
| **Settings** | Site identity (name, logo, favicon), contact info, social links, navigation menu editor, footer, UI labels (both locales), locale options (Bangla digits), default SEO |
| **Users** *(superAdmin)* | Invite, assign role, disable, revoke sessions |
| **Activity Log** | Who changed what, and when |

### 3.3 Editing Experience
* **Typed forms, not raw JSON.** Each content type has a form generated from its zod schema: text inputs, Tiptap rich-text editors, image pickers backed by the Image Library, repeatable lists with drag-to-reorder.
* **Localized fields** render as an `EN | বাংলা` segmented control above the field (or side-by-side on wide screens). Rich text gets one Tiptap instance per locale. A field-level indicator shows when `bn` is empty. "Copy English to Bangla" helper button for quick starts.
* **Image picker (no uploads):** opens a grid of images from the static manifest, filtered by the relevant folder. The admin picks one and must enter alt text in both locales. Only path and alt texts are saved. A broken or missing path shows a warning.
* **Attachments (no uploads):** pick a PDF from `public/files/**` or paste an external `https://` link.
* **Icon picker:** a searchable grid of allow-listed Phosphor icon names (stored as the string name).
* **Draft → Published workflow:** every document has `status: "draft" | "published"`. "Preview" opens the public page (either locale) in Next.js **Draft Mode**.
* **Live validation** with inline errors; unsaved-changes guard on navigation.
* **Version history:** each save stores a snapshot in a `revisions` subcollection, with one-click restore (keep the last 20).
* **Bulk actions:** publish/unpublish/delete several notices or events at once.
* **Scheduling:** `publishAt` on notices and events (the public query filters `publishAt <= now`).
* **Cache invalidation:** each Server Action calls `updateTag('<type>')` / `updateTag('<type>:<id>')` after writing.
* **Responsive admin:** usable on a tablet; core actions (post a notice) work on a phone.
* **Audit:** every write appends to `auditLogs` (uid, action, collection, docId, timestamp, diff summary).

### 3.4 UI Labels / i18n strings
Short interface strings (nav items, button labels such as "Read more", empty states, footer headings, form labels, a11y labels) live in `settings/ui` as `{ en: { key: string }, bn: { key: string } }` and are edited in **Settings → UI Labels** as a two-column table (key, English, Bangla) with a "missing" filter. The seed script writes both locales from `scripts/seed/content.json`. Pages read them through the cached `getUiLabels()` fetcher and `getT(locale)` in `lib/content/site.ts`.

---

## 🗄️ PART 4: FIRESTORE DATA MODEL

Conventions: every document has `status`, `createdAt`, `updatedAt`, `updatedBy` (uid), and `order` (number) where lists are sortable. Rich text is sanitized HTML.

**Localized string** (`LStr`): `{ en: string; bn: string }`. `en` is required and non-empty; `bn` may be an empty string (renders the English fallback). **Localized HTML** (`LHtml`) has the same shape with sanitized HTML values. Every user-facing text field below is `LStr`/`LHtml` unless marked *(plain)*. Slugs, codes, emails, phones, hrefs, URLs, icon names and numbers are plain.

**Image references** are stored as `{ src, alt: LStr }`. `src` is a site-relative path such as `/images/faculty/jane-doe.webp`. Width and height are read from the generated manifest at render time, not stored. Allowing `https://` in `src` later adds a CDN or Firebase Storage with no migration.

**File references** are stored as `{ name: LStr, href, kind: "static" | "external" }`.

**Static asset layout:**
```
public/images/
  brand/      logo.svg, logo-dark.svg, logo-mono.svg, logo-512.webp, favicon set, og-default-en.png, og-default-bn.png
  hero/       home hero / spotlight images
  chairman/   photo, signature (transparent PNG), signature-dark (optional)
  faculty/    one photo per member, named by slug (4:5)
  staff/
  events/     <event-slug>/cover.webp, <event-slug>/01.webp …
  labs/
  about/
public/files/ curriculum, syllabus, forms, routines (PDF)
```
`scripts/generate-asset-manifest.ts` runs on `predev` and `prebuild`. It scans `public/images` and `public/files` and writes `lib/generated/asset-manifest.json` with each asset's path, folder, width, height and size (via `image-size`). Both the admin pickers and `next/image` use it.

> **Brand assets (done):** exported from the 7.7 MB source PNG into `public/images/brand/`: `logo-1024.webp`, `logo-512.webp`, `logo-256.webp`, `icon-32/192/512.png`, `apple-touch-icon.png`, `logo-mono-1024.png`, `logo-mono-512.png` (single-colour navy mark for the footer) and `og-base.png` (1200×630 paper background with the seal; per-locale OG images are composed on top in step 6). The seal is a white disc, so the light logo also reads on dark surfaces; no separate dark variant is needed. The 4096px PNG stays in `public/resources/` only and is never referenced. If a vector source turns up later, replace these exports.

### Singleton documents (site-wide copy)
| Path | Key fields |
| --- | --- |
| `settings/site` | `name`, `shortName`, `tagline`, `universityName`, `universityUrl` *(plain)*, `logo`, `logoDark`, `logoMono`, `favicon`, `address`, `emails[]`, `phones[]`, `officeHours`, `mapEmbedUrl`, `socials{facebook, linkedin, youtube}`, `nav[] {label, href, children[]}`, `footer{about, columns[] {heading, links[]}}`, `useBanglaDigits` *(bool)*, `defaultSeo {title, description, ogImage}` |
| `settings/ui` | `en { key: string }`, `bn { key: string }` |
| `pages/home` | `heroVariant` (`"editorial"` \| `"slider"`), `hero[] {image, eyebrow, headline, subtext, ctaLabel, ctaHref, secondaryCtaLabel, secondaryCtaHref}`, `stats[] {label, value, suffix}`, `sections[] {key, visible, heading, subheading}`, `seo` |
| `pages/about` | `overview` (LHtml), `history[] {year, title, text}`, `seo` |
| `pages/missionVision` | `universityVision`, `universityMission[] {code, text}`, `deptVision`, `deptMission[] {code, title, text, icon}`, `objectives[] {title, text}`, `seo` |
| `pages/chairmanMessage` | `facultyRef`, `name`, `designation`, `photo`, `signature`, `signatureDark?`, `excerpt`, `message` (LHtml), `effectiveFrom`, `seo` |
| `pages/contact` | `intro`, `formEnabled`, `seo` |
| `obe/framework` | `graduateAttributes[] {code, title, text}`, `peos[] {code, title, text}`, `pos[] {code, title, text}`, `wks[] {code, text}`, `peoPmMap{}`, `poPeoMap{}` |

### Collections
| Collection | Key fields |
| --- | --- |
| `programs` | `name`, `slug`, `degree`, `durationYears`, `totalCredits`, `intake`, `eligibility` (LHtml), `description` (LHtml), `curriculumPdf` |
| `courses` | `code`, `title`, `credit`, `type` (`theory`/`lab`), `semester` (1–8), `programId`, `prerequisites[]`, `rationale` (LHtml), `content` (LHtml), `clos[] {code, text, poMap[]}`, `references[]` *(plain)* |
| `faculty` | `name`, `slug`, `designation`, `photo`, `email`, `phone`, `office`, `education[]`, `researchInterests[]`, `bio` (LHtml), `links{scholar, orcid, researchgate, website}`, `isChairman`, `order` |
| `staff` | `name`, `designation`, `photo`, `email`, `phone`, `order` |
| `notices` | `title`, `slug`, `category`, `content` (LHtml), `attachments[]`, `pinned`, `urgent`, `publishAt` |
| `noticeCategories` | `name`, `slug`, `order` |
| `events` | `title`, `slug`, `type` (`event`/`news`), `startAt`, `endAt`, `venue`, `cover`, `excerpt`, `body` (LHtml), `gallery[]` |
| `downloads` | `title`, `category`, `file`, `order` |
| `researchAreas` | `title`, `description`, `icon` |
| `labs` | `name`, `description` (LHtml), `photo`, `equipment[]`, `inChargeRef` |
| `publications` | `title` *(plain)*, `authors[]`, `facultyRefs[]`, `venue`, `year`, `doi`, `url` |
| `messages` | `name`, `email`, `subject`, `body`, `read` (public create only, admin read) |
| `users` | `uid`, `email`, `displayName`, `role`, `disabled`, `lastLoginAt` |
| `auditLogs` | `uid`, `action`, `collection`, `docId`, `summary`, `at` |
| `{any}/{id}/revisions` | full snapshot, `savedBy`, `savedAt` |

Composite indexes in `firestore.indexes.json`: `notices (status, category, publishAt desc)`, `events (status, startAt)`, `courses (programId, semester, order)`.

---

## 🧱 PART 5: ARCHITECTURE

```
app/
  globals.css               # Tailwind v4 @theme tokens, semantic aliases, .dark, html[lang=bn] rules, utilities
  (site)/
    [locale]/
      layout.tsx            # PUBLIC ROOT LAYOUT: <html lang suppressHydrationWarning>, fonts, ThemeProvider, generateStaticParams
      (public)/             # (added in step 5) UtilityBar + FloatingNav + Footer layout
      page.tsx              # Home
      about/ page.tsx  chairman/page.tsx
      academics/ page.tsx  curriculum/page.tsx  obe/page.tsx  courses/[code]/page.tsx
      faculty/ page.tsx  [slug]/page.tsx
      research/page.tsx
      notices/ page.tsx  [id]/page.tsx
      downloads/page.tsx
      events/ page.tsx  [slug]/page.tsx
      contact/page.tsx
      not-found.tsx
  (admin)/admin/            # ADMIN ROOT LAYOUT (second root layout): no locale segment, English UI
    layout.tsx
    login/page.tsx
    (protected)/
      layout.tsx            # <Suspense><Gate/> → requireAdmin() + sidebar shell
      page.tsx              # Dashboard
      pages/[page]/page.tsx
      academics/…  people/…  content/[collection]/…  images/  settings/  users/  activity/
  api/auth/session/route.ts
  sitemap.ts  robots.ts
lib/
  fonts.ts                  # five next/font faces, shared by both root layouts
  i18n/config.ts            # locales, localizePath, stripLocale, NEXT_LOCALE
  i18n/t.ts                 # pick(LStr), makeT, interpolate, formatNumber, formatDate (bn-BD digits)
  i18n/server.ts            # getLocale() via next/root-params
  generated/asset-manifest.json   # built by scripts/generate-asset-manifest.ts (gitignored)
  firebase/client.ts        # client SDK init (NEXT_PUBLIC_ env)
  firebase/admin.ts         # Admin SDK init, 'server-only'
  auth/require-admin.ts
  content/                  # typed fetchers: getSiteSettings(), getHomePage(), getNotices()… ('use cache' + cacheTag)
  i18n/                     # t(LStr, locale) with fallback, formatNumber(locale), formatDate(locale)
  schemas/                  # zod schemas (single source of truth); LStr/LHtml helpers
  actions/                  # Server Actions per content type (validate → requireAdmin → write → revision → audit → updateTag)
  theme/                    # easing tokens, motion variants, reduced-motion helpers
components/ ui/ public/ admin/
scripts/ seed.ts  set-admin.ts  generate-asset-manifest.ts
proxy.ts
```

* **Reads:** public pages are Server Components that call `lib/content/*` (Admin SDK, cached with `'use cache'` and `cacheTag`). Locale is passed as an argument so each locale gets its own cache entry under the same tag. No Firestore client SDK on public pages.
* **Writes:** only through Server Actions, which always run `requireAdmin` first. No file uploads.
* **Theme:** `next-themes` class on `<html>`; tokens flip under `.dark`. No server-side theme reads, so caching is unaffected.
* **Environment:** `NEXT_PUBLIC_FIREBASE_*` for the client (Auth only); `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` for the Admin SDK (Vercel env vars). Commit `.env.example`; never commit `.env.local`.
* **Fallbacks:** if a content document is missing, render the section's skeleton or hide it. If a `bn` field is empty, render `en`. Never fall back to hardcoded copy.

---

## 🚀 PART 6: DELIVERY PLAN

1. **Foundation (done 2026-10-11):** dependencies (`next-themes`, `motion`, `@phosphor-icons/react`, zod 4, react-hook-form, isomorphic-dompurify, firebase, firebase-admin, image-size, tsx, dotenv; shadcn and Tiptap are added in step 4), Tailwind v4 `@theme` tokens (palette, fonts, easing, radii, shadows), `next/font` for all five faces, `@custom-variant dark`, ThemeProvider, native `[locale]` routing, `cacheComponents: true`, Firebase client and admin modules, zod schemas with `LStr`/`LHtml`, brand asset exports, asset-manifest script (`predev`/`prebuild`), a temporary type specimen at `/` and `/bn`.
2. **Auth (done 2026-10-11):** login page with forgot-password, session cookie route (POST/DELETE), `proxy.ts` (auth redirect + locale rewrite), `requireAdmin` / `requireAdminForAction`, `set-admin` script, production Firestore rules and composite indexes. Not yet run against a real Firebase project: needs `.env.local` and `firebase deploy --only firestore`.
3. **Seed:** `scripts/seed.ts` populates every singleton and collection from `Curriculum V2.md` and `Syllabus V2 __ Final.md` (vision, missions, PEOs, POs, courses) plus placeholders. Both locales for `settings/ui`, nav, footer, section headings, program names and stat labels. Course-level Bangla left empty (fallback) pending department copy.
4. **Admin CMS:** shell and sidebar, generic list/table and form builder with localized-field controls, Image Library and pickers, icon picker, then each module. Dashboard translation-gap widget.
5. **Public site:** utility bar, floating nav, footer, Home (editorial hero, bento stats), About and Chairman, Academics and OBE, Faculty, Notices, Events, Research, Downloads, Contact. Build in light mode first and verify dark mode per page before moving on.
6. **Polish:** SEO (`generateMetadata` with `hreflang`, `sitemap.ts`, `robots.ts`, per-locale OG images), accessibility audit (both themes, both locales, screen reader pass in Bangla), token-pair contrast report, Lighthouse pass, error and empty states, `not-found.tsx`.
7. **Deploy:** connect the GitHub repo to Vercel, set environment variables, deploy Firestore rules and indexes with `firebase deploy --only firestore`, add the Vercel domain to Firebase Auth → Authorized domains, create the first super admin.

**Future upgrade path (once billing is available):** enable Firebase Storage and add an upload button to the image picker that writes `https://` URLs into the same `{ src, alt }` field. No schema changes needed.

**Acceptance criteria**
* Changing any visible sentence (either locale, including the chairman's message, mission, vision, nav labels and footer) in `/admin` updates the public page on the next request, with no redeploy.
* Switching language keeps the user on the same page; switching theme produces no flash on reload; both preferences persist.
* No public page renders an empty string, a raw i18n key, or an English string where a Bangla value exists.
* Every text/background token pair passes AA in both themes (documented in the contrast report).
* An unauthenticated user cannot reach `/admin/*` or invoke any Server Action. An `editor` cannot reach Users.
* Firestore rules reject direct client writes from non-admins (verify with the Firebase Emulator Suite).
* No hardcoded user-facing copy in `app/[locale]/(public)/**` (lint check: no string literals in JSX outside `components/ui`).
* No banned patterns on the public site: no lucide icons, no generic grey 1px borders, no `shadow-md`/dark drop shadows, no `linear`/`ease-in-out` transitions, no edge-to-edge sticky navbar, no element that appears without a reveal.

**Action required:** Start with step 1 and step 2. Output the dependency install commands, `app/globals.css` theme tokens (palette, fonts, easing, dark variant), `app/layout.tsx` with fonts and ThemeProvider, `i18n/routing.ts` and `i18n/request.ts`, `lib/firebase/client.ts`, `lib/firebase/admin.ts`, `lib/auth/require-admin.ts`, `app/api/auth/session/route.ts`, `proxy.ts`, the zod schemas for `LStr`/`LHtml`, `settings/site`, `settings/ui`, `pages/home`, `pages/missionVision` and `pages/chairmanMessage`, `scripts/generate-asset-manifest.ts`, and production-ready `firestore.rules`.
