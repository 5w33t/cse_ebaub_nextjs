"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="hairline inline-flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-sm font-medium text-ink transition-[background-color,transform] duration-500 ease-out-expo hover:bg-paper-2 active:scale-[0.98] disabled:opacity-60"
    >
      <SignOutIcon size={16} weight="light" aria-hidden />
      Sign out
    </button>
  );
}
