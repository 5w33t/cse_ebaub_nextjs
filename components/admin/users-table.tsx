"use client";

import { CopyIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteUser, revokeUserSessions, setUserDisabled, setUserRole } from "@/lib/actions/users";
import { ROLES, type Role } from "@/lib/auth/session";
import type { AdminUserRow } from "@/lib/content/admin";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field, Input } from "./ui/input";
import { Select } from "./ui/select";
import { toast } from "./ui/toaster";

const ROLE_ITEMS = ROLES.map((r) => ({ value: r, label: r }));

export function UsersTable({ users, meUid }: { users: AdminUserRow[]; meUid: string }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      toast.success(done);
      router.refresh();
    });

  const invite = () =>
    startTransition(async () => {
      const result = await inviteUser(email, role);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLink(result.link ?? null);
      setEmail("");
      toast.success("Account ready. Send them the setup link.");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)} leading={<UserPlusIcon size={14} strokeWidth={1.5} />}>
          Invite user
        </Button>
      </div>

      <div className="shell">
        <div className="core overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Last login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {users.map((u) => {
                const isMe = u.uid === meUid;
                return (
                  <tr key={u.uid}>
                    <td className="px-4 py-2.5">
                      <p className="text-ink">
                        {u.email} {isMe && <Badge className="ml-1">you</Badge>}
                      </p>
                      <p className="font-mono text-[11px] text-ink-muted">{u.uid}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="w-36">
                        <Select value={u.role} items={ROLE_ITEMS} disabled={isMe || pending} onValueChange={(v) => v && run(() => setUserRole(u.uid, v as Role), "Role updated. They must sign in again.")} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{u.disabled ? <Badge tone="accent">Disabled</Badge> : <Badge tone="success">Active</Badge>}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap text-ink-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={pending} onClick={() => run(() => revokeUserSessions(u.uid), "Sessions revoked.")}>
                          Sign out everywhere
                        </Button>
                        <Button size="sm" variant={u.disabled ? "secondary" : "danger"} disabled={isMe || pending} onClick={() => run(() => setUserDisabled(u.uid, !u.disabled), u.disabled ? "Account enabled." : "Account disabled.")}>
                          {u.disabled ? "Enable" : "Disable"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={inviteOpen}
        onOpenChange={(o) => {
          setInviteOpen(o);
          if (!o) setLink(null);
        }}
        title="Invite a user"
        description="Creates the Firebase account with the chosen role. The Spark plan cannot email from the server, so copy the password-setup link and send it yourself."
      >
        {link ? (
          <div className="flex flex-col gap-3">
            <Field label="Password-setup link (valid for a limited time)">
              <div className="flex gap-2">
                <Input readOnly value={link} mono className="text-[11px]" />
                <Button
                  size="md"
                  onClick={() => {
                    navigator.clipboard.writeText(link).then(() => toast.success("Link copied"));
                  }}
                  leading={<CopyIcon size={14} strokeWidth={1.5} />}
                >
                  Copy
                </Button>
              </div>
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Email" required htmlFor="invite-email">
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ebaub.edu.bd" />
            </Field>
            <Field label="Role" htmlFor="invite-role">
              <Select id="invite-role" value={role} items={ROLE_ITEMS} onValueChange={(v) => v && setRole(v as Role)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={pending || !email} onClick={invite}>
                {pending ? "Creating…" : "Create account"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
