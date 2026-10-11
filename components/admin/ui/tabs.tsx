"use client";

import { Tabs as RadixTabs } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <RadixTabs.List className={cn("hairline inline-flex items-center gap-0.5 rounded-full bg-paper-2 p-0.5", className)}>{children}</RadixTabs.List>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-[background-color,color,transform] duration-500 ease-out-expo hover:text-ink active:scale-[0.98] data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-[0_1px_2px_rgb(11_42_71/0.08)]",
        className,
      )}
    >
      {children}
    </RadixTabs.Trigger>
  );
}
