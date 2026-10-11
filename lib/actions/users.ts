"use server";

import { FieldValue } from "firebase-admin/firestore";
import { requireAdminForAction, type AdminUser } from "@/lib/auth/require-admin";
import { isRole, type Role } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { ActionResult } from "./content";

function fail(error: string): ActionResult {
  return { ok: false, error };
}

async function audit(user: AdminUser, action: string, docId: string, summary: string) {
  await adminDb().collection("auditLogs").add({
    uid: user.uid,
    email: user.email,
    action,
    collection: "users",
    docId,
    summary,
    at: FieldValue.serverTimestamp(),
  });
}

async function mirror(uid: string, patch: Record<string, unknown>) {
  await adminDb().doc(`users/${uid}`).set({ uid, ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

/**
 * Invite: creates the Auth user (or finds an existing one), sets the role claim, and returns a
 * password-setup link the super admin can send. The Spark plan cannot send email from the server.
 */
export async function inviteUser(email: string, role: Role): Promise<ActionResult & { link?: string }> {
  let me: AdminUser;
  try {
    me = await requireAdminForAction("superAdmin");
  } catch {
    return fail("Only super admins manage users.");
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return fail("Enter a valid email address.");
  if (!isRole(role)) return fail("Unknown role.");

  const auth = adminAuth();
  let uid: string;
  try {
    uid = (await auth.getUserByEmail(cleanEmail)).uid;
  } catch {
    uid = (await auth.createUser({ email: cleanEmail, emailVerified: false })).uid;
  }
  const existing = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(existing.customClaims ?? {}), role });
  await mirror(uid, { email: cleanEmail, displayName: existing.displayName ?? null, role, disabled: existing.disabled });
  const link = await auth.generatePasswordResetLink(cleanEmail);
  await audit(me, "invite", uid, `Invited ${cleanEmail} as ${role}`);
  return { ok: true, id: uid, link };
}

export async function setUserRole(uid: string, role: Role): Promise<ActionResult> {
  let me: AdminUser;
  try {
    me = await requireAdminForAction("superAdmin");
  } catch {
    return fail("Only super admins manage users.");
  }
  if (!isRole(role)) return fail("Unknown role.");
  if (uid === me.uid && role !== "superAdmin") return fail("You cannot remove your own super admin role.");
  const auth = adminAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role });
  await auth.revokeRefreshTokens(uid);
  await mirror(uid, { role });
  await audit(me, "role", uid, `Set ${user.email ?? uid} to ${role}`);
  return { ok: true, id: uid };
}

export async function setUserDisabled(uid: string, disabled: boolean): Promise<ActionResult> {
  let me: AdminUser;
  try {
    me = await requireAdminForAction("superAdmin");
  } catch {
    return fail("Only super admins manage users.");
  }
  if (uid === me.uid) return fail("You cannot disable your own account.");
  const auth = adminAuth();
  await auth.updateUser(uid, { disabled });
  if (disabled) await auth.revokeRefreshTokens(uid);
  await mirror(uid, { disabled });
  const user = await auth.getUser(uid);
  await audit(me, disabled ? "disable" : "enable", uid, `${disabled ? "Disabled" : "Enabled"} ${user.email ?? uid}`);
  return { ok: true, id: uid };
}

export async function revokeUserSessions(uid: string): Promise<ActionResult> {
  let me: AdminUser;
  try {
    me = await requireAdminForAction("superAdmin");
  } catch {
    return fail("Only super admins manage users.");
  }
  await adminAuth().revokeRefreshTokens(uid);
  await audit(me, "revoke", uid, `Revoked sessions for ${uid}`);
  return { ok: true, id: uid };
}
