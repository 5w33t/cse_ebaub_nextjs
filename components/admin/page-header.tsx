import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 py-2 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        <span className="eyebrow w-max">{eyebrow}</span>
        <h1 className="font-display text-display-md text-ink">{title}</h1>
        {description && <p className="max-w-prose text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
