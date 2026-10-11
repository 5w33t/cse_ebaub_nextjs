/** Shared constants for the admin session cookie. Safe to import anywhere. */
export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days (Firebase allows 5 minutes to 14 days)

export const ROLES = ["superAdmin", "editor", "contributor"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { superAdmin: 3, editor: 2, contributor: 1 };

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return RANK[role] >= RANK[minimum];
}

/** Only allow post-login redirects inside the admin area. */
export function safeAdminPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) {
    return "/admin";
  }
  return next;
}
