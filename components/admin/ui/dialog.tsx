"use client";

import { XIcon } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Modal built on Radix Dialog. The overlay is the only place in the admin that uses backdrop-blur.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  trigger?: ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm data-[state=open]:anim-fade-in data-[state=closed]:anim-fade-out" />
        <RadixDialog.Content
          className={cn(
            "shell fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:anim-pop-in data-[state=closed]:anim-fade-out",
            size === "md" && "max-w-lg",
            size === "lg" && "max-w-3xl",
            size === "xl" && "max-w-6xl",
          )}
        >
          <div className="core flex max-h-[85dvh] flex-col">
            <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
              <div className="flex flex-col gap-1">
                <RadixDialog.Title className="font-display text-display-sm text-ink">{title}</RadixDialog.Title>
                {description && <RadixDialog.Description className="text-sm text-ink-muted">{description}</RadixDialog.Description>}
              </div>
              <RadixDialog.Close
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-[background-color,color] duration-500 ease-out-expo hover:bg-paper-2 hover:text-ink"
              >
                <XIcon size={18} strokeWidth={1.5} />
              </RadixDialog.Close>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;
