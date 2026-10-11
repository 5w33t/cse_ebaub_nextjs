"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={cn("inline-flex h-10 cursor-pointer items-center gap-3", disabled && "cursor-not-allowed opacity-60", className)}>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="hairline relative h-6 w-11 shrink-0 rounded-full bg-paper-2 transition-[background-color] duration-500 ease-out-expo data-[state=checked]:bg-primary"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-[0_1px_2px_rgb(11_42_71/0.2)] transition-transform duration-500 ease-spring data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-primary-foreground" />
      </RadixSwitch.Root>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
