import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { isRole, roleAtLeast, SESSION_COOKIE, type Role } from "./session";

export type AdminUser = {
  uid: string;
  email: string;
  name: string | null;
  role: Role;
};

/**
 * Verify the session cookie against Firebase (with revocation check) and read the role claim.
 * Returns null for anonymous, expired, revoked or role-less sessions.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const claims = await adminAuth().verifySessionCookie(cookie, true);
    if (!isRole(claims.role)) return null;
    return {
      uid: claims.uid,
      email: claims.email ?? "",
      name: typeof claims.name === "string" ? claims.name : null,
      role: claims.role,
    };
  } catch {
    return null;
  }
}

/**
 * The real authorization gate for admin pages and layouts.
 * Redirects to the login page when there is no valid session, and to the dashboard when the role is too low.
 */
export async function requireAdmin(minimum: Role = "contributor"): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (!roleAtLeast(user.role, minimum)) redirect("/admin?denied=1");
  return user;
}

/**
 * Authorization for Server Actions. Throws instead of redirecting so the caller can surface an error.
 * Every Server Action must call this before touching Firestore.
 */
export async function requireAdminForAction(minimum: Role = "editor"): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!roleAtLeast(user.role, minimum)) throw new Error("FORBIDDEN");
  return user;
}
