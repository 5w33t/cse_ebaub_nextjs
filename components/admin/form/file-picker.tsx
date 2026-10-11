"use client";

import { FileTextIcon, LinkIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { listFiles } from "@/lib/admin/manifest";
import { cn, formatBytes } from "@/lib/utils";
import { LocalizedInput, type LocalizedValue } from "./localized-input";

export type FileValue = { name: LocalizedValue; href: string; kind: "static" | "external" };

export function FilePicker({
  label,
  value,
  onChange,
  required,
  help,
  error,
}: {
  label: string;
  value: FileValue | undefined;
  onChange: (value: FileValue | undefined) => void;
  required?: boolean;
  help?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [external, setExternal] = useState("");
  const files = useMemo(() => listFiles().filter((f) => f.path.toLowerCase().includes(query.toLowerCase())), [query]);
  const externalValid = /^https:\/\/\S+$/.test(external.trim());

  return (
    <Field label={label} required={required} help={help} error={error}>
      <div className="frame">
        <div className="frame-inner flex flex-col gap-3 bg-surface p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="hairline flex h-10 flex-1 items-center gap-3 rounded-2xl bg-paper px-3 text-left text-sm transition-[background-color] duration-500 ease-out-expo hover:bg-surface"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-hairline text-ink-muted">
                {value?.kind === "external" ? <LinkIcon size={14} strokeWidth={1.5} /> : <FileTextIcon size={14} strokeWidth={1.5} />}
              </span>
              <span className={cn("truncate font-mono text-[12px]", !value && "font-sans text-sm text-ink-muted")}>{value?.href ?? "Choose a file or paste a link"}</span>
            </button>
            {value && (
              <button type="button" onClick={() => onChange(undefined)} aria-label="Remove file" className="text-ink-muted hover:text-ink">
                <XIcon size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
          {value && <LocalizedInput label="Display name" required value={value.name} onChange={(name) => onChange({ ...value, name })} />}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Attach a file" description="Static PDFs live in public/files. External links (Google Drive, etc.) must be https." size="lg">
        <Tabs defaultValue="static">
          <TabsList className="mb-4">
            <TabsTrigger value="static">From public/files</TabsTrigger>
            <TabsTrigger value="external">External link</TabsTrigger>
          </TabsList>
          <TabsContent value="static" className="flex flex-col gap-3">
            <Input placeholder="Search files" value={query} onChange={(e) => setQuery(e.target.value)} />
            {files.length === 0 ? (
              <p className="rounded-2xl bg-paper-2 px-4 py-8 text-center text-sm text-ink-muted">
                No files yet. Add PDFs under <code className="font-mono">public/files/</code>, commit, and redeploy.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ href: file.path, kind: "static", name: value?.name ?? { en: file.name.replace(/\.[^.]+$/, ""), bn: "" } });
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-[background-color] duration-500 ease-out-expo hover:bg-paper-2"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FileTextIcon size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" />
                        <span className="truncate font-mono text-[12px] text-ink">{file.path}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{formatBytes(file.bytes)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="external" className="flex flex-col gap-3">
            <Input placeholder="https://drive.google.com/…" value={external} onChange={(e) => setExternal(e.target.value)} />
            <div className="flex justify-end">
              <Button
                variant="primary"
                disabled={!externalValid}
                onClick={() => {
                  onChange({ href: external.trim(), kind: "external", name: value?.name ?? { en: "", bn: "" } });
                  setExternal("");
                  setOpen(false);
                }}
              >
                Use link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Dialog>
    </Field>
  );
}
