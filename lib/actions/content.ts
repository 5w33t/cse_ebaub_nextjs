"use server";

import { FieldValue } from "firebase-admin/firestore";
import { updateTag } from "next/cache";
import { requireAdminForAction, type AdminUser } from "@/lib/auth/require-admin";
import { roleAtLeast, type Role } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { sanitizeDocument } from "@/lib/admin/sanitize";
import { docPath, getContentType, type ContentType } from "@/lib/admin/registry";
import { slugify } from "@/lib/utils";

export type ActionIssue = { path: string; message: string };
export type ActionResult = { ok: true; id: string } | { ok: false; error: string; issues?: ActionIssue[] };

const REVISIONS_TO_KEEP = 20;

function fail(error: string, issues?: ActionIssue[]): ActionResult {
  return { ok: false, error, issues };
}

function invalidate(type: ContentType, id: string) {
  updateTag(type.tag);
  updateTag(`${type.tag}:${id}`);
}

async function audit(user: AdminUser, action: string, type: ContentType, docId: string, summary: string) {
  await adminDb().collection("auditLogs").add({
    uid: user.uid,
    email: user.email,
    action,
    collection: type.path,
    docId,
    summary,
    at: FieldValue.serverTimestamp(),
  });
}

async function snapshotRevision(path: string, user: AdminUser) {
  const ref = adminDb().doc(path);
  const current = await ref.get();
  if (!current.exists) return;
  const revisions = ref.collection("revisions");
  await revisions.add({ snapshot: current.data(), savedBy: user.email, savedAt: FieldValue.serverTimestamp() });
  const old = await revisions.orderBy("savedAt", "desc").offset(REVISIONS_TO_KEEP).get();
  if (!old.empty) {
    const batch = adminDb().batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

function requiredRole(type: ContentType): Role {
  return type.minRole ?? "contributor";
}

/**
 * Create or update one document of a content type.
 * `id` is null when creating a collection document; the id is derived from `type.idField`.
 */
export async function saveDocument(typeKey: string, id: string | null, input: unknown): Promise<ActionResult> {
  const type = getContentType(typeKey);
  if (!type) return fail("Unknown content type");

  let user: AdminUser;
  try {
    user = await requireAdminForAction(requiredRole(type));
  } catch {
    return fail("You are not allowed to edit this.");
  }

  const parsed = type.schema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Some fields need attention.",
      parsed.error.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message })),
    );
  }
  const data = sanitizeDocument(parsed.data as Record<string, unknown>, type.fields);

  // Contributors can only hold drafts.
  if (data.status === "published" && !roleAtLeast(user.role, "editor")) {
    return fail("Only editors can publish. Save as draft instead.");
  }

  let docId: string;
  if (type.kind === "singleton") {
    docId = type.path.split("/").pop() ?? type.key;
  } else if (id) {
    docId = id;
  } else {
    const source = type.idField ? data[type.idField] : undefined;
    docId = typeof source === "string" && source ? slugify(source) : adminDb().collection(type.path).doc().id;
    const exists = await adminDb().doc(`${type.path}/${docId}`).get();
    if (exists.exists) return fail(`A ${type.singular.toLowerCase()} with the id "${docId}" already exists.`, [{ path: type.idField ?? "", message: "Must be unique" }]);
  }

  const path = docPath(type, docId);
  const ref = adminDb().doc(path);
  const existing = await ref.get();

  if (existing.exists) await snapshotRevision(path, user);

  const { createdAt: _c, updatedAt: _u, updatedBy: _b, ...rest } = data;
  void _c;
  void _u;
  void _b;
  await ref.set({
    ...rest,
    createdAt: existing.exists ? (existing.get("createdAt") ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  });

  await audit(user, existing.exists ? "update" : "create", type, docId, `${existing.exists ? "Updated" : "Created"} ${type.singular.toLowerCase()} "${docId}" (${String(data.status ?? "published")})`);
  invalidate(type, docId);
  return { ok: true, id: docId };
}

export async function deleteDocument(typeKey: string, id: string): Promise<ActionResult> {
  const type = getContentType(typeKey);
  if (!type || type.kind !== "collection") return fail("Cannot delete this.");
  let user: AdminUser;
  try {
    user = await requireAdminForAction("editor");
  } catch {
    return fail("Only editors can delete.");
  }
  const path = docPath(type, id);
  await snapshotRevision(path, user);
  await adminDb().doc(path).delete();
  await audit(user, "delete", type, id, `Deleted ${type.singular.toLowerCase()} "${id}"`);
  invalidate(type, id);
  return { ok: true, id };
}

