/**
 * Firebase Admin SDK bootstrap shared by the Next.js server (via ./admin.ts, which adds `server-only`)
 * and by CLI scripts in /scripts, which cannot import `server-only`.
 */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;

// Next.js bundles server components, route handlers and server actions separately, so this module can be
// instantiated more than once per process while the Firestore client (cached per app) is shared.
// The "settings() once" guard therefore has to live on globalThis, not in module scope.
const globalFlags = globalThis as unknown as { __ebaubFirestoreConfigured?: boolean };

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }
  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  return app;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  const db = getFirestore(getAdminApp());
  if (!globalFlags.__ebaubFirestoreConfigured) {
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured by another bundle; the shared instance keeps its settings.
    }
    globalFlags.__ebaubFirestoreConfigured = true;
  }
  return db;
}
