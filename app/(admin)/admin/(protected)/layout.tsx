import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/shell/admin-nav";
import { Toaster } from "@/components/admin/ui/toaster";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * The real authorization boundary for /admin/*.
 * requireAdmin() reads the session cookie, so it must run behind Suspense under Cache Components.
 * Everything inside the gate waits for the session; the skeleton outside renders immediately.
 */
export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <Gate>{children}</Gate>
      <Toaster />
    </Suspense>
  );
}

async function Gate({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:gap-6">
      <AdminNav user={{ email: user.email, role: user.role }} />
      <main className="min-w-0 flex-1 pb-24 lg:pt-2">{children}</main>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[110rem] gap-6 px-4 py-4">
      <div className="hidden h-[calc(100dvh-2rem)] w-72 animate-pulse rounded-[1.75rem] bg-paper-2 lg:block" />
      <div className="flex-1 space-y-4 pt-2">
        <div className="h-8 w-40 animate-pulse rounded-full bg-paper-2" />
        <div className="h-64 animate-pulse rounded-[1.75rem] bg-paper-2" />
      </div>
    </div>
  );
}
