"use client";

import { CheckIcon, CopyIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { ImageGrid } from "@/components/admin/form/image-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { toast } from "@/components/admin/ui/toaster";
import { listFiles } from "@/lib/admin/manifest";
import { formatBytes } from "@/lib/utils";

export function ImageLibrary() {
  const [copied, setCopied] = useState<string | null>(null);
  const files = listFiles();

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      toast.success("Path copied", { description: path });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy. Select and copy the path manually.");
    }
  };

  return (
    <Tabs defaultValue="images">
      <TabsList className="mb-4">
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="images">
        <div className="shell">
          <div className="core p-4 sm:p-5">
            <ImageGrid onPick={copy} selected={copied ?? undefined} />
            <p className="mt-4 text-xs text-ink-muted">Click an image to copy its path.</p>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="files">
        <div className="shell">
          <div className="core p-2">
            {files.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-muted">
                No files yet. Add PDFs under <code className="font-mono">public/files/</code>.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {files.map((file) => (
                  <li key={file.path} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-3">
                      <FileTextIcon size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" />
                      <span className="truncate font-mono text-[12px] text-ink">{file.path}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-[11px] text-ink-muted">{formatBytes(file.bytes)}</span>
                      <button type="button" onClick={() => copy(file.path)} aria-label="Copy path" className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper-2 hover:text-ink">
                        {copied === file.path ? <CheckIcon size={14} strokeWidth={1.5} /> : <CopyIcon size={14} strokeWidth={1.5} />}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
