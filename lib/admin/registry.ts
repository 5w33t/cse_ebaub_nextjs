import type { z } from "zod";
import type { Role } from "@/lib/auth/session";
import { f, type FieldSpec } from "./fields";
import {
  aboutPageSchema,
  chairmanMessageSchema,
  contactPageSchema,
  courseSchema,
  downloadSchema,
  eventSchema,
  facultySchema,
  homePageSchema,
  labSchema,
  missionVisionSchema,
  noticeCategorySchema,
  noticeSchema,
  obeFrameworkSchema,
  programSchema,
  publicationSchema,
  researchAreaSchema,
  siteSettingsSchema,
  staffSchema,
} from "@/lib/schemas";

export type ListColumn = {
  name: string;
  label: string;
  kind?: "lstr" | "text" | "date" | "datetime" | "bool" | "number";
};

export type ContentType = {
  key: string;
  label: string;
  singular: string;
  group: "pages" | "academics" | "people" | "content" | "settings";
  kind: "singleton" | "collection";
  /** Firestore path: `pages/home` for singletons, collection name for collections. */
  path: string;
  schema: z.ZodTypeAny;
  fields: FieldSpec[];
  /** Base cache tag. Documents also get `${tag}:${id}`. */
  tag: string;
  /** Field used to derive the document id when creating. */
  idField?: string;
  /** Field shown as the row title in lists. */
  titleField: string;
  listColumns?: ListColumn[];
  /** Public path for Draft Mode preview. */
  previewPath?: (doc: Record<string, unknown>) => string;
  /** Minimum role to write at all (contributors may draft unless this is higher). */
  minRole?: Role;
  /** Excluded from the "missing Bangla" count (English-only content by decision). */
  englishOnly?: boolean;
  orderBy?: { field: string; dir: "asc" | "desc" };
  description?: string;
};

const seoFields = (): FieldSpec =>
  f.object("seo", "SEO", [
    f.lstr("title", "Page title"),
    f.lstrOptional("description", "Meta description"),
    f.image("ogImage", "Social share image", "brand"),
  ]);

const seoFieldsNoImage = (): FieldSpec =>
  f.object("seo", "SEO", [f.lstr("title", "Page title"), f.lstrOptional("description", "Meta description")]);

const navLinkFields: FieldSpec[] = [f.lstr("label", "Label", { width: "half" }), f.text("href", "Link", { width: "half", placeholder: "/academics or https://…" })];

