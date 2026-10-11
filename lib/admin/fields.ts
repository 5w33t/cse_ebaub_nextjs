/**
 * Declarative form field specs. The admin FormBuilder renders these; the Server Actions use them
 * to know which fields hold HTML (for sanitizing) and which hold localized strings (for translation gaps).
 */
export type SelectOption = { value: string; label: string };

type Base = {
  name: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Layout hint on wide screens. */
  width?: "full" | "half" | "third";
};

export type FieldSpec =
  | (Base & { kind: "text"; placeholder?: string; mono?: boolean })
  | (Base & { kind: "textarea"; rows?: number })
  | (Base & { kind: "slug"; from?: string })
  | (Base & { kind: "email" })
  | (Base & { kind: "url" })
  | (Base & { kind: "number"; min?: number; max?: number; step?: number; nullable?: boolean })
  | (Base & { kind: "boolean" })
  | (Base & { kind: "date" })
  | (Base & { kind: "datetime" })
  | (Base & { kind: "select"; options: SelectOption[]; nullable?: boolean })
  | (Base & { kind: "lstr"; placeholder?: string })
  | (Base & { kind: "lstrarea"; rows?: number })
  | (Base & { kind: "lhtml" })
  | (Base & { kind: "image"; folder?: string })
  | (Base & { kind: "file" })
  | (Base & { kind: "icon" })
  | (Base & { kind: "tags"; item: "text" | "lstr" | "code" })
  | (Base & {
      kind: "list";
      fields: FieldSpec[];
      itemTitle?: string;
      max?: number;
      sortable?: boolean;
      /** When set, each item is a bare image/file reference edited with the picker instead of sub-fields. */
      item?: "image" | "file";
      folder?: string;
    })
  | (Base & { kind: "object"; fields: FieldSpec[] })
  | (Base & { kind: "json" });

export type FieldKind = FieldSpec["kind"];

/** Short-hand constructors keep the registry readable. */
export const f = {
  text: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "text" }>> = {}): FieldSpec => ({ kind: "text", name, label, ...extra }),
  textarea: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "textarea" }>> = {}): FieldSpec => ({ kind: "textarea", name, label, ...extra }),
  slug: (name: string, label: string, from?: string): FieldSpec => ({ kind: "slug", name, label, from, required: true, width: "half" }),
  email: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "email", name, label, width: "half", ...extra }),
  url: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "url", name, label, width: "half", ...extra }),
  number: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "number" }>> = {}): FieldSpec => ({ kind: "number", name, label, width: "third", ...extra }),
  boolean: (name: string, label: string, help?: string): FieldSpec => ({ kind: "boolean", name, label, help, width: "third" }),
  date: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "date", name, label, width: "third", ...extra }),
  datetime: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "datetime", name, label, width: "half", ...extra }),
  select: (name: string, label: string, options: SelectOption[], extra: Partial<Extract<FieldSpec, { kind: "select" }>> = {}): FieldSpec => ({ kind: "select", name, label, options, width: "third", ...extra }),
  lstr: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "lstr" }>> = {}): FieldSpec => ({ kind: "lstr", name, label, required: true, ...extra }),
  lstrOptional: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "lstr" }>> = {}): FieldSpec => ({ kind: "lstr", name, label, required: false, ...extra }),
  lstrarea: (name: string, label: string, extra: Partial<Extract<FieldSpec, { kind: "lstrarea" }>> = {}): FieldSpec => ({ kind: "lstrarea", name, label, required: true, ...extra }),
  lhtml: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "lhtml", name, label, ...extra }),
  image: (name: string, label: string, folder?: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "image", name, label, folder, width: "half", ...extra }),
  file: (name: string, label: string, extra: Partial<Base> = {}): FieldSpec => ({ kind: "file", name, label, ...extra }),
  icon: (name: string, label: string): FieldSpec => ({ kind: "icon", name, label, width: "third" }),
  tags: (name: string, label: string, item: "text" | "lstr" | "code", extra: Partial<Base> = {}): FieldSpec => ({ kind: "tags", name, label, item, ...extra }),
  list: (name: string, label: string, fields: FieldSpec[], extra: Partial<Extract<FieldSpec, { kind: "list" }>> = {}): FieldSpec => ({ kind: "list", name, label, fields, sortable: true, ...extra }),
  object: (name: string, label: string, fields: FieldSpec[], extra: Partial<Base> = {}): FieldSpec => ({ kind: "object", name, label, fields, ...extra }),
  json: (name: string, label: string, help?: string): FieldSpec => ({ kind: "json", name, label, help }),
};

/** Depth-first walk of a field tree with the dotted path of each spec. */
export function walkFields(fields: FieldSpec[], visit: (spec: FieldSpec, path: string[]) => void, prefix: string[] = []) {
  for (const spec of fields) {
    const path = [...prefix, spec.name];
    visit(spec, path);
    if (spec.kind === "list" || spec.kind === "object") walkFields(spec.fields, visit, path);
  }
}

/** Produce an empty default value for a field so new documents render every control. */
export function emptyValue(spec: FieldSpec): unknown {
  switch (spec.kind) {
    case "text":
    case "textarea":
    case "slug":
    case "email":
    case "url":
    case "icon":
    case "date":
    case "datetime":
      return "";
    case "number":
      return spec.nullable ? null : 0;
    case "boolean":
      return false;
    case "select":
      return spec.nullable ? null : (spec.options[0]?.value ?? "");
    case "lstr":
    case "lstrarea":
    case "lhtml":
      return { en: "", bn: "" };
    case "image":
      return undefined;
    case "file":
      return undefined;
    case "tags":
    case "list":
      return [];
    case "object":
      return Object.fromEntries(spec.fields.map((child) => [child.name, emptyValue(child)]));
    case "json":
      return {};
  }
}

export function emptyDocument(fields: FieldSpec[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((spec) => [spec.name, emptyValue(spec)]));
}
