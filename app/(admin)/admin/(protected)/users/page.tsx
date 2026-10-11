import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listUsers } from "@/lib/content/admin";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdmin("superAdmin");
  const users = await listUsers();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Users"
        description="Super admins manage everything. Editors publish content. Contributors write drafts for an editor to publish. Inviting creates the account and gives you a password-setup link to send."
      />
      <UsersTable users={users} meUid={me.uid} />
    </div>
  );
}
