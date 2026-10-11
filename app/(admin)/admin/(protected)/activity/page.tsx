import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/admin/ui/badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAuditLogs } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Activity log" };

const TONE: Record<string, "neutral" | "primary" | "accent" | "secondary" | "success"> = {
  create: "success",
  update: "secondary",
  publish: "success",
  unpublish: "neutral",
  delete: "accent",
  restore: "primary",
};

export default async function ActivityPage() {
  await requireAdmin("editor");
  const entries = await listAuditLogs(200);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Settings" title="Activity log" description="Who changed what, and when. The last 200 entries." />
      <div className="shell">
        <div className="core overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                <th className="px-4 py-3 font-medium whitespace-nowrap">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">Where</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                    Nothing recorded yet.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-muted">{e.at ? new Date(e.at).toLocaleString() : ""}</td>
                  <td className="px-4 py-2.5 text-ink">{e.email || e.uid}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={TONE[e.action] ?? "neutral"}>{e.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{e.summary}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink-muted">
                    {e.collection}/{e.docId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
