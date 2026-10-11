import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionTable, type Row } from "@/components/admin/collection-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/admin/ui/button";
import { getContentType } from "@/lib/admin/registry";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdminCollection, readTitle } from "@/lib/content/admin";

export async function generateMetadata({ params }: PageProps<"/admin/content/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  return { title: getContentType(collection)?.label ?? "Content" };
}

export default async function CollectionListPage({ params, searchParams }: PageProps<"/admin/content/[collection]">) {
  const { collection } = await params;
  const type = getContentType(collection);
  if (!type || type.kind !== "collection") notFound();

  const user = await requireAdmin(type.minRole ?? "contributor");
  const query = await searchParams;
  const status = query.status === "draft" || query.status === "published" ? query.status : undefined;
  const docs = await listAdminCollection(type, { status });

  const rows: Row[] = docs.map((d) => ({
    id: d.id,
    title: readTitle(d.data, type.titleField),
    status: String(d.data.status ?? "published"),
    updatedAt: typeof d.data.updatedAt === "string" ? d.data.updatedAt : "",
    cells: Object.fromEntries(
      (type.listColumns ?? []).map((col) => {
        const raw = d.data[col.name];
        let text = "";
        if (raw == null) text = "";
        else if (col.kind === "lstr") text = String((raw as { en?: string }).en ?? "");
        else if (col.kind === "bool") text = raw ? "Yes" : "";
        else if (col.kind === "date" || col.kind === "datetime") text = new Date(String(raw)).toLocaleString(undefined, col.kind === "date" ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" });
        else text = String(raw);
        return [col.name, text];
      }),
    ),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={type.group}
        title={type.label}
        description={type.description}
        actions={
          <Button asChild variant="primary" size="sm" leading={<PlusIcon size={14} strokeWidth={1.5} />}>
            <Link href={`/admin/content/${type.key}/new`}>New {type.singular.toLowerCase()}</Link>
          </Button>
        }
      />
      <CollectionTable typeKey={type.key} columns={type.listColumns ?? []} rows={rows} role={user.role} statusFilter={status ?? "all"} />
    </div>
  );
}
