import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isRole, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

/**
 * POST { idToken }  → verifies the Firebase ID token, requires an admin role claim,
 *                     mints an HTTP-only session cookie and mirrors the user into `users/{uid}`.
 * DELETE            → revokes refresh tokens for the session and clears the cookie.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = body?.idToken;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  const auth = adminAuth();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (!isRole(decoded.role)) {
    return NextResponse.json({ error: "This account has no admin role." }, { status: 403 });
  }

  const userRef = adminDb().doc(`users/${decoded.uid}`);
  const userSnap = await userRef.get();
  if (userSnap.exists && userSnap.data()?.disabled === true) {
    return NextResponse.json({ error: "This account is disabled." }, { status: 403 });
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  await userRef.set(
    {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
      role: decoded.role,
      disabled: false,
      lastLoginAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, role: decoded.role });
}

export async function DELETE() {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const decoded = await adminAuth().verifySessionCookie(cookie);
      await adminAuth().revokeRefreshTokens(decoded.sub);
    } catch {
      // Already invalid; clearing the cookie is enough.
    }
  }
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
