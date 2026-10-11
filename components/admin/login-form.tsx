"use client";

import { ArrowUpRightIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clientAuth } from "@/lib/firebase/client";
import { safeAdminPath } from "@/lib/auth/session";

type Mode = "signin" | "reset";

function describe(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again in a few minutes.";
      case "auth/user-disabled":
        return "This account is disabled.";
      case "auth/invalid-email":
        return "That email address is not valid.";
      default:
        return "Sign-in failed. Please try again.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeAdminPath(params.get("next"));

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const auth = clientAuth();
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice("If that address belongs to an admin account, a reset link is on its way.");
        setMode("signin");
        return;
      }
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        await signOut(auth);
        throw new Error(data.error ?? "Sign-in was rejected.");
      }
      // The browser SDK session is no longer needed; the HTTP-only cookie carries the admin session.
      await signOut(auth);
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "hairline w-full rounded-2xl bg-paper px-4 py-3 text-ink placeholder:text-ink-muted/70 outline-none transition-shadow duration-500 ease-out-expo focus:shadow-[0_0_0_2px_var(--ring)]";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      {mode === "signin" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-accent/15 px-4 py-3 text-sm text-accent-text">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-2xl bg-secondary/15 px-4 py-3 text-sm text-secondary-text">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="group mt-2 inline-flex items-center justify-between gap-3 rounded-full bg-primary py-2.5 pr-2.5 pl-6 font-medium text-primary-foreground transition-[transform,opacity] duration-500 ease-out-expo active:scale-[0.98] disabled:opacity-60"
      >
        {mode === "signin" ? "Sign in" : "Send reset link"}
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 ease-out-expo group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 dark:bg-black/10"
        >
          {busy ? <SpinnerGapIcon size={16} className="animate-spin" /> : <ArrowUpRightIcon size={16} weight="light" />}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "reset" : "signin");
          setError(null);
          setNotice(null);
        }}
        className="self-start text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {mode === "signin" ? "Forgot password?" : "Back to sign in"}
      </button>
    </form>
  );
}