export const contentTypes: ContentType[] = [
  // ---------------------------------------------------------------- Settings
  {
    key: "site",
    label: "Site settings",
    singular: "Site settings",
    group: "settings",
    kind: "singleton",
    path: "settings/site",
    schema: siteSettingsSchema,
    tag: "settings",
    titleField: "name",
    minRole: "superAdmin",
    description: "Identity, contact details, navigation and footer. Everything here appears on every public page.",
    fields: [
      f.lstr("name", "Department name"),
      f.lstr("shortName", "Short name", { width: "half" }),
      f.lstr("tagline", "Tagline"),
      f.lstr("universityName", "University name"),
      f.url("universityUrl", "University website", { required: true }),
      f.image("logo", "Logo", "brand", { required: true }),
      f.image("logoDark", "Logo (dark surfaces)", "brand"),
      f.image("logoMono", "Mono mark (footer)", "brand"),
      f.text("favicon", "Favicon path", { width: "half", mono: true }),
      f.lstr("address", "Address"),
      f.tags("emails", "Emails", "text"),
      f.tags("phones", "Phones", "text"),
      f.lstrOptional("officeHours", "Office hours"),
      f.url("mapEmbedUrl", "Google Maps embed URL", { width: "full" }),
      f.object("socials", "Social links", [f.url("facebook", "Facebook"), f.url("linkedin", "LinkedIn"), f.url("youtube", "YouTube")]),
      f.list("nav", "Navigation", [...navLinkFields, f.list("children", "Sub-links", navLinkFields, { itemTitle: "label" })], { itemTitle: "label" }),
      f.object("footer", "Footer", [
        f.lstr("about", "About line"),
        f.list("columns", "Link columns", [f.lstr("heading", "Heading"), f.list("links", "Links", navLinkFields, { itemTitle: "label" })], { itemTitle: "heading", max: 3 }),
      ]),
      f.boolean("useBanglaDigits", "Bangla digits", "Show numbers and dates with Bangla numerals when the site is in Bangla."),
      f.object("defaultSeo", "Default SEO", [f.lstr("title", "Title"), f.lstrOptional("description", "Description"), f.image("ogImage", "Social share image", "brand")]),
    ],
  },

  // ---------------------------------------------------------------- Pages
  {
    key: "home",
    label: "Home page",
    singular: "Home page",
    group: "pages",
    kind: "singleton",
    path: "pages/home",
    schema: homePageSchema,
    tag: "pages",
    titleField: "seo.title",
    previewPath: () => "/",
    fields: [
      f.select("heroVariant", "Hero style", [
        { value: "editorial", label: "Editorial (static)" },
        { value: "slider", label: "Slider" },
      ]),
      f.list(
        "hero",
        "Hero items",
        [
          f.image("image", "Image", "hero", { required: true }),
          f.lstrOptional("eyebrow", "Eyebrow"),
          f.lstr("headline", "Headline"),
          f.lstrOptional("subtext", "Sub-text"),
          f.lstr("ctaLabel", "Primary button label", { width: "half" }),
          f.text("ctaHref", "Primary button link", { width: "half" }),
          f.lstrOptional("secondaryCtaLabel", "Secondary button label", { width: "half" }),
          f.text("secondaryCtaHref", "Secondary button link", { width: "half" }),
        ],
        { itemTitle: "headline" },
      ),
      f.list("stats", "At-a-glance stats", [f.lstr("label", "Label", { width: "half" }), f.number("value", "Value", { min: 0 }), f.text("suffix", "Suffix", { width: "third", placeholder: "+" })], { itemTitle: "label", max: 6 }),
      f.list(
        "sections",
        "Sections (order and visibility)",
        [
          f.select("key", "Section", [
            { value: "stats", label: "At a glance" },
            { value: "chairman", label: "Chairman's message" },
            { value: "missionVision", label: "Vision and mission" },
            { value: "notices", label: "Latest notices" },
            { value: "events", label: "News and events" },
            { value: "faculty", label: "Faculty highlight" },
          ]),
          f.boolean("visible", "Visible"),
          f.lstr("heading", "Heading"),
          f.lstrOptional("subheading", "Sub-heading"),
        ],
        { itemTitle: "heading" },
      ),
      seoFields(),
    ],
  },
  {
    key: "about",
    label: "About page",
    singular: "About page",
    group: "pages",
    kind: "singleton",
    path: "pages/about",
    schema: aboutPageSchema,
    tag: "pages",
    titleField: "seo.title",
    previewPath: () => "/about",
    fields: [
      f.lhtml("overview", "Department overview"),
      f.list("history", "History timeline", [f.text("year", "Year", { width: "third" }), f.lstr("title", "Title"), f.lstrOptional("text", "Text")], { itemTitle: "title" }),
      seoFieldsNoImage(),
    ],
  },
  {
    key: "missionVision",
    label: "Vision and mission",
    singular: "Vision and mission",
    group: "pages",
    kind: "singleton",
    path: "pages/missionVision",
    schema: missionVisionSchema,
    tag: "pages",
    titleField: "seo.title",
    previewPath: () => "/about#vision-mission",
    fields: [
      f.lstrarea("universityVision", "University vision"),
      f.list("universityMission", "University mission", [f.text("code", "Code", { width: "third", mono: true }), f.lstrarea("text", "Text")], { itemTitle: "code" }),
      f.lstrarea("deptVision", "Department vision"),
      f.list("deptMission", "Department mission", [f.text("code", "Code", { width: "third", mono: true }), f.icon("icon", "Icon"), f.lstr("title", "Title"), f.lstrarea("text", "Text")], { itemTitle: "title" }),
      f.list("objectives", "Objectives", [f.lstr("title", "Title"), f.lstrarea("text", "Text")], { itemTitle: "title" }),
      seoFieldsNoImage(),
    ],
  },
  {
    key: "chairmanMessage",
    label: "Chairman's message",
    singular: "Chairman's message",
    group: "pages",
    kind: "singleton",
    path: "pages/chairmanMessage",
    schema: chairmanMessageSchema,
    tag: "pages",
    titleField: "name",
    previewPath: () => "/about/chairman",
    fields: [
      f.lstr("name", "Name", { width: "half" }),
      f.lstr("designation", "Designation", { width: "half" }),
      f.text("facultyRef", "Faculty profile slug", { width: "half", mono: true, help: "Links the message to a faculty profile." }),
      f.date("effectiveFrom", "Effective from", { required: true }),
      f.image("photo", "Photo", "chairman", { required: true }),
      f.image("signature", "Signature (transparent PNG)", "chairman", { required: true }),
      f.image("signatureDark", "Signature for dark mode", "chairman"),
      f.lstrarea("excerpt", "Short excerpt (home page teaser)"),
      f.lhtml("message", "Full message"),
      seoFieldsNoImage(),
    ],
  },
  {
    key: "contact",
    label: "Contact page",
    singular: "Contact page",
    group: "pages",
    kind: "singleton",
    path: "pages/contact",
    schema: contactPageSchema,
    tag: "pages",
    titleField: "seo.title",
    previewPath: () => "/contact",
    fields: [f.lstrarea("intro", "Intro"), f.boolean("formEnabled", "Contact form", "Show the message form on the contact page."), seoFieldsNoImage()],
  },

  // ---------------------------------------------------------------- Academics
  {
    key: "programs",
    label: "Programs",
    singular: "Program",
    group: "academics",
    kind: "collection",
    path: "programs",
    schema: programSchema,
    tag: "programs",
    idField: "slug",
    titleField: "name",
    englishOnly: true,
    orderBy: { field: "order", dir: "asc" },
    listColumns: [{ name: "degree", label: "Degree", kind: "lstr" }, { name: "durationYears", label: "Years", kind: "number" }, { name: "totalCredits", label: "Credits", kind: "number" }],
    previewPath: () => "/academics",
    fields: [
      f.lstr("name", "Program name"),
      f.slug("slug", "Slug", "name"),
      f.lstr("degree", "Degree (short)", { width: "half" }),
      f.number("durationYears", "Duration (years)", { min: 1, max: 6 }),
      f.number("totalCredits", "Total credits", { min: 1, nullable: true, help: "Leave empty until confirmed." }),
      f.number("order", "Order"),
      f.lstrOptional("intake", "Intake"),
      f.lhtml("eligibility", "Eligibility"),
      f.lhtml("description", "Description"),
      f.file("curriculumPdf", "Curriculum PDF"),
      seoFieldsNoImage(),
    ],
  },
  {
    key: "courses",
    label: "Courses",
    singular: "Course",
    group: "academics",
    kind: "collection",
    path: "courses",
    schema: courseSchema,
    tag: "courses",
    idField: "slug",
    titleField: "title",
    englishOnly: true,
    orderBy: { field: "semester", dir: "asc" },
    listColumns: [
      { name: "code", label: "Code", kind: "text" },
      { name: "semester", label: "Sem", kind: "number" },
      { name: "credit", label: "Cr", kind: "number" },
      { name: "type", label: "Type", kind: "text" },
      { name: "courseStatus", label: "Status", kind: "text" },
    ],
    previewPath: (doc) => `/academics/courses/${String(doc.code ?? "").replace(/\s+/g, "-").toLowerCase()}`,
    fields: [
      f.text("code", "Course code", { width: "third", mono: true, required: true, placeholder: "CSE 1101" }),
      f.slug("slug", "Slug", "code"),
      f.text("programId", "Program slug", { width: "third", mono: true, required: true }),
      f.lstr("title", "Title"),
      f.number("credit", "Credit", { min: 0.5, step: 0.5 }),
      f.number("totalMarks", "Total marks", { min: 1, nullable: true }),
      f.number("semester", "Semester", { min: 1, max: 8 }),
      f.select("type", "Type", [{ value: "theory", label: "Theory" }, { value: "lab", label: "Lab / Sessional" }]),
      f.select("courseStatus", "Course status", [{ value: "core", label: "Core" }, { value: "elective", label: "Elective" }, { value: "ged", label: "GED" }]),
      f.select("electiveGroup", "Elective table", [{ value: "I", label: "Table I" }, { value: "II", label: "Table II" }], { nullable: true }),
      f.number("order", "Order within semester"),
      f.tags("prerequisites", "Prerequisites", "code"),
      f.lhtml("rationale", "Rationale"),
      f.list(
        "clos",
        "Course learning outcomes",
        [
          f.text("code", "CO code", { width: "third", mono: true, required: true }),
          f.text("taxonomy", "Taxonomy", { width: "third" }),
          f.lstrarea("text", "Outcome"),
          f.tags("poMap", "Program outcomes", "code"),
          f.tags("wk", "WK", "code"),
          f.tags("wp", "WP", "code"),
          f.tags("ea", "EA", "code"),
        ],
        { itemTitle: "code" },
      ),
      f.list("outline", "Course outline", [f.lstrarea("topic", "Topic"), f.number("weeks", "Weeks", { min: 0, nullable: true }), f.tags("cos", "COs", "code")], { itemTitle: "topic" }),
      f.list("strategies", "Teaching and assessment", [f.text("co", "CO", { width: "third", mono: true }), f.text("instructional", "Instructional strategy"), f.text("assessment", "Assessment strategy")], { itemTitle: "co" }),
      f.list("books", "Recommended books", [f.text("authors", "Authors", { width: "half" }), f.text("title", "Title and publisher", { width: "half", required: true }), f.boolean("isTextbook", "Textbook")], { itemTitle: "title" }),
    ],
  },
  {
    key: "obe",
    label: "OBE framework",
    singular: "OBE framework",
    group: "academics",
    kind: "singleton",
    path: "obe/framework",
    schema: obeFrameworkSchema,
    tag: "obe",
    titleField: "seo.title",
    englishOnly: true,
    previewPath: () => "/academics/obe",
    fields: [
      f.list("graduateAttributes", "Graduate attributes", [f.text("code", "Code", { width: "third", mono: true }), f.lstrarea("text", "Text")], { itemTitle: "code" }),
      f.list("peos", "Program educational objectives", [f.text("code", "Code", { width: "third", mono: true }), f.lstr("title", "Title"), f.lstrarea("text", "Text")], { itemTitle: "code" }),
      f.list("pos", "Program outcomes", [f.text("code", "Code", { width: "third", mono: true }), f.lstr("title", "Title"), f.lstrarea("text", "Text")], { itemTitle: "code" }),
      f.list("wks", "Knowledge profile (WK)", [f.text("code", "Code", { width: "third", mono: true }), f.lstrarea("text", "Text")], { itemTitle: "code" }),
      f.json("peoPmMap", "PEO → mission mapping", 'JSON object, e.g. { "PEO1": ["PM1"] }'),
      f.json("poPeoMap", "PO → PEO mapping", 'JSON object, e.g. { "PO1": ["PEO1"] }'),
      seoFieldsNoImage(),
    ],
  },

  // ---------------------------------------------------------------- People
  {
    key: "faculty",
    label: "Faculty",
    singular: "Faculty member",
    group: "people",
    kind: "collection",
    path: "faculty",
    schema: facultySchema,
    tag: "faculty",
    idField: "slug",
    titleField: "name",
    orderBy: { field: "order", dir: "asc" },
    listColumns: [{ name: "designation", label: "Designation", kind: "lstr" }, { name: "email", label: "Email", kind: "text" }, { name: "isChairman", label: "Chair", kind: "bool" }],
    previewPath: (doc) => `/faculty/${String(doc.slug ?? "")}`,
    fields: [
      f.lstr("name", "Name"),
      f.slug("slug", "Slug", "name"),
      f.lstr("designation", "Designation", { width: "half" }),
      f.image("photo", "Photo (4:5)", "faculty"),
      f.email("email", "Email"),
      f.text("phone", "Phone", { width: "half" }),
      f.lstrOptional("office", "Office and room"),
      f.boolean("isChairman", "Chairman"),
      f.number("order", "Order"),
      f.tags("education", "Education", "lstr"),
      f.tags("researchInterests", "Research interests", "lstr"),
      f.lhtml("bio", "Biography"),
      f.object("links", "Profiles", [f.url("scholar", "Google Scholar"), f.url("orcid", "ORCID"), f.url("researchgate", "ResearchGate"), f.url("website", "Website")]),
    ],
  },
  {
    key: "staff",
    label: "Officers and staff",
    singular: "Staff member",
    group: "people",
    kind: "collection",
    path: "staff",
    schema: staffSchema,
    titleField: "name",
    tag: "staff",
    orderBy: { field: "order", dir: "asc" },
    listColumns: [{ name: "designation", label: "Designation", kind: "lstr" }, { name: "email", label: "Email", kind: "text" }],
    fields: [f.lstr("name", "Name"), f.lstr("designation", "Designation", { width: "half" }), f.image("photo", "Photo", "staff"), f.email("email", "Email"), f.text("phone", "Phone", { width: "half" }), f.number("order", "Order")],
  },

  // ---------------------------------------------------------------- Content
  {
    key: "notices",
    label: "Notices",
    singular: "Notice",
    group: "content",
    kind: "collection",
    path: "notices",
    schema: noticeSchema,
    tag: "notices",
    idField: "slug",
    titleField: "title",
    orderBy: { field: "publishAt", dir: "desc" },
    listColumns: [{ name: "category", label: "Category", kind: "text" }, { name: "publishAt", label: "Publish", kind: "datetime" }, { name: "pinned", label: "Pinned", kind: "bool" }, { name: "urgent", label: "Urgent", kind: "bool" }],
    previewPath: (doc) => `/notices/${String(doc.slug ?? "")}`,
    fields: [
      f.lstr("title", "Title"),
      f.slug("slug", "Slug", "title"),
      f.text("category", "Category slug", { width: "third", mono: true, required: true, help: "One of the notice categories." }),
      f.datetime("publishAt", "Publish at", { required: true, help: "Future dates schedule the notice." }),
      f.boolean("pinned", "Pinned"),
      f.boolean("urgent", "Urgent"),
      f.lhtml("content", "Content"),
      f.list("attachments", "Attachments", [], { item: "file" }),
    ],
  },
  {
    key: "noticeCategories",
    label: "Notice categories",
    singular: "Category",
    group: "content",
    kind: "collection",
    path: "noticeCategories",
    schema: noticeCategorySchema,
    tag: "noticeCategories",
    idField: "slug",
    titleField: "name",
    orderBy: { field: "order", dir: "asc" },
    fields: [f.lstr("name", "Name"), f.slug("slug", "Slug", "name"), f.number("order", "Order")],
  },
  {
    key: "events",
    label: "News and events",
    singular: "Item",
    group: "content",
    kind: "collection",
    path: "events",
    schema: eventSchema,
    tag: "events",
    idField: "slug",
    titleField: "title",
    orderBy: { field: "startAt", dir: "desc" },
    listColumns: [{ name: "type", label: "Type", kind: "text" }, { name: "startAt", label: "Starts", kind: "datetime" }, { name: "venue", label: "Venue", kind: "lstr" }],
    previewPath: (doc) => `/events/${String(doc.slug ?? "")}`,
    fields: [
      f.lstr("title", "Title"),
      f.slug("slug", "Slug", "title"),
      f.select("type", "Type", [{ value: "event", label: "Event" }, { value: "news", label: "News" }]),
      f.datetime("startAt", "Starts", { required: true }),
      f.datetime("endAt", "Ends"),
      f.lstrOptional("venue", "Venue"),
      f.image("cover", "Cover image", "events"),
      f.lstrOptional("excerpt", "Excerpt"),
      f.lhtml("body", "Body"),
      f.list("gallery", "Photo gallery", [], { item: "image", folder: "events" }),
    ],
  },
  {
    key: "downloads",
    label: "Downloads",
    singular: "Download",
    group: "content",
    kind: "collection",
    path: "downloads",
    schema: downloadSchema,
    tag: "downloads",
    titleField: "title",
    orderBy: { field: "order", dir: "asc" },
    listColumns: [{ name: "category", label: "Category", kind: "lstr" }],
    previewPath: () => "/downloads",
    fields: [f.lstr("title", "Title"), f.lstr("category", "Category", { width: "half" }), f.number("order", "Order"), f.file("file", "File", { required: true })],
  },
  {
    key: "researchAreas",
    label: "Research areas",
    singular: "Research area",
    group: "content",
    kind: "collection",
    path: "researchAreas",
    schema: researchAreaSchema,
    tag: "research",
    titleField: "title",
    orderBy: { field: "order", dir: "asc" },
    previewPath: () => "/research",
    fields: [f.lstr("title", "Title"), f.lstrarea("description", "Description"), f.icon("icon", "Icon"), f.number("order", "Order")],
  },
  {
    key: "labs",
    label: "Laboratories",
    singular: "Lab",
    group: "content",
    kind: "collection",
    path: "labs",
    schema: labSchema,
    tag: "research",
    titleField: "name",
    orderBy: { field: "order", dir: "asc" },
    listColumns: [{ name: "inChargeRef", label: "In charge", kind: "text" }],
    previewPath: () => "/research",
    fields: [f.lstr("name", "Name"), f.image("photo", "Photo", "labs"), f.text("inChargeRef", "In-charge (faculty slug)", { width: "half", mono: true }), f.number("order", "Order"), f.lhtml("description", "Description"), f.tags("equipment", "Equipment", "lstr")],
  },
  {
    key: "publications",
    label: "Publications",
    singular: "Publication",
    group: "content",
    kind: "collection",
    path: "publications",
    schema: publicationSchema,
    tag: "research",
    titleField: "title",
    englishOnly: true,
    orderBy: { field: "year", dir: "desc" },
    listColumns: [{ name: "year", label: "Year", kind: "number" }, { name: "venue", label: "Venue", kind: "text" }],
    previewPath: () => "/research",
    fields: [
      f.text("title", "Title", { required: true }),
      f.tags("authors", "Authors", "text"),
      f.tags("facultyRefs", "Faculty (slugs)", "text"),
      f.text("venue", "Venue", { width: "half" }),
      f.number("year", "Year", { min: 1950, max: 2100 }),
      f.text("doi", "DOI", { width: "third", mono: true }),
      f.url("url", "URL"),
    ],
  },
];

export const contentTypeMap: Record<string, ContentType> = Object.fromEntries(contentTypes.map((t) => [t.key, t]));

export function getContentType(key: string): ContentType | undefined {
  return contentTypeMap[key];
}

export function docPath(type: ContentType, id?: string | null): string {
  if (type.kind === "singleton") return type.path;
  if (!id) throw new Error(`Document id required for ${type.key}`);
  return `${type.path}/${id}`;
}
