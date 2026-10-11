import { Suspense, type ReactNode } from "react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * The real authorization boundary for /admin/*.
 * requireAdmin() reads the session cookie, so it must run behind Suspense under Cache Components.
 * Everything inside the gate waits for the session; the shell chrome outside it renders immediately.
 */
export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-site flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Admin</span>
          <span className="text-sm text-ink-muted">
            {user.email} · {user.role}
          </span>
        </div>
        <SignOutButton />
      </header>
      <div className="container-site flex-1 pb-24">{children}</div>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="container-site py-5">
      <div className="h-9 w-48 animate-pulse rounded-full bg-paper-2" />
    </div>
  );
}
