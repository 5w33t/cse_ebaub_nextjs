"use client";

import { useState } from "react";
import { Dialog } from "@/components/admin/ui/dialog";
import { Field, Input } from "@/components/admin/ui/input";
import { iconMap, iconNames } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  label,
  value,
  onChange,
  error,
  help,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
  help?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const Current = value ? iconMap[value] : undefined;
  const matches = iconNames.filter((n) => n.toLowerCase().includes(query.toLowerCase()));

  return (
    <Field label={label} error={error} help={help}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hairline flex h-10 flex-1 items-center gap-3 rounded-2xl bg-paper px-3 text-left text-sm transition-[background-color] duration-500 ease-out-expo hover:bg-surface"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-surface ring-1 ring-hairline">
            {Current ? <Current size={16} weight="light" /> : <span className="size-2 rounded-full bg-hairline" />}
          </span>
          <span className={cn(!value && "text-ink-muted")}>{value ?? "Choose an icon"}</span>
        </button>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-ink-muted hover:text-ink">
            Clear
          </button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="Choose an icon" size="lg">
        <div className="flex flex-col gap-4">
          <Input autoFocus placeholder="Search icons" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {matches.map((name) => {
              const Icon = iconMap[name];
              const active = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl ring-1 ring-hairline transition-[background-color,transform] duration-500 ease-out-expo hover:bg-paper-2 active:scale-[0.97]",
                    active && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  <Icon size={22} weight="light" />
                  <span className="max-w-full truncate px-1 text-[10px]">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Dialog>
    </Field>
  );
}
