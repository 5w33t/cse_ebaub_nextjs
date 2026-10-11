"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

type Labels = { theme: string; light: string; dark: string; system: string };

const OPTIONS = [
  { value: "light", Icon: SunIcon, key: "light" },
  { value: "dark", Icon: MoonIcon, key: "dark" },
  { value: "system", Icon: MonitorIcon, key: "system" },
] as const;

/** Three-state segmented control. Labels are passed in so no copy is hardcoded on the public site. */
export function ThemeToggle({ labels }: { labels: Labels }) {
  const { theme, setTheme } = useTheme();
  // Hydration-safe "mounted" flag: false on the server and first client render, true afterwards.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label={labels.theme}
      className="hairline inline-flex items-center gap-0.5 rounded-full bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, Icon, key }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={labels[key]}
            title={labels[key]}
            onClick={() => setTheme(value)}
            className={[
              "flex size-8 items-center justify-center rounded-full transition-[background-color,color,transform] duration-500 ease-out-expo active:scale-[0.96]",
              active ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink",
            ].join(" ")}
          >
            <Icon size={16} weight="light" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
