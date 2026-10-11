"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { bulkDelete, bulkSetStatus } from "@/lib/actions/content";
import type { ListColumn } from "@/lib/admin/registry";
import { roleAtLeast, type Role } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "./ui/toaster";

export type Row = { id: string; title: string; status: string; updatedAt: string; cells: Record<string, string> };

export function CollectionTable({
  typeKey,
  columns,
  rows,
  role,
  statusFilter,
}: {
  typeKey: string;
  columns: ListColumn[];
  rows: Row[];
  role: Role;
  statusFilter: "all" | "draft" | "published";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditor = roleAtLeast(role, "editor");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || Object.values(r.cells).some((c) => c.toLowerCase().includes(q)));
  }, [rows, query]);

  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      toast.success(done);
      setSelected(new Set());
      setConfirm(false);
      router.refresh();
    });

  const ids = [...selected];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <SearchIcon size={15} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
          <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => router.push(v === "all" ? `/admin/content/${typeKey}` : `/admin/content/${typeKey}?status=${v}`)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isEditor && ids.length > 0 && (
        <div className="shell anim-rise-in">
          <div className="core flex flex-wrap items-center gap-2 px-3 py-2">
            <span className="mr-2 text-sm text-ink">
              {ids.length} selected
            </span>
            <Button size="sm" disabled={pending} onClick={() => run(() => bulkSetStatus(typeKey, ids, "published"), "Published.")}>
              Publish
            </Button>
            <Button size="sm" disabled={pending} onClick={() => run(() => bulkSetStatus(typeKey, ids, "draft"), "Unpublished.")}>
              Unpublish
            </Button>
            <Button size="sm" variant="danger" disabled={pending} onClick={() => setConfirm(true)}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="shell">
        <div className="core overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                {isEditor && (
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className="size-4 accent-[var(--primary)]" />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Title</th>
                {columns.map((c) => (
                  <th key={c.name} className="px-4 py-3 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 4} className="px-4 py-10 text-center text-ink-muted">
                    Nothing matches.
                  </td>
                </tr>
              )}
              {visible.map((row) => (
                <tr key={row.id} className={cn("transition-[background-color] duration-500 ease-out-expo hover:bg-paper-2/60", selected.has(row.id) && "bg-paper-2/80")}>
                  {isEditor && (
                    <td className="px-4 py-2.5">
                      <input type="checkbox" aria-label={`Select ${row.title}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="size-4 accent-[var(--primary)]" />
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/content/${typeKey}/${row.id}`} className="font-medium text-ink underline-offset-4 hover:underline">
                      {row.title}
                    </Link>
                    <p className="font-mono text-[11px] text-ink-muted">{row.id}</p>
                  </td>
                  {columns.map((c) => (
                    <td key={c.name} className={cn("px-4 py-2.5 text-ink-muted", c.kind === "number" && "font-mono tabular-nums")}>
                      {row.cells[c.name]}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-muted">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm} title={`Delete ${ids.length} item${ids.length === 1 ? "" : "s"}?`} description="Snapshots stay in version history, but the public pages disappear immediately.">
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" disabled={pending} onClick={() => run(() => bulkDelete(typeKey, ids), "Deleted.")}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
