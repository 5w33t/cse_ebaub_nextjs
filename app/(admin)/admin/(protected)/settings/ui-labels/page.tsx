import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { UiLabelsEditor } from "@/components/admin/ui-labels-editor";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase/admin";
import { uiLabelsSchema } from "@/lib/schemas/ui";
import { serialize } from "@/lib/content/serialize";

export const metadata: Metadata = { title: "UI labels" };

export default async function UiLabelsPage() {
  await requireAdmin("superAdmin");
  const snap = await adminDb().doc("settings/ui").get();
  const parsed = uiLabelsSchema.safeParse(serialize(snap.data() ?? {}));
  const labels = parsed.success ? parsed.data : { en: {}, bn: {} };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="UI labels"
        description="Short interface strings: buttons, empty states, table headers, footer headings. Keys are referenced by the code; add a key only when a developer asks for it."
      />
      <UiLabelsEditor initial={labels} />
    </div>
  );
}
