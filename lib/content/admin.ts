import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { walkFields } from "@/lib/admin/fields";
import { contentTypes, docPath, type ContentType } from "@/lib/admin/registry";
import { serialize } from "./serialize";

/**
 * Uncached reads for the admin panel. They run at request time behind the protected layout's
 * Suspense boundary, so they always show the latest data (drafts included).
 */

export type AdminDoc = { id: string; path: string; data: Record<string, unknown> };

export async function getAdminDocument(type: ContentType, id?: string | null): Promise<AdminDoc | null> {
  const path = docPath(type, id);
  const snap = await adminDb().doc(path).get();
  if (!snap.exists) return null;
  return { id: snap.id, path, data: serialize<Record<string, unknown>>(snap.data()) };
}

export type ListOptions = { status?: "draft" | "published"; limit?: number };

export async function listAdminCollection(type: ContentType, options: ListOptions = {}): Promise<AdminDoc[]> {
  if (type.kind !== "collection") throw new Error(`${type.key} is a singleton`);
  let query: FirebaseFirestore.Query = adminDb().collection(type.path);
  if (options.status) query = query.where("status", "==", options.status);
  if (type.orderBy) query = query.orderBy(type.orderBy.field, type.orderBy.dir);
  if (options.limit) query = query.limit(options.limit);
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, path: d.ref.path, data: serialize<Record<string, unknown>>(d.data()) }));
}

export type Revision = { id: string; savedAt: string; savedBy: string; data: Record<string, unknown> };

export async function listRevisions(type: ContentType, id?: string | null, limit = 20): Promise<Revision[]> {
  const snap = await adminDb().doc(docPath(type, id)).collection("revisions").orderBy("savedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const raw = serialize<Record<string, unknown>>(d.data());
    return {
      id: d.id,
      savedAt: String(raw.savedAt ?? ""),
      savedBy: String(raw.savedBy ?? ""),
      data: (raw.snapshot as Record<string, unknown>) ?? {},
    };
  });
}

export type AuditEntry = {
  id: string;
  uid: string;
  email: string;
  action: string;
  collection: string;
  docId: string;
  summary: string;
  at: string;
};

export async function listAuditLogs(limit = 50): Promise<AuditEntry[]> {
  const snap = await adminDb().collection("auditLogs").orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const raw = serialize<Record<string, unknown>>(d.data());
    return {
      id: d.id,
      uid: String(raw.uid ?? ""),
      email: String(raw.email ?? ""),
      action: String(raw.action ?? ""),
      collection: String(raw.collection ?? ""),
      docId: String(raw.docId ?? ""),
      summary: String(raw.summary ?? ""),
      at: String(raw.at ?? ""),
    };
  });
}

export type Stats = {
  notices: number;
  events: number;
  faculty: number;
  courses: number;
  drafts: number;
  unreadMessages: number;
};

export async function getDashboardStats(): Promise<Stats> {
  const db = adminDb();
  const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const draftCounts = await Promise.all(
    contentTypes.filter((t) => t.kind === "collection").map((t) => count(db.collection(t.path).where("status", "==", "draft"))),
  );
  const [notices, events, faculty, courses, unreadMessages] = await Promise.all([
    count(db.collection("notices")),
    count(db.collection("events")),
    count(db.collection("faculty")),
    count(db.collection("courses")),
    count(db.collection("messages").where("read", "==", false)),
  ]);
  return { notices, events, faculty, courses, drafts: draftCounts.reduce((a, b) => a + b, 0), unreadMessages };
}

export type TranslationGap = { type: ContentType; id: string; title: string; missing: number; href: string };

/** Count empty Bangla values in every localized field, per document, for types that are meant to be bilingual. */
export async function getTranslationGaps(): Promise<{ total: number; docs: TranslationGap[] }> {
  const gaps: TranslationGap[] = [];
  for (const type of contentTypes) {
    if (type.englishOnly) continue;
    const docs: AdminDoc[] = type.kind === "singleton" ? [await getAdminDocument(type)].filter((d): d is AdminDoc => d !== null) : await listAdminCollection(type);
    for (const doc of docs) {
      const missing = countMissingBangla(doc.data, type);
      if (missing > 0) {
        gaps.push({
          type,
          id: doc.id,
          title: readTitle(doc.data, type.titleField),
          missing,
          href: type.kind === "singleton" ? `/admin/pages/${type.key}` : `/admin/content/${type.key}/${doc.id}`,
        });
      }
    }
  }
  gaps.sort((a, b) => b.missing - a.missing);
  return { total: gaps.reduce((s, g) => s + g.missing, 0), docs: gaps };
}

function countMissingBangla(data: Record<string, unknown>, type: ContentType): number {
  let missing = 0;
  const check = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const v = value as { en?: unknown; bn?: unknown };
    if (typeof v.en === "string" && v.en.trim() && (typeof v.bn !== "string" || !v.bn.trim())) missing++;
  };
  const visit = (obj: unknown, path: string[]) => {
    if (obj == null) return;
    const [head, ...rest] = path;
    if (head === undefined) {
      check(obj);
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) visit(item, path);
      return;
    }
    if (typeof obj !== "object") return;
    const next = (obj as Record<string, unknown>)[head];
    if (rest.length === 0) {
      if (Array.isArray(next)) for (const item of next) check(item);
      else check(next);
    } else {
      visit(next, rest);
    }
  };
  walkFields(type.fields, (spec, path) => {
    if (spec.kind === "lstr" || spec.kind === "lstrarea" || spec.kind === "lhtml") visit(data, path);
    if (spec.kind === "tags" && spec.item === "lstr") visit(data, path);
    if (spec.kind === "image") visit(data, [...path, "alt"]);
  });
  return missing;
}

export function readTitle(data: Record<string, unknown>, titleField: string): string {
  const value = titleField.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), data);
  if (!value) return "(untitled)";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "en" in (value as object)) return String((value as { en?: string }).en ?? "(untitled)");
  return String(value);
}

export type InboxMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export async function listMessages(limit = 100): Promise<InboxMessage[]> {
  const snap = await adminDb().collection("messages").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const raw = serialize<Record<string, unknown>>(d.data());
    return {
      id: d.id,
      name: String(raw.name ?? ""),
      email: String(raw.email ?? ""),
      subject: String(raw.subject ?? ""),
      body: String(raw.body ?? ""),
      read: Boolean(raw.read),
      createdAt: String(raw.createdAt ?? ""),
    };
  });
}

export type AdminUserRow = {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  disabled: boolean;
  lastLoginAt: string;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  const snap = await adminDb().collection("users").orderBy("email").get();
  return snap.docs.map((d) => {
    const raw = serialize<Record<string, unknown>>(d.data());
    return {
      uid: d.id,
      email: String(raw.email ?? ""),
      displayName: String(raw.displayName ?? ""),
      role: String(raw.role ?? ""),
      disabled: Boolean(raw.disabled),
      lastLoginAt: String(raw.lastLoginAt ?? ""),
    };
  });
}
