/**
 * Parses `public/resources/Syllabus V2 __ Final.md` into structured course records.
 *
 * The syllabus is a sequence of course blocks. Each block starts with a header table row
 * `|  Course Code:  CSE 1101 |  |  Credit Hour:  3 |  |  Total Marks:  100 |  |` and is followed by
 * title/status/type/prerequisite rows, a rationale paragraph, a COs table, a CO→PO mapping table,
 * a course outline table, an instructional strategy table, assessment details and recommended books.
 * Blocks are grouped under `## **1st Year 1st Semester**` headings; electives sit under
 * `## **Table - I**` (after 4th Year 1st Semester) and `## **Table - II**` (after 4th Year 2nd Semester).
 *
 *   npx tsx scripts/seed/parse-syllabus.ts        # prints a summary and anomalies
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ParsedClo = {
  code: string; // CO1
  text: string;
  taxonomy: string;
  poMap: string[]; // ["PO1", "PO5"]
  wk: string[]; // ["WK3"]
  wp: string[];
  ea: string[];
};

export type ParsedOutlineRow = { topic: string; weeks: number | null; cos: string[] };
export type ParsedStrategyRow = { co: string; instructional: string; assessment: string };
export type ParsedBook = { authors: string; title: string; isTextbook: boolean };

export type CourseStatus = "core" | "elective" | "ged";

export type ParsedCourse = {
  code: string; // "CSE 1101"
  slug: string; // "cse-1101"
  title: string;
  credit: number;
  totalMarks: number | null;
  type: "theory" | "lab";
  status: CourseStatus;
  electiveGroup: "I" | "II" | null;
  semester: number; // 1..8
  prerequisites: string[]; // course codes
  rationale: string; // plain text with markdown stripped
  clos: ParsedClo[];
  outline: ParsedOutlineRow[];
  strategies: ParsedStrategyRow[];
  books: ParsedBook[];
  anomalies: string[];
  sourceLine: number;
};

const ORDINAL = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 } as const;

/** Remove markdown emphasis and escapes, collapse whitespace. */
export function plain(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep bold as <strong>, unescape, wrap in a paragraph. */
export function toHtml(text: string): string {
  const inner = text
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\s+/g, " ")
    .trim();
  return inner ? `<p>${inner}</p>` : "";
}

function cells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  const parts = trimmed.split(/(?<!\\)\|/).map((c) => c.trim());
  // drop the empty strings produced by the leading and trailing pipes
  if (parts.length && parts[0] === "") parts.shift();
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts;
}

function isSeparatorRow(line: string): boolean {
  return /^\|\s*:?-{2,}/.test(line.trim());
}

function normalizeCode(raw: string): string {
  return plain(raw).toUpperCase().replace(/\s+/g, " ").replace(/^([A-Z]{2,4})\s*-?\s*(\d{4})$/, "$1 $2");
}

function splitCodes(raw: string): string[] {
  const text = plain(raw);
  if (!text || /^(none|nil|n\/a|-)$/i.test(text)) return [];
  const found = text.match(/[A-Z]{2,4}\s*-?\s*\d{4}/g) ?? [];
  return [...new Set(found.map(normalizeCode))];
}

function splitTags(raw: string, prefix: "PO" | "WK" | "WP" | "EA"): string[] {
  const text = plain(raw);
  if (!text) return [];
  const out = new Set<string>();
  for (const token of text.split(/[,\s/;&]+/)) {
    if (!token) continue;
    const m = token.match(/^(?:PO|WK|WP|EA|K)?\s*(\d{1,2})$/i);
    if (m) out.add(`${prefix}${Number(m[1])}`);
  }
  return [...out];
}

function parseCoRefs(raw: string): string[] {
  const text = plain(raw);
  const out = new Set<string>();
  for (const token of text.split(/[,\s/;&]+/)) {
    const m = token.match(/^(?:CO|CLO)?\s*(\d{1,2})$/i);
    if (m) out.add(`CO${Number(m[1])}`);
  }
  return [...out];
}

