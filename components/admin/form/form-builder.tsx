"use client";

import { WandSparklesIcon, XIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Select } from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import { emptyDocument, emptyValue, type FieldSpec } from "@/lib/admin/fields";
import { cn, slugify } from "@/lib/utils";
import { FilePicker, type FileValue } from "./file-picker";
import { IconPicker } from "./icon-picker";
import { ImagePicker, type ImageValue } from "./image-picker";
import { LocalizedInput, type LocalizedValue } from "./localized-input";
import { newKey, Repeatable, type Keyed } from "./repeatable";
import { RichTextField } from "./rich-text";

export type FormErrors = Record<string, string>;
type Doc = Record<string, unknown>;

/* ------------------------------------------------------------------ keys for list items */

export function addKeys(doc: Doc, fields: FieldSpec[]): Doc {
  const out: Doc = { ...doc };
  for (const spec of fields) {
    const v = out[spec.name];
    if (spec.kind === "tags" && spec.item === "lstr" && Array.isArray(v)) {
      // Stored as LStr[]; edited as keyed rows { value, _key }.
      out[spec.name] = v.map((item) => ({ value: item, _key: newKey() }));
    } else if (spec.kind === "list" && Array.isArray(v)) {
      out[spec.name] = v.map((item) => {
        const base = item && typeof item === "object" ? (item as Doc) : { value: item };
        const keyed = spec.item ? { ...base, _key: newKey() } : { ...addKeys(base, spec.fields), _key: newKey() };
        return keyed;
      });
    } else if (spec.kind === "object" && v && typeof v === "object") {
      out[spec.name] = addKeys(v as Doc, spec.fields);
    }
  }
  return out;
}

