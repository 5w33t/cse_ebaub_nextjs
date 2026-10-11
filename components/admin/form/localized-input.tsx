"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

export type LocalizedValue = { en: string; bn: string };

const LOCALES = [
  { key: "en", label: "EN", lang: "en" },
  { key: "bn", label: "বাংলা", lang: "bn" },
] as const;
type LocaleKey = (typeof LOCALES)[number]["key"];

/** The EN | বাংলা segmented control shared by all localized fields. */
export function LocaleSwitcher({
  active,
  onChange,
  value,
}: {
  active: LocaleKey;
  onChange: (locale: LocaleKey) => void;
  value: LocalizedValue;
}) {
  return (
    <div role="tablist" className="hairline inline-flex items-center gap-0.5 rounded-full bg-paper-2 p-0.5">
      {LOCALES.map((loc) => {
        const missing = loc.key === "bn" && Boolean(value.en?.trim()) && !value.bn?.trim();
        return (
          <button
            key={loc.key}
            type="button"
            role="tab"
            aria-selected={active === loc.key}
            lang={loc.lang}
            onClick={() => onChange(loc.key)}
            className={cn(
              "relative rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-[background-color,color] duration-500 ease-out-expo",
              active === loc.key ? "bg-surface text-ink shadow-[0_1px_2px_rgb(11_42_71/0.08)]" : "text-ink-muted hover:text-ink",
            )}
          >
            {loc.label}
            {missing && <span aria-label="Missing translation" className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}

export function LocalizedInput({
  label,
  value,
  onChange,
  multiline,
  rows,
  required,
  help,
  error,
  placeholder,
  id,
}: {
  label: string;
  value: LocalizedValue | undefined;
  onChange: (value: LocalizedValue) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  help?: string;
  error?: string;
  placeholder?: string;
  id?: string;
}) {
  const [active, setActive] = useState<LocaleKey>("en");
  const current: LocalizedValue = { en: value?.en ?? "", bn: value?.bn ?? "" };

  const set = (locale: LocaleKey, text: string) => onChange({ ...current, [locale]: text });

  const control = multiline ? (
    <Textarea
      id={id}
      lang={active}
      rows={rows}
      value={current[active]}
      onChange={(e) => set(active, e.target.value)}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      className={cn(active === "bn" && "font-sans text-[15px] leading-[1.75]")}
    />
  ) : (
    <Input
      id={id}
      lang={active}
      value={current[active]}
      onChange={(e) => set(active, e.target.value)}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      className={cn(active === "bn" && "text-[15px]")}
    />
  );

  return (
    <Field
      label={label}
      required={required}
      help={help}
      error={error}
      htmlFor={id}
      actions={
        <div className="flex items-center gap-2">
          {active === "bn" && current.en && !current.bn && (
            <button type="button" onClick={() => set("bn", current.en)} className="text-[11px] text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Copy English
            </button>
          )}
          <LocaleSwitcher active={active} onChange={setActive} value={current} />
        </div>
      }
    >
      {control}
    </Field>
  );
}
