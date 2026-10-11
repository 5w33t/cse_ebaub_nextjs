"use client";

import { AlertTriangleIcon, ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/admin/ui/dialog";
import { Field, Input } from "@/components/admin/ui/input";
import { Select } from "@/components/admin/ui/select";
import { findImage, imageFolders, listImages } from "@/lib/admin/manifest";
import { cn, formatBytes } from "@/lib/utils";
import { LocalizedInput, type LocalizedValue } from "./localized-input";

export type ImageValue = { src: string; alt: LocalizedValue };

/** Grid of manifest images with folder filter and search. Used by the picker dialog and the library page. */
export function ImageGrid({
  folder,
  onPick,
  selected,
}: {
  folder?: string;
  onPick: (src: string) => void;
  selected?: string;
}) {
  const [activeFolder, setActiveFolder] = useState<string | null>(folder ?? null);
  const [query, setQuery] = useState("");
  const folders = useMemo(() => imageFolders(), []);
  const images = useMemo(
    () => listImages(activeFolder ?? undefined).filter((i) => i.path.toLowerCase().includes(query.toLowerCase())),
    [activeFolder, query],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by file name" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:flex-1" />
        <div className="sm:w-56">
          <Select
            value={activeFolder}
            nullable
            placeholder="All folders"
            onValueChange={setActiveFolder}
            items={folders.map((f) => ({ value: f, label: f || "(root)" }))}
          />
        </div>
      </div>
      {images.length === 0 ? (
        <p className="rounded-2xl bg-paper-2 px-4 py-8 text-center text-sm text-ink-muted">
          No images here yet. Add files under <code className="font-mono">public/images/</code>, commit, and redeploy.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => (
            <button
              key={img.path}
              type="button"
              onClick={() => onPick(img.path)}
              className={cn(
                "frame group text-left transition-transform duration-500 ease-out-expo active:scale-[0.98]",
                selected === img.path && "ring-2 ring-ring",
              )}
            >
              <div className="frame-inner relative aspect-square bg-surface">
                {img.width > 0 ? (
                  <Image src={img.path} alt={img.name} fill sizes="200px" className="object-contain p-2 transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-muted">
                    <ImageIcon size={24} strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="px-2 pt-2 pb-1">
                <p className="truncate font-mono text-[11px] text-ink">{img.name}</p>
                <p className="text-[10px] text-ink-muted">
                  {img.width}×{img.height} · {formatBytes(img.bytes)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImagePicker({
  label,
  value,
  onChange,
  folder,
  required,
  help,
  error,
}: {
  label: string;
  value: ImageValue | undefined;
  onChange: (value: ImageValue | undefined) => void;
  folder?: string;
  required?: boolean;
  help?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const asset = value ? findImage(value.src) : undefined;
  const broken = Boolean(value?.src) && !asset && !value?.src.startsWith("https://");

  return (
    <Field label={label} required={required} help={help} error={error}>
      <div className="frame">
        <div className="frame-inner flex flex-col gap-3 bg-surface p-3 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-2 ring-1 ring-hairline sm:w-40"
            aria-label={value ? "Change image" : "Choose image"}
          >
            {value?.src ? (
              <Image src={value.src} alt="" fill sizes="160px" className="object-contain p-1" unoptimized={value.src.startsWith("https://")} />
            ) : (
              <span className="flex flex-col items-center gap-1 text-ink-muted">
                <ImageIcon size={22} strokeWidth={1.25} />
                <span className="text-[11px]">Choose image</span>
              </span>
            )}
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {value?.src && (
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-mono text-[11px] text-ink-muted">{value.src}</p>
                <button type="button" onClick={() => onChange(undefined)} aria-label="Remove image" className="shrink-0 text-ink-muted hover:text-ink">
                  <XIcon size={14} strokeWidth={1.5} />
                </button>
              </div>
            )}
            {broken && (
              <p className="flex items-center gap-1.5 text-xs text-accent-text">
                <AlertTriangleIcon size={13} strokeWidth={1.5} /> This file is not in the asset manifest. It may have been removed or renamed.
              </p>
            )}
            {value?.src && (
              <LocalizedInput label="Alt text" required value={value.alt} onChange={(alt) => onChange({ ...value, alt })} placeholder="Describe the image for screen readers" />
            )}
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Image library" description="Pick a static image from public/images. Uploads arrive with the Blaze plan." size="xl">
        <ImageGrid
          folder={folder}
          selected={value?.src}
          onPick={(src) => {
            onChange({ src, alt: value?.alt ?? { en: "", bn: "" } });
            setOpen(false);
          }}
        />
      </Dialog>
    </Field>
  );
}
