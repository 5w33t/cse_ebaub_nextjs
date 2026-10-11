import "server-only";

/**
 * Server-side Firebase Admin access. Never import this from a Client Component.
 * Used by `lib/content/*` fetchers (reads), Server Actions (writes) and the session route.
 */
export { adminAuth, adminDb } from "./admin-core";