export async function bulkSetStatus(typeKey: string, ids: string[], status: "draft" | "published"): Promise<ActionResult> {
  const type = getContentType(typeKey);
  if (!type || type.kind !== "collection") return fail("Unsupported");
  let user: AdminUser;
  try {
    user = await requireAdminForAction("editor");
  } catch {
    return fail("Only editors can publish or unpublish.");
  }
  const batch = adminDb().batch();
  for (const id of ids) {
    batch.update(adminDb().doc(docPath(type, id)), { status, updatedAt: FieldValue.serverTimestamp(), updatedBy: user.uid });
  }
  await batch.commit();
  await audit(user, status === "published" ? "publish" : "unpublish", type, ids.join(","), `${status === "published" ? "Published" : "Unpublished"} ${ids.length} ${type.label.toLowerCase()}`);
  updateTag(type.tag);
  for (const id of ids) updateTag(`${type.tag}:${id}`);
  return { ok: true, id: ids[0] ?? "" };
}

export async function bulkDelete(typeKey: string, ids: string[]): Promise<ActionResult> {
  const type = getContentType(typeKey);
  if (!type || type.kind !== "collection") return fail("Unsupported");
  let user: AdminUser;
  try {
    user = await requireAdminForAction("editor");
  } catch {
    return fail("Only editors can delete.");
  }
  for (const id of ids) await snapshotRevision(docPath(type, id), user);
  const batch = adminDb().batch();
  for (const id of ids) batch.delete(adminDb().doc(docPath(type, id)));
  await batch.commit();
  await audit(user, "delete", type, ids.join(","), `Deleted ${ids.length} ${type.label.toLowerCase()}`);
  updateTag(type.tag);
  for (const id of ids) updateTag(`${type.tag}:${id}`);
  return { ok: true, id: ids[0] ?? "" };
}

export async function restoreRevision(typeKey: string, id: string | null, revisionId: string): Promise<ActionResult> {
  const type = getContentType(typeKey);
  if (!type) return fail("Unknown content type");
  let user: AdminUser;
  try {
    user = await requireAdminForAction("editor");
  } catch {
    return fail("Only editors can restore versions.");
  }
  const path = docPath(type, id);
  const rev = await adminDb().doc(`${path}/revisions/${revisionId}`).get();
  if (!rev.exists) return fail("That version no longer exists.");
  const snapshot = rev.get("snapshot") as Record<string, unknown>;
  await snapshotRevision(path, user);
  await adminDb().doc(path).set({ ...snapshot, updatedAt: FieldValue.serverTimestamp(), updatedBy: user.uid });
  const docId = path.split("/").pop() ?? "";
  await audit(user, "restore", type, docId, `Restored "${docId}" to version ${revisionId}`);
  invalidate(type, docId);
  return { ok: true, id: docId };
}

export async function markMessageRead(id: string, read: boolean): Promise<ActionResult> {
  try {
    await requireAdminForAction("editor");
  } catch {
    return fail("Not allowed.");
  }
  await adminDb().doc(`messages/${id}`).update({ read });
  return { ok: true, id };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    await requireAdminForAction("editor");
  } catch {
    return fail("Not allowed.");
  }
  await adminDb().doc(`messages/${id}`).delete();
  return { ok: true, id };
}

/** Settings → UI labels: both dictionaries at once. */
export async function saveUiLabels(input: unknown): Promise<ActionResult> {
  let user: AdminUser;
  try {
    user = await requireAdminForAction("superAdmin");
  } catch {
    return fail("Only super admins can edit UI labels.");
  }
  const { uiLabelsSchema } = await import("@/lib/schemas/ui");
  const parsed = uiLabelsSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid labels.", parsed.error.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message })));
  const ref = adminDb().doc("settings/ui");
  await snapshotRevision("settings/ui", user);
  await ref.set({ ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: user.uid }, { merge: false });
  await adminDb().collection("auditLogs").add({ uid: user.uid, email: user.email, action: "update", collection: "settings", docId: "ui", summary: "Updated UI labels", at: FieldValue.serverTimestamp() });
  updateTag("settings");
  updateTag("settings:ui");
  return { ok: true, id: "ui" };
}
