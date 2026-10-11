"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "core flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-0.5 px-4 py-3 shadow-ambient",
          title: "text-sm font-medium text-ink",
          description: "text-xs text-ink-muted",
        },
      }}
    />
  );
}
