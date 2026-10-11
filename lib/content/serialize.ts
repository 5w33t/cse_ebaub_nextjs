import { DocumentReference, GeoPoint, Timestamp } from "firebase-admin/firestore";

/**
 * Convert Firestore data into plain JSON so it can be returned from `use cache` functions
 * and passed to Client Components. Timestamps become ISO strings, references become paths.
 */
export function serialize<T = unknown>(value: unknown): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value == null) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof DocumentReference) return value.path;
  if (value instanceof GeoPoint) return { latitude: value.latitude, longitude: value.longitude };
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = walk(inner);
    }
    return out;
  }
  return value;
}
