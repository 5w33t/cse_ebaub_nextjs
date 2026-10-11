import type { Metadata } from "next";
import { InboxList } from "@/components/admin/inbox-list";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listMessages } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  await requireAdmin("editor");
  const messages = await listMessages();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Inbox" title="Contact messages" description="Messages sent through the public contact form. Reply from your own email client." />
      <InboxList messages={messages} />
    </div>
  );
}