export function parseSyllabus(markdown: string): ParsedCourse[] {
  const lines = markdown.split(/\r?\n/);
  const courses: ParsedCourse[] = [];

  let semester = 0;
  let electiveGroup: "I" | "II" | null = null;

  // Locate block boundaries first.
  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*Course Code:/i.test(lines[i])) starts.push(i);
  }

  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const sem = line.match(/^##\s*\*{0,2}\s*(1st|2nd|3rd|4th) Year (1st|2nd) Semester/i);
    if (sem) {
      const year = ORDINAL[sem[1].toLowerCase() as keyof typeof ORDINAL];
      const term = ORDINAL[sem[2].toLowerCase() as keyof typeof ORDINAL];
      semester = (year - 1) * 2 + term;
      electiveGroup = null;
      continue;
    }
    const table = line.match(/^##\s*\*{0,2}\s*Table\s*\\?-\s*(I{1,2})\b/i);
    if (table) {
      electiveGroup = table[1].toUpperCase() as "I" | "II";
      continue;
    }

    if (starts[startIdx] !== i) continue;
    startIdx++;
    const end = starts[startIdx] ?? lines.length;
    const block = lines.slice(i, end);
    const course = parseBlock(block, i + 1, semester, electiveGroup);
    courses.push(course);
  }
  return courses;
}

