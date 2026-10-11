import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

/** Placeholder dashboard. The real modules arrive in delivery step 4 (Admin CMS). */
export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const denied = params.denied === "1";

  return (
    <main className="flex flex-col gap-8 py-8">
      {denied && (
        <p role="alert" className="rounded-2xl bg-accent/15 px-4 py-3 text-sm text-accent-text">
          Your role does not allow that page.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <span className="eyebrow w-max">Dashboard</span>
        <h1 className="font-display text-display-md text-ink">Content management</h1>
        <p className="max-w-prose text-ink-muted">
          Authentication is wired. The CMS modules (pages, academics, people, content, settings, users)
          are built in the next delivery step.
        </p>
      </div>
    </main>
  );
}
