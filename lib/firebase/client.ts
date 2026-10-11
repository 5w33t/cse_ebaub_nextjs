"use client";

/**
 * Browser Firebase SDK. Used only for Authentication on /admin/login.
 * Public pages never touch Firestore from the browser.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function firebaseClientApp(): FirebaseApp {
  if (getApps().length) return getApp();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
  return initializeApp({ apiKey, authDomain, projectId });
}

export function clientAuth(): Auth {
  return getAuth(firebaseClientApp());
}
