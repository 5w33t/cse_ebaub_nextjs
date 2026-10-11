import DOMPurify from "isomorphic-dompurify";
import { walkFields, type FieldSpec } from "./fields";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote", "code", "pre",
  "h2", "h3", "h4", "hr", "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption", "sup", "sub",
];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "colspan", "rowspan", "title"];

/** Strip scripts, inline styles and colours so editor content follows the theme. */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["style", "color", "bgcolor", "font", "class", "id", "onclick"],
    ALLOW_DATA_ATTR: false,
  });
}

function setAt(obj: Record<string, unknown>, path: string[], fn: (v: unknown) => unknown) {
  const [head, ...rest] = path;
  if (head === undefined || obj == null || typeof obj !== "object") return;
  if (rest.length === 0) {
    obj[head] = fn(obj[head]);
    return;
  }
  const next = obj[head];
  if (Array.isArray(next)) {
    for (const item of next) if (item && typeof item === "object") setAt(item as Record<string, unknown>, rest, fn);
  } else if (next && typeof next === "object") {
    setAt(next as Record<string, unknown>, rest, fn);
  }
}

/** Sanitize every `lhtml` field (in both locales) according to the content type's field spec. */
export function sanitizeDocument<T extends Record<string, unknown>>(data: T, fields: FieldSpec[]): T {
  const clone = structuredClone(data);
  walkFields(fields, (spec, path) => {
    if (spec.kind !== "lhtml") return;
    setAt(clone, path, (value) => {
      if (!value || typeof value !== "object") return value;
      const v = value as { en?: unknown; bn?: unknown };
      return {
        en: typeof v.en === "string" ? sanitizeHtml(v.en) : "",
        bn: typeof v.bn === "string" ? sanitizeHtml(v.bn) : "",
      };
    });
  });
  return clone;
}
