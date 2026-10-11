import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardStats, getTranslationGaps, listAuditLogs } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  // Layouts and pages render in parallel under Cache Components, so the layout's gate alone does not
  // stop this page from fetching. Every admin page must gate itself before reading data.
  await requireAdmin();
  const params = await searchParams;
  const denied = params.denied === "1";
  const [stats, gaps, activity] = await Promise.all([getDashboardStats(), getTranslationGaps(), listAuditLogs(8)]);

  const tiles = [
    { label: "Notices", value: stats.notices, href: "/admin/content/notices", span: "lg:col-span-3" },
    { label: "News and events", value: stats.events, href: "/admin/content/events", span: "lg:col-span-3" },
    { label: "Faculty", value: stats.faculty, href: "/admin/content/faculty", span: "lg:col-span-2" },
    { label: "Courses", value: stats.courses, href: "/admin/content/courses", span: "lg:col-span-2" },
    { label: "Drafts", value: stats.drafts, href: "/admin/content/notices?status=draft", span: "lg:col-span-2" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {denied && (
        <p role="alert" className="rounded-2xl bg-accent/15 px-4 py-3 text-sm text-accent-text">
          Your role does not allow that page.
        </p>
      )}
      <PageHeader
        eyebrow="Dashboard"
        title="Content overview"
        description="Everything the public site shows is edited here. Changes go live on the next request after you publish."
        actions={
          <>
            <Button asChild variant="primary" size="sm" trailing={<ArrowUpRightIcon size={13} strokeWidth={1.5} />}>
              <Link href="/admin/content/notices/new">New notice</Link>
            </Button>
            <Button asChild size="sm" trailing={<ArrowUpRightIcon size={13} strokeWidth={1.5} />}>
              <Link href="/admin/content/events/new">New event</Link>
            </Button>
          </>
        }
      />

      {/* Asymmetrical bento of counts */}
      <section className="grid gap-4 lg:grid-cols-12">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className={`shell group ${tile.span} transition-transform duration-700 ease-out-expo hover:-translate-y-1`}>
            <div className="core flex h-full flex-col justify-between gap-6 p-5 transition-shadow duration-700 ease-out-expo group-hover:shadow-ambient">
              <span className="eyebrow w-max">{tile.label}</span>
              <span className="font-display text-display-lg text-ink">{tile.value}</span>
            </div>
          </Link>
        ))}
        <Link href="/admin/inbox" className="shell group lg:col-span-4 transition-transform duration-700 ease-out-expo hover:-translate-y-1">
          <div className="core flex h-full flex-col justify-between gap-6 bg-primary p-5 text-primary-foreground">
            <span className="eyebrow w-max bg-white/10 text-primary-foreground shadow-none">Inbox</span>
            <div>
              <span className="font-display text-display-lg">{stats.unreadMessages}</span>
              <p className="text-sm opacity-80">unread message{stats.unreadMessages === 1 ? "" : "s"}</p>
            </div>
          </div>
        </Link>
        <div className="shell lg:col-span-8">
          <div className="core flex h-full flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow w-max">Bangla translations</span>
              <Badge tone={gaps.total ? "accent" : "success"}>{gaps.total ? `${gaps.total} missing` : "Complete"}</Badge>
            </div>
            {gaps.docs.length === 0 ? (
              <p className="text-sm text-ink-muted">Every bilingual field has a Bangla value.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {gaps.docs.slice(0, 6).map((gap) => (
                  <li key={`${gap.type.key}-${gap.id}`} className="flex items-center justify-between gap-3 py-2">
                    <Link href={gap.href} className="flex min-w-0 flex-col hover:underline underline-offset-4">
                      <span className="truncate text-sm text-ink">{gap.title}</span>
                      <span className="text-[11px] text-ink-muted">{gap.type.label}</span>
                    </Link>
                    <span className="shrink-0 font-mono text-xs text-ink-muted">{gap.missing}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="shell">
        <div className="core p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow w-max">Recent activity</span>
            <Link href="/admin/activity" className="text-xs text-ink-muted hover:text-ink">
              All activity
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-ink-muted">No changes recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-ink">{entry.summary}</span>
                  <span className="text-[11px] text-ink-muted">
                    {entry.email} · {entry.at ? new Date(entry.at).toLocaleString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
