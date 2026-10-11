"use client";

import { ArrowUpRightIcon, EyeIcon, HistoryIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Badge, StatusBadge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Dialog } from "@/components/admin/ui/dialog";
import { Select } from "@/components/admin/ui/select";
import { toast } from "@/components/admin/ui/toaster";
import { deleteDocument, restoreRevision, saveDocument, type ActionResult } from "@/lib/actions/content";
import type { FieldSpec } from "@/lib/admin/fields";
import type { Role } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/session";
import type { Revision } from "@/lib/content/admin";
import { addKeys, FormBuilder, stripKeys, type FormErrors } from "./form-builder";

type Doc = Record<string, unknown>;

export function DocumentEditor({
  typeKey,
  typeLabel,
  fields,
  id,
  initial,
  isNew,
  isSingleton,
  revisions,
  role,
  previewPath,
  listHref,
  editHrefBase,
  description,
}: {
  typeKey: string;
  typeLabel: string;
  fields: FieldSpec[];
  id: string | null;
  initial: Doc;
  isNew: boolean;
  isSingleton: boolean;
  revisions: Revision[];
  role: Role;
  previewPath?: string;
  listHref?: string;
  /** For new collection docs: redirect to `${editHrefBase}/${id}` after the first save. */
  editHrefBase?: string;
  description?: string;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc>(() => addKeys(initial, fields));
  const [status, setStatus] = useState<"draft" | "published">((initial.status as "draft" | "published") ?? (isNew ? "draft" : "published"));
  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canPublish = roleAtLeast(role, "editor");
  const canDelete = !isSingleton && !isNew && roleAtLeast(role, "editor");

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = (next: Doc) => {
    setDoc(next);
    setDirty(true);
  };

  const handleResult = (result: ActionResult, successMessage: string): boolean => {
    if (!result.ok) {
      const map: FormErrors = {};
      for (const issue of result.issues ?? []) if (!map[issue.path]) map[issue.path] = issue.message;
      setErrors(map);
      toast.error(result.error, { description: result.issues?.length ? `${result.issues.length} field${result.issues.length > 1 ? "s" : ""} need attention.` : undefined });
      return false;
    }
    setErrors({});
    toast.success(successMessage);
    return true;
  };

  const save = (nextStatus: "draft" | "published" = status) => {
    startTransition(async () => {
      const payload = { ...stripKeys(doc, fields), status: nextStatus };
      const result = await saveDocument(typeKey, id, payload);
      if (handleResult(result, nextStatus === "published" ? "Published." : "Saved as draft.") && result.ok) {
        setDirty(false);
        setStatus(nextStatus);
        if (isNew && editHrefBase) router.replace(`${editHrefBase}/${result.id}`);
        else router.refresh();
      }
    });
  };

  const remove = () => {
    if (!id) return;
    startTransition(async () => {
      const result = await deleteDocument(typeKey, id);
      if (handleResult(result, "Deleted.")) router.push(listHref ?? "/admin");
    });
  };

  const restore = (revisionId: string) => {
    startTransition(async () => {
      const result = await restoreRevision(typeKey, id, revisionId);
      if (handleResult(result, "Version restored.")) {
        setHistoryOpen(false);
        router.refresh();
        const rev = revisions.find((r) => r.id === revisionId);
        if (rev) {
          setDoc(addKeys(rev.data, fields));
          setStatus((rev.data.status as "draft" | "published") ?? "draft");
          setDirty(false);
        }
      }
    });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky action bar: floating glass, detached from edges */}
      <div className="sticky top-3 z-30">
        <div className="shell backdrop-blur-xl bg-paper-2/80">
          <div className="core flex flex-wrap items-center gap-3 px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <StatusBadge status={status} />
              {dirty && <Badge tone="accent">Unsaved</Badge>}
              {errorCount > 0 && <Badge tone="accent">{errorCount} issue{errorCount > 1 ? "s" : ""}</Badge>}
              {description && <span className="hidden truncate text-xs text-ink-muted lg:inline">{description}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canPublish && (
                <div className="w-36">
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus((v as "draft" | "published") ?? "draft");
                      setDirty(true);
                    }}
                    items={[
                      { value: "draft", label: "Draft" },
                      { value: "published", label: "Published" },
                    ]}
                  />
                </div>
              )}
              {!isNew && previewPath && (
                <Button asChild size="sm" leading={<EyeIcon size={14} strokeWidth={1.5} />}>
                  <a href={`/api/draft?path=${encodeURIComponent(previewPath)}`} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                </Button>
              )}
              {!isNew && revisions.length > 0 && (
                <Button size="sm" onClick={() => setHistoryOpen(true)} leading={<HistoryIcon size={14} strokeWidth={1.5} />}>
                  History
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)} leading={<Trash2Icon size={14} strokeWidth={1.5} />}>
                  Delete
                </Button>
              )}
              <Button size="sm" variant="primary" disabled={pending} onClick={() => save()} trailing={<SaveIcon size={13} strokeWidth={1.5} />}>
                {pending ? "Saving…" : canPublish ? "Save" : "Save draft"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="core p-5 sm:p-8">
          <FormBuilder fields={fields} value={doc} onChange={update} errors={errors} />
        </div>
      </div>

      {listHref && (
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href={listHref}>← Back to {typeLabel.toLowerCase()}</Link>
          </Button>
        </div>
      )}

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen} title="Version history" description="The last 20 saves. Restoring creates a new version of the current state first.">
        <ul className="flex flex-col gap-2">
          {revisions.map((rev) => (
            <li key={rev.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-hairline">
              <div className="min-w-0">
                <p className="text-sm text-ink">{rev.savedAt ? new Date(rev.savedAt).toLocaleString() : rev.id}</p>
                <p className="truncate text-xs text-ink-muted">{rev.savedBy}</p>
              </div>
              <Button size="sm" disabled={pending} onClick={() => restore(rev.id)} trailing={<ArrowUpRightIcon size={12} strokeWidth={1.5} />}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this item?" description="A snapshot is kept in version history, but the public page disappears immediately.">
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" disabled={pending} onClick={remove}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
