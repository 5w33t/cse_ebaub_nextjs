/**
 * One-off bootstrap: give a Firebase Auth user an admin role via custom claims
 * and mirror it into Firestore `users/{uid}`.
 *
 *   npm run set-admin -- someone@ebaub.edu.bd superAdmin
 *
 * The user must already exist in Firebase Authentication (create them in the Firebase console first).
 * Reads FIREBASE_* credentials from .env.local.
 */
import { config as loadEnv } from "dotenv";
import { FieldValue } from "firebase-admin/firestore";

loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const { adminAuth, adminDb } = await import("../lib/firebase/admin-core");
  const { isRole } = await import("../lib/auth/session");

  const [email, roleArg = "superAdmin"] = process.argv.slice(2);

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run set-admin -- <email> [superAdmin|editor|contributor]");
    process.exit(1);
  }
  if (!isRole(roleArg)) {
    console.error(`Unknown role "${roleArg}". Use superAdmin, editor or contributor.`);
    process.exit(1);
  }

  const auth = adminAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: roleArg });
  await auth.revokeRefreshTokens(user.uid); // force re-login so the new claim is picked up

  await adminDb()
    .doc(`users/${user.uid}`)
    .set(
      {
        uid: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? null,
        role: roleArg,
        disabled: user.disabled,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(`✔ ${email} (${user.uid}) is now "${roleArg}". They must sign in again.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
