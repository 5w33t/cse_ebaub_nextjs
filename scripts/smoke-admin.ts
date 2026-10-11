/**
 * Smoke test for the admin panel against a running server (default http://localhost:3100).
 * Mints a custom token for the given admin, exchanges it for an ID token, creates the session
 * cookie through /api/auth/session, then fetches each admin page with that cookie.
 *
 *   npx tsx scripts/smoke-admin.ts sweet.csevu@gmail.com [http://localhost:3100]
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const [email, base = "http://localhost:3100"] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npx tsx scripts/smoke-admin.ts <email> [baseUrl]");
  const { adminAuth } = await import("../lib/firebase/admin-core");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY missing");

  const user = await adminAuth().getUserByEmail(email);
  const customToken = await adminAuth().createCustomToken(user.uid);
  const exchange = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const { idToken } = (await exchange.json()) as { idToken?: string };
  if (!idToken) throw new Error("Could not exchange custom token");

  const session = await fetch(`${base}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const setCookie = session.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  console.log(`session: ${session.status} ${cookie ? cookie.slice(0, 20) + "…" : "(no cookie)"}`);
  if (!cookie) throw new Error("No session cookie");

  const pages: [string, string][] = [
    ["/admin", "Content overview"],
    ["/admin/pages/home", "Home page"],
    ["/admin/pages/site", "Site settings"],
    ["/admin/pages/obe", "OBE framework"],
    ["/admin/content/courses", "CSE 1101"],
    ["/admin/content/courses/cse-1101", "Discrete Mathematics"],
    ["/admin/content/notices", "Sample notice"],
    ["/admin/content/notices/new", "New notice"],
    ["/admin/images", "Images and files"],
    ["/admin/settings/ui-labels", "readMore"],
    ["/admin/users", email],
    ["/admin/activity", "Activity log"],
    ["/admin/inbox", "Contact messages"],
  ];
  let failed = 0;
  for (const [path, needle] of pages) {
    const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
    const html = await res.text();
    const ok = res.status === 200 && html.includes(needle);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${res.status} ${path}${ok ? "" : ` (missing "${needle}")`}`);
  }

  const draft = await fetch(`${base}/api/draft?path=/`, { headers: { cookie }, redirect: "manual" });
  const bypass = (draft.headers.get("set-cookie") ?? "").includes("__prerender_bypass");
  console.log(`${draft.status === 307 && bypass ? "PASS" : "FAIL"} ${draft.status} /api/draft (bypass cookie: ${bypass})`);
  if (!(draft.status === 307 && bypass)) failed++;

  // A forged cookie passes the proxy's presence check; no page may stream data before its own gate.
  for (const path of ["/admin", "/admin/content/courses", "/admin/users", "/admin/inbox"]) {
    const forged = await fetch(`${base}${path}`, { headers: { cookie: "__session=forged" } });
    const body = await forged.text();
    const leaked = /Content overview|CSE 1101|lastLoginAt|Contact messages/.test(body);
    console.log(`${!leaked && body.includes("/admin/login") ? "PASS" : "FAIL"} forged cookie on ${path} leaks nothing (${leaked ? "LEAK" : "clean"})`);
    if (leaked || !body.includes("/admin/login")) failed++;
  }

  const anon = await fetch(`${base}/api/draft?path=/`, { redirect: "manual" });
  console.log(`${anon.status === 401 ? "PASS" : "FAIL"} ${anon.status} /api/draft without session`);
  if (anon.status !== 401) failed++;

  // Firebase revocation is second-granular; wait so the session's auth_time is strictly older.
  await new Promise((r) => setTimeout(r, 1100));
  const signout = await fetch(`${base}/api/auth/session`, { method: "DELETE", headers: { cookie } });
  // Under Cache Components the admin shell streams with a 200 and the redirect travels inside the
  // stream, so check the body: the dashboard must be gone and a login redirect must be present.
  const after = await fetch(`${base}/admin`, { headers: { cookie }, redirect: "manual" });
  const afterHtml = await after.text();
  const revoked = signout.status === 200 && !afterHtml.includes("Content overview") && afterHtml.includes("/admin/login");
  console.log(`${revoked ? "PASS" : "FAIL"} sign-out revokes session (DELETE ${signout.status}, /admin shows dashboard: ${afterHtml.includes("Content overview")})`);
  if (!revoked) failed++;

  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exit(1);
});
