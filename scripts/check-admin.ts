/**
 * Diagnostic: confirms the Admin SDK credentials work and prints a user's role claim.
 *   npx tsx scripts/check-admin.ts someone@example.com
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const { adminAuth, adminDb } = await import("../lib/firebase/admin-core");
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/check-admin.ts <email>");
    process.exit(1);
  }
  const user = await adminAuth().getUserByEmail(email);
  console.log(`uid: ${user.uid} | disabled: ${user.disabled} | claims: ${JSON.stringify(user.customClaims ?? {})}`);
  const settings = await adminDb().collection("settings").get();
  const courses = await adminDb().collection("courses").count().get();
  console.log(`Firestore reachable. settings docs: ${settings.size}, courses: ${courses.data().count}`);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exit(1);
});
