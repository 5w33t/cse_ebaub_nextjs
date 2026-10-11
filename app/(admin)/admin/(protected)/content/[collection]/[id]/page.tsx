import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/admin/form/document-editor";
import { PageHeader } from "@/components/admin/page-header";
import { emptyDocument } from "@/lib/admin/fields";
import { getContentType } from "@/lib/admin/registry";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminDocument, listRevisions, readTitle } from "@/lib/content/admin";

export async function generateMetadata({ params }: PageProps<"/admin/content/[collection]/[id]">): Promise<Metadata> {
  const { collection, id } = await params;
  const type = getContentType(collection);
  return { title: id === "new" ? `New ${type?.singular ?? "item"}` : (type?.label ?? "Edit") };
}

/** Create (`/new`) or edit one document of a collection. */
export default async function CollectionDocumentPage({ params }: PageProps<"/admin/content/[collection]/[id]">) {
  const { collection, id } = await params;
  const type = getContentType(collection);
  if (!type || type.kind !== "collection") notFound();

  const user = await requireAdmin(type.minRole ?? "contributor");
  const isNew = id === "new";
  const [doc, revisions] = isNew ? [null, []] : await Promise.all([getAdminDocument(type, id), listRevisions(type, id)]);
  if (!isNew && !doc) notFound();

  const initial = doc?.data ?? { ...emptyDocument(type.fields), ...(type.key === "courses" ? { programId: "bsc-in-cse" } : {}) };
  const title = isNew ? `New ${type.singular.toLowerCase()}` : readTitle(initial, type.titleField);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={type.label} title={title} />
      <DocumentEditor
        typeKey={type.key}
        typeLabel={type.label}
        fields={type.fields}
        id={isNew ? null : id}
        initial={initial}
        isNew={isNew}
        isSingleton={false}
        revisions={revisions}
        role={user.role}
        previewPath={!isNew ? type.previewPath?.(initial) : undefined}
        listHref={`/admin/content/${type.key}`}
        editHrefBase={`/admin/content/${type.key}`}
      />
    </div>
  );
}