function parseBlock(block: string[], sourceLine: number, semester: number, electiveGroup: "I" | "II" | null): ParsedCourse {
  const anomalies: string[] = [];
  const headerCells = cells(block[0]);
  const headerText = headerCells.join(" | ");

  const codeMatch = headerText.match(/Course Code:\s*\**\s*([A-Z]{2,4}\s*-?\s*\d{4})/i);
  const creditMatch = headerText.match(/Credit Hour[s]?:\s*\**\s*([\d.]+)/i);
  const marksMatch = headerText.match(/Total Marks:\s*\**\s*(\d+)/i);

  const code = codeMatch ? normalizeCode(codeMatch[1]) : `UNKNOWN-${sourceLine}`;
  if (!codeMatch) anomalies.push("course code not found");
  const credit = creditMatch ? Number(creditMatch[1]) : NaN;
  if (!Number.isFinite(credit)) anomalies.push("credit not found");
  const totalMarks = marksMatch ? Number(marksMatch[1]) : null;

  let title = "";
  let statusRaw = "";
  let typeRaw = "";
  let prerequisites: string[] = [];
  let rationale = "";
  const clos: ParsedClo[] = [];
  const poMapByCo = new Map<string, string[]>();
  const outline: ParsedOutlineRow[] = [];
  const strategies: ParsedStrategyRow[] = [];
  const books: ParsedBook[] = [];

  type Section = "none" | "cos" | "mapping" | "outline" | "strategy" | "assessment" | "books";
  let section: Section = "none";
  let mappingHeader: string[] = [];

  for (let j = 1; j < block.length; j++) {
    const line = block[j];
    const text = line.trim();
    if (!text) continue;

    // Header rows
    const t = text.match(/Course Title:\**\s*(.+?)\s*\|/i);
    if (t && !title) {
      title = plain(t[1]);
      continue;
    }
    const st = text.match(/Course Status:\**\s*([A-Za-z]+)/i);
    if (st) statusRaw = st[1];
    const ty = text.match(/Course Type:\**\s*([A-Za-z/ ]+?)\s*\|/i);
    if (ty) typeRaw = ty[1];
    if (st || ty) continue;
    const pr = text.match(/Prerequisite\(s\):\**\s*(.+?)\s*\|/i);
    if (pr) {
      prerequisites = splitCodes(pr[1]);
      continue;
    }

    // Section switches
    if (/^\*\*Rationale:\*\*/i.test(text)) {
      const value = plain(text.replace(/^\*\*Rationale:\*\*/i, ""));
      if (value) rationale = rationale ? `${rationale} ${value}` : value; // ignore a stray empty "Rationale:" line
      section = "none";
      continue;
    }
    if (/Course Outcomes \(COs\)/i.test(text) && !/Mapping/i.test(text)) {
      section = "cos";
      continue;
    }
    if (/Mapping of Course Outcomes/i.test(text)) {
      section = "mapping";
      mappingHeader = [];
      continue;
    }
    if (/^\*\*Course Outline/i.test(text)) {
      section = "outline";
      continue;
    }
    if (/^\*\*Assessment Details/i.test(text)) {
      section = "assessment";
      continue;
    }
    if (/^\*\*Recommended (Books|Readings|References)/i.test(text)) {
      section = "books";
      continue;
    }

    if (!text.startsWith("|") || isSeparatorRow(text)) continue;
    const row = cells(text);
    if (row.length === 0) continue;

    // A table whose first header cell is "COs" with "Instructional Strategy" switches to strategy
    if (/^COs?$/i.test(plain(row[0])) && row.some((c) => /Instructional/i.test(c))) {
      section = "strategy";
      continue;
    }

    switch (section) {
      case "cos": {
        if (/^COs?$/i.test(plain(row[0]))) continue; // header
        const co = plain(row[0]).toUpperCase().replace(/\s+/g, "");
        if (!/^C[OL]O?\d+$/.test(co)) continue;
        clos.push({
          code: co.replace(/^CLO/, "CO"),
          text: plain(row[1] ?? ""),
          taxonomy: plain(row[2] ?? ""),
          poMap: splitTags(row[3] ?? "", "PO"),
          wk: splitTags(row[4] ?? "", "WK"),
          wp: splitTags(row[5] ?? "", "WP"),
          ea: splitTags(row[6] ?? "", "EA"),
        });
        break;
      }
      case "mapping": {
        if (/^COs?$/i.test(plain(row[0]))) {
          mappingHeader = row.map((c) => plain(c).toUpperCase());
          continue;
        }
        const co = plain(row[0]).toUpperCase().replace(/\s+/g, "").replace(/^CLO/, "CO");
        if (!/^CO\d+$/.test(co)) continue;
        const pos: string[] = [];
        row.forEach((cell, idx) => {
          if (idx === 0) return;
          if (/✓|✔|√|x|yes|[1-3]/i.test(plain(cell))) {
            const header = mappingHeader[idx] ?? `PO${idx}`;
            pos.push(header.replace(/\s+/g, ""));
          }
        });
        poMapByCo.set(co, pos);
        break;
      }
      case "outline": {
        if (/^Course Content$/i.test(plain(row[0]))) continue;
        const topic = plain(row[0]);
        if (!topic) {
          // Continuation row with no topic text: fold its weeks and COs into the previous row.
          const prev = outline[outline.length - 1];
          if (prev) {
            const extraWeeks = Number(plain(row[1] ?? ""));
            if (Number.isFinite(extraWeeks) && plain(row[1] ?? "") !== "") prev.weeks = (prev.weeks ?? 0) + extraWeeks;
            prev.cos = [...new Set([...prev.cos, ...parseCoRefs(row[2] ?? "")])];
          }
          continue;
        }
        const weeksNum = Number(plain(row[1] ?? ""));
        outline.push({
          topic,
          weeks: Number.isFinite(weeksNum) && plain(row[1] ?? "") !== "" ? weeksNum : null,
          cos: parseCoRefs(row[2] ?? ""),
        });
        break;
      }
      case "strategy": {
        const co = plain(row[0]).toUpperCase().replace(/\s+/g, "").replace(/^CLO/, "CO");
        if (!/^CO\d+$/.test(co)) continue;
        strategies.push({ co, instructional: plain(row[1] ?? ""), assessment: plain(row[2] ?? "") });
        break;
      }
      case "books": {
        // | 1\. | Authors | : | Title, *Publisher* [Textbook] |   or   | 1\.   Authors | : | Title |
        const first = plain(row[0]);
        const merged = first.match(/^\d+\.?\s+(.+)$/);
        const numbered = /^\d+\.?$/.test(first) || Boolean(merged);
        if (!numbered) continue;
        const authors = merged ? merged[1].trim() : plain(row[1] ?? "");
        const rest = row.slice(merged ? 1 : 2).filter((c) => plain(c) !== ":");
        const titleRaw = rest.join(" ");
        books.push({
          authors,
          title: plain(titleRaw.replace(/\\?\[\s*Text\s*Book\s*\\?\]/i, "")),
          isTextbook: /Text\s*Book/i.test(titleRaw),
        });
        break;
      }
      default:
        break;
    }
  }

  // Merge mapping table into CLOs (the mapping table is authoritative; the COs table is a fallback).
  for (const clo of clos) {
    const mapped = poMapByCo.get(clo.code);
    if (mapped && mapped.length) clo.poMap = mapped;
    if (!clo.poMap.length) anomalies.push(`${clo.code} has no PO mapping`);
  }
  for (const co of poMapByCo.keys()) {
    if (!clos.some((c) => c.code === co)) anomalies.push(`${co} in mapping table but not in COs table`);
  }

  const status: CourseStatus = /elective|optional/i.test(statusRaw) ? "elective" : /ged|general/i.test(statusRaw) ? "ged" : "core";
  const type: "theory" | "lab" = /sessional|lab|practical/i.test(typeRaw) ? "lab" : "theory";

  // Known source typo: the 1st Year 2nd Semester "Electronic Devices and Circuits Sessional" is printed
  // as EEE 1104 (same as the 1st-semester lab it lists as its prerequisite). The numbering pattern
  // (x2xx for 2nd semester) makes EEE 1204 the intended code. Flagged for the department to confirm.
  let finalCode = code;
  if (code === "EEE 1104" && semester === 2) {
    finalCode = "EEE 1204";
    anomalies.push("source prints EEE 1104 for a 2nd-semester course; corrected to EEE 1204 (confirm with department)");
  }
  if (!title) anomalies.push("title not found");
  if (!statusRaw) anomalies.push("status not found");
  if (!typeRaw) anomalies.push("type not found");
  if (!rationale) anomalies.push("rationale not found");
  if (!clos.length) anomalies.push("no COs");
  if (!outline.length) anomalies.push("no outline");
  if (!books.length) anomalies.push("no books");
  if (semester === 0) anomalies.push("no semester heading before block");

  return {
    code: finalCode,
    slug: finalCode.toLowerCase().replace(/\s+/g, "-"),
    title,
    credit,
    totalMarks,
    type,
    status: electiveGroup ? "elective" : status,
    electiveGroup,
    semester,
    prerequisites,
    rationale,
    clos,
    outline,
    strategies,
    books,
    anomalies,
    sourceLine,
  };
}

