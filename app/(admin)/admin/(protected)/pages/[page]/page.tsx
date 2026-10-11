import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/admin/form/document-editor";
import { PageHeader } from "@/components/admin/page-header";
import { getContentType } from "@/lib/admin/registry";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminDocument, listRevisions } from "@/lib/content/admin";

export async function generateMetadata({ params }: PageProps<"/admin/pages/[page]">): Promise<Metadata> {
  const { page } = await params;
  return { title: getContentType(page)?.label ?? "Page" };
}

/** Editor for singleton documents: pages/*, settings/site, obe/framework. */
export default async function SingletonEditorPage({ params }: PageProps<"/admin/pages/[page]">) {
  const { page } = await params;
  const type = getContentType(page);
  if (!type || type.kind !== "singleton") notFound();

  const user = await requireAdmin(type.minRole ?? "contributor");
  const [doc, revisions] = await Promise.all([getAdminDocument(type), listRevisions(type)]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={type.group} title={type.label} description={type.description} />
      <DocumentEditor
        typeKey={type.key}
        typeLabel={type.label}
        fields={type.fields}
        id={null}
        initial={doc?.data ?? {}}
        isNew={!doc}
        isSingleton
        revisions={revisions}
        role={user.role}
        previewPath={type.previewPath?.(doc?.data ?? {})}
      />
    </div>
  );
}
