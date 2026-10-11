import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "accent" | "secondary" | "success";

const TONES: Record<Tone, string> = {
  neutral: "hairline bg-surface text-ink-muted",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary/15 text-secondary-text",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | undefined }) {
  if (status === "published") return <Badge tone="success">Published</Badge>;
  return <Badge tone="neutral">Draft</Badge>;
}