export function stripKeys(doc: Doc, fields: FieldSpec[]): Doc {
  const out: Doc = { ...doc };
  for (const spec of fields) {
    const v = out[spec.name];
    if (spec.kind === "tags" && spec.item === "lstr" && Array.isArray(v)) {
      out[spec.name] = v.map((item) => (item && typeof item === "object" && "value" in (item as Doc) ? (item as Doc).value : item));
    } else if (spec.kind === "list" && Array.isArray(v)) {
      out[spec.name] = v.map((item) => {
        if (!item || typeof item !== "object") return item;
        const { _key, ...rest } = item as Doc;
        void _key;
        return spec.item ? rest : stripKeys(rest, spec.fields);
      });
    } else if (spec.kind === "object" && v && typeof v === "object") {
      out[spec.name] = stripKeys(v as Doc, spec.fields);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ helpers */

const WIDTH: Record<NonNullable<FieldSpec["width"]>, string> = {
  full: "md:col-span-6",
  half: "md:col-span-3",
  third: "md:col-span-2",
};

function defaultWidth(spec: FieldSpec): NonNullable<FieldSpec["width"]> {
  if (spec.width) return spec.width;
  switch (spec.kind) {
    case "boolean":
    case "number":
    case "date":
    case "select":
    case "icon":
      return "third";
    case "slug":
    case "email":
    case "url":
    case "datetime":
    case "image":
      return "half";
    default:
      return "full";
  }
}

function toLocalDateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDateTime(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function titleOf(item: Doc, field: string | undefined): string {
  if (!field) return "";
  const v = item[field];
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const o = v as { en?: string; src?: string; href?: string };
    return o.en ?? o.src ?? o.href ?? "";
  }
  return String(v);
}

/* ------------------------------------------------------------------ tag inputs */

function TagInput({ label, value, onChange, mono, error, help, required }: { label: string; value: string[]; onChange: (v: string[]) => void; mono?: boolean; error?: string; help?: string; required?: boolean }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const parts = draft
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <Field label={label} error={error} help={help ?? "Press Enter to add."} required={required}>
      <div className="hairline flex flex-wrap items-center gap-1.5 rounded-2xl bg-paper px-2 py-1.5 focus-within:bg-surface focus-within:shadow-[0_0_0_2px_var(--ring)] transition-[box-shadow,background-color] duration-500 ease-out-expo">
        {value.map((tag, i) => (
          <span key={`${tag}-${i}`} className={cn("inline-flex h-7 items-center gap-1 rounded-full bg-surface pr-1 pl-2.5 text-[12px] text-ink ring-1 ring-hairline", mono && "font-mono")}>
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="flex size-5 items-center justify-center rounded-full text-ink-muted hover:bg-paper-2 hover:text-ink">
              <XIcon size={11} strokeWidth={1.5} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          className={cn("h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-ink-muted/60", mono && "font-mono text-[13px]")}
          placeholder={value.length ? "" : "Type and press Enter"}
        />
      </div>
    </Field>
  );
}

function JsonInput({ label, value, onChange, help, error }: { label: string; value: unknown; onChange: (v: unknown) => void; help?: string; error?: string }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [localError, setLocalError] = useState<string | undefined>();
  return (
    <Field label={label} help={help} error={localError ?? error}>
      <Textarea
        value={text}
        rows={8}
        className="font-mono text-[12px]"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          try {
            onChange(JSON.parse(text || "{}"));
            setLocalError(undefined);
          } catch {
            setLocalError("Not valid JSON.");
          }
        }}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ builder */

export function FormBuilder({
  fields,
  value,
  onChange,
  errors,
  path = [],
  columns = true,
}: {
  fields: FieldSpec[];
  value: Doc;
  onChange: (value: Doc) => void;
  errors: FormErrors;
  path?: string[];
  columns?: boolean;
}) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });
  const errorFor = (name: string) => errors[[...path, name].join(".")];

  return (
    <div className={cn("grid gap-5", columns && "md:grid-cols-6")}>
      {fields.map((spec) => {
        const v = value[spec.name];
        const err = errorFor(spec.name);
        const id = [...path, spec.name].join("-");
        const cls = columns ? WIDTH[defaultWidth(spec)] : undefined;
        const common = { label: spec.label, help: spec.help, error: err, required: spec.required };

        switch (spec.kind) {
          case "text":
          case "email":
          case "url":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Input id={id} type={spec.kind === "email" ? "email" : spec.kind === "url" ? "url" : "text"} mono={spec.kind === "text" && spec.mono} placeholder={spec.kind === "text" ? spec.placeholder : spec.kind === "url" ? "https://" : undefined} value={typeof v === "string" ? v : ""} onChange={(e) => set(spec.name, e.target.value)} aria-invalid={Boolean(err)} />
              </Field>
            );
          case "textarea":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Textarea id={id} rows={spec.rows} value={typeof v === "string" ? v : ""} onChange={(e) => set(spec.name, e.target.value)} aria-invalid={Boolean(err)} />
              </Field>
            );
          case "slug": {
            const sourceValue = spec.from ? value[spec.from] : undefined;
            const source = typeof sourceValue === "string" ? sourceValue : (sourceValue as { en?: string } | undefined)?.en ?? "";
            return (
              <Field
                key={spec.name}
                {...common}
                htmlFor={id}
                className={cls}
                actions={
                  source ? (
                    <button type="button" onClick={() => set(spec.name, slugify(source))} className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink">
                      <WandSparklesIcon size={12} strokeWidth={1.5} /> Generate
                    </button>
                  ) : undefined
                }
              >
                <Input id={id} mono value={typeof v === "string" ? v : ""} onChange={(e) => set(spec.name, slugify(e.target.value.replace(/\s+$/, "-")) || "")} aria-invalid={Boolean(err)} />
              </Field>
            );
          }
          case "number":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step ?? (Number.isInteger(spec.min) ? 1 : "any")}
                  value={typeof v === "number" ? v : ""}
                  onChange={(e) => set(spec.name, e.target.value === "" ? (spec.nullable ? null : 0) : Number(e.target.value))}
                  aria-invalid={Boolean(err)}
                />
              </Field>
            );
          case "boolean":
            return (
              <Field key={spec.name} label={spec.label} help={spec.help} error={err} className={cls} htmlFor={id}>
                <Switch id={id} checked={Boolean(v)} onCheckedChange={(c) => set(spec.name, c)} label={Boolean(v) ? "On" : "Off"} />
              </Field>
            );
          case "date":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Input id={id} type="date" value={typeof v === "string" ? v.slice(0, 10) : ""} onChange={(e) => set(spec.name, e.target.value)} aria-invalid={Boolean(err)} />
              </Field>
            );
          case "datetime":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Input id={id} type="datetime-local" value={toLocalDateTime(typeof v === "string" ? v : undefined)} onChange={(e) => set(spec.name, fromLocalDateTime(e.target.value))} aria-invalid={Boolean(err)} />
              </Field>
            );
          case "select":
            return (
              <Field key={spec.name} {...common} htmlFor={id} className={cls}>
                <Select id={id} value={typeof v === "string" ? v : null} nullable={spec.nullable} items={spec.options} onValueChange={(nv) => set(spec.name, nv)} />
              </Field>
            );
          case "lstr":
          case "lstrarea":
            return (
              <div key={spec.name} className={cls}>
                <LocalizedInput id={id} label={spec.label} help={spec.help} error={err} required={spec.required} multiline={spec.kind === "lstrarea"} rows={spec.kind === "lstrarea" ? spec.rows ?? 3 : undefined} placeholder={spec.kind === "lstr" ? spec.placeholder : undefined} value={v as LocalizedValue | undefined} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          case "lhtml":
            return (
              <div key={spec.name} className={cls}>
                <RichTextField label={spec.label} help={spec.help} error={err} required={spec.required} value={v as LocalizedValue | undefined} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          case "image":
            return (
              <div key={spec.name} className={cls}>
                <ImagePicker label={spec.label} help={spec.help} error={err} required={spec.required} folder={spec.folder} value={v as ImageValue | undefined} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          case "file":
            return (
              <div key={spec.name} className={cls}>
                <FilePicker label={spec.label} help={spec.help} error={err} required={spec.required} value={v as FileValue | undefined} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          case "icon":
            return (
              <div key={spec.name} className={cls}>
                <IconPicker label={spec.label} help={spec.help} error={err} value={typeof v === "string" ? v : undefined} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          case "tags": {
            if (spec.item === "lstr") {
              const items = (Array.isArray(v) ? v : []) as Keyed<{ value: LocalizedValue }>[];
              return (
                <Field key={spec.name} {...common} className={cls}>
                  <Repeatable
                    items={items}
                    onChange={(next) => set(spec.name, next)}
                    create={() => ({ value: { en: "", bn: "" } })}
                    itemTitle={(item) => item.value?.en ?? ""}
                    collapsible={false}
                    addLabel="Add"
                    renderItem={(item, update, i) => (
                      <LocalizedInput label={`${spec.label} ${i + 1}`} required value={item.value} onChange={(value) => update({ value })} error={errors[[...path, spec.name, String(i)].join(".")]} />
                    )}
                  />
                </Field>
              );
            }
            return (
              <div key={spec.name} className={cls}>
                <TagInput {...common} mono={spec.item === "code"} value={(Array.isArray(v) ? v : []).map(String)} onChange={(nv) => set(spec.name, spec.item === "code" ? nv.map((t) => t.toUpperCase().replace(/\s+/g, " ")) : nv)} />
              </div>
            );
          }
          case "list": {
            const items = (Array.isArray(v) ? v : []) as Keyed<Doc>[];
            const itemErrors = (i: number) => errors[[...path, spec.name, String(i)].join(".")];
            return (
              <Field key={spec.name} label={spec.label} help={spec.help} error={err} className={cls}>
                <Repeatable
                  items={items}
                  onChange={(next) => set(spec.name, next)}
                  max={spec.max}
                  sortable={spec.sortable !== false}
                  collapsible={!spec.item}
                  create={() => (spec.item === "image" ? { src: "", alt: { en: "", bn: "" } } : spec.item === "file" ? { name: { en: "", bn: "" }, href: "", kind: "static" } : emptyDocument(spec.fields))}
                  itemTitle={(item) => (spec.item ? titleOf(item, spec.item === "image" ? "src" : "href") : titleOf(item, spec.itemTitle))}
                  addLabel={`Add ${spec.label.toLowerCase().replace(/s$/, "")}`}
                  renderItem={(item, update, i) =>
                    spec.item === "image" ? (
                      <ImagePicker label="Image" required folder={spec.folder} value={item.src ? (item as unknown as ImageValue) : undefined} onChange={(nv) => update(nv ? { ...nv } : { src: "", alt: { en: "", bn: "" } })} error={itemErrors(i)} />
                    ) : spec.item === "file" ? (
                      <FilePicker label="File" required value={item.href ? (item as unknown as FileValue) : undefined} onChange={(nv) => update(nv ? { ...nv } : { name: { en: "", bn: "" }, href: "", kind: "static" })} error={itemErrors(i)} />
                    ) : (
                      <FormBuilder fields={spec.fields} value={item} onChange={(nv) => update(nv)} errors={errors} path={[...path, spec.name, String(i)]} />
                    )
                  }
                />
              </Field>
            );
          }
          case "object": {
            const obj = (v && typeof v === "object" ? v : emptyValue(spec)) as Doc;
            return (
              <fieldset key={spec.name} className={cn("shell", cls)}>
                <div className="core p-4 sm:p-5">
                  <legend className="float-left mb-4 w-full font-display text-display-sm text-ink">{spec.label}</legend>
                  {spec.help && <p className="-mt-2 mb-4 text-xs text-ink-muted">{spec.help}</p>}
                  <FormBuilder fields={spec.fields} value={obj} onChange={(nv) => set(spec.name, nv)} errors={errors} path={[...path, spec.name]} />
                </div>
              </fieldset>
            );
          }
          case "json":
            return (
              <div key={spec.name} className={cls}>
                <JsonInput label={spec.label} help={spec.help} error={err} value={v} onChange={(nv) => set(spec.name, nv)} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