export function loadSyllabusCourses(): ParsedCourse[] {
  const file = join(process.cwd(), "public", "resources", "Syllabus V2 __ Final.md");
  return parseSyllabus(readFileSync(file, "utf8"));
}

// CLI summary
if (process.argv[1] && /parse-syllabus\.(ts|js)$/.test(process.argv[1])) {
  const courses = loadSyllabusCourses();
  const bySemester = new Map<number, ParsedCourse[]>();
  for (const c of courses) bySemester.set(c.semester, [...(bySemester.get(c.semester) ?? []), c]);
  let total = 0;
  for (const [sem, list] of [...bySemester.entries()].sort((a, b) => a[0] - b[0])) {
    const required = list.filter((c) => c.status !== "elective");
    const creditSum = required.reduce((s, c) => s + (Number.isFinite(c.credit) ? c.credit : 0), 0);
    total += creditSum;
    console.log(`\nSemester ${sem}: ${list.length} courses (${required.length} required, ${creditSum} required credits)`);
    for (const c of list) {
      console.log(
        `  ${c.code.padEnd(9)} ${String(c.credit).padStart(3)}cr ${c.type.padEnd(6)} ${c.status.padEnd(8)}${c.electiveGroup ? "T" + c.electiveGroup : "  "} ${c.title}` +
          (c.prerequisites.length ? `  [pre: ${c.prerequisites.join(", ")}]` : "") +
          `  COs=${c.clos.length} outline=${c.outline.length} books=${c.books.length}`,
      );
    }
  }
  console.log(`\nTotal courses: ${courses.length}; core credits across semesters: ${total}`);
  const flagged = courses.filter((c) => c.anomalies.length);
  console.log(`\nAnomalies (${flagged.length} courses):`);
  for (const c of flagged) console.log(`  ${c.code} (line ${c.sourceLine}): ${c.anomalies.join("; ")}`);
  const dupes = courses.map((c) => c.code).filter((code, i, arr) => arr.indexOf(code) !== i);
  if (dupes.length) console.log(`\nDuplicate codes: ${[...new Set(dupes)].join(", ")}`);
}
