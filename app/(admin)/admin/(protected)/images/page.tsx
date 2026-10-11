import type { Metadata } from "next";
import { ImageLibrary } from "@/components/admin/image-library";
import { PageHeader } from "@/components/admin/page-header";
import { manifest } from "@/lib/admin/manifest";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Image library" };

export default async function ImageLibraryPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Library"
        title="Images and files"
        description={`Read-only view of public/images and public/files. ${manifest.images.length} images, ${manifest.files.length} files. To add one: drop it in the right folder, commit, push; Vercel redeploys and it appears here.`}
      />
      <ImageLibrary />
    </div>
  );
}
