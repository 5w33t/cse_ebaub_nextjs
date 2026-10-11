"use client";

import { MailOpenIcon, MailIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMessage, markMessageRead } from "@/lib/actions/content";
import type { InboxMessage } from "@/lib/content/admin";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "./ui/toaster";

export function InboxList({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const open = messages.find((m) => m.id === openId) ?? null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      if (done) toast.success(done);
      router.refresh();
    });

  const select = (m: InboxMessage) => {
    setOpenId(m.id);
    if (!m.read) run(() => markMessageRead(m.id, true));
  };

  if (messages.length === 0) {
    return (
      <div className="shell">
        <div className="core px-6 py-16 text-center text-sm text-ink-muted">No messages yet.</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="shell lg:col-span-5">
        <ul className="core divide-y divide-hairline overflow-hidden">
          {messages.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => select(m)}
                className={cn("flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-[background-color] duration-500 ease-out-expo hover:bg-paper-2/70", openId === m.id && "bg-paper-2")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", m.read ? "text-ink-muted" : "font-medium text-ink")}>{m.subject || "(no subject)"}</span>
                  {!m.read && <Badge tone="accent">New</Badge>}
                </span>
                <span className="truncate text-xs text-ink-muted">
                  {m.name} · {m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="shell lg:col-span-7">
        <div className="core flex min-h-80 flex-col gap-5 p-5 sm:p-6">
          {open ? (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-display-sm text-ink">{open.subject || "(no subject)"}</h2>
                <p className="text-sm text-ink-muted">
                  {open.name} · <a href={`mailto:${open.email}`} className="text-secondary-text underline-offset-4 hover:underline">{open.email}</a>
                </p>
                <p className="text-xs text-ink-muted">{open.createdAt ? new Date(open.createdAt).toLocaleString() : ""}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{open.body}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button asChild size="sm" variant="primary">
                  <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}>Reply by email</a>
                </Button>
                <Button size="sm" disabled={pending} onClick={() => run(() => markMessageRead(open.id, !open.read))} leading={open.read ? <MailIcon size={14} strokeWidth={1.5} /> : <MailOpenIcon size={14} strokeWidth={1.5} />}>
                  Mark as {open.read ? "unread" : "read"}
                </Button>
                <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => deleteMessage(open.id), "Message deleted.")} leading={<Trash2Icon size={14} strokeWidth={1.5} />}>
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Select a message.</p>
          )}
        </div>
      </div>
    </div>
  );
}
