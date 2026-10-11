"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";
import { cn } from "@/lib/utils";
import { inputClass } from "./input";

export type SelectItem = { value: string; label: string };

const NONE = "__none__";

export function Select({
  value,
  onValueChange,
  items,
  placeholder = "Select…",
  nullable,
  id,
  disabled,
  className,
}: {
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  items: SelectItem[];
  placeholder?: string;
  nullable?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixSelect.Root
      value={value ?? (nullable ? NONE : undefined)}
      onValueChange={(v) => onValueChange(v === NONE ? null : v)}
      disabled={disabled}
    >
      <RadixSelect.Trigger id={id} className={cn(inputClass, "flex items-center justify-between gap-2 text-left", className)} aria-label={placeholder}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDownIcon size={16} strokeWidth={1.5} className="text-ink-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-surface p-1 shadow-ambient ring-1 ring-hairline data-[state=open]:anim-rise-in"
        >
          <RadixSelect.Viewport>
            {nullable && (
              <RadixSelect.Item value={NONE} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-muted outline-none data-[highlighted]:bg-paper-2">
                <RadixSelect.ItemText>None</RadixSelect.ItemText>
              </RadixSelect.Item>
            )}
            {items.map((item) => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper-2"
              >
                <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <CheckIcon size={14} strokeWidth={1.5} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
