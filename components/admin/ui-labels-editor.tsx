"use client";

import { PlusIcon, SaveIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveUiLabels } from "@/lib/actions/content";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input, inputClass } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "./ui/toaster";

type Dict = Record<string, string>;

export function UiLabelsEditor({ initial }: { initial: { en: Dict; bn: Dict } }) {
  const router = useRouter();
  const [en, setEn] = useState<Dict>(initial.en);
  const [bn, setBn] = useState<Dict>(initial.bn);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [newKey, setNewKey] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const keys = useMemo(() => {
    const all = [...new Set([...Object.keys(en), ...Object.keys(bn)])].sort();
    const q = query.trim().toLowerCase();
    return all.filter((k) => {
      if (filter === "missing" && bn[k]?.trim()) return false;
      if (!q) return true;
      return k.toLowerCase().includes(q) || (en[k] ?? "").toLowerCase().includes(q) || (bn[k] ?? "").toLowerCase().includes(q);
    });
  }, [en, bn, query, filter]);

  const missing = Object.keys(en).filter((k) => !bn[k]?.trim()).length;

  const setValue = (locale: "en" | "bn", key: string, value: string) => {
    (locale === "en" ? setEn : setBn)((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const addKey = () => {
    const k = newKey.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)) {
      toast.error("Keys are camelCase letters and digits only, e.g. readMore.");
      return;
    }
    if (k in en) {
      toast.error("That key already exists.");
      return;
    }
    setEn((prev) => ({ ...prev, [k]: "" }));
    setBn((prev) => ({ ...prev, [k]: "" }));
    setNewKey("");
    setDirty(true);
  };

  const removeKey = (k: string) => {
    setEn((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setBn((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setDirty(true);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveUiLabels({ en, bn });
      if (!result.ok) {
        toast.error(result.error, { description: result.issues?.map((i) => `${i.path}: ${i.message}`).join("\n") });
        return;
      }
      toast.success("UI labels saved.");
      setDirty(false);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-3 z-30">
        <div className="shell bg-paper-2/80 backdrop-blur-xl">
          <div className="core flex flex-wrap items-center gap-3 px-3 py-2">
            <div className="relative min-w-56 flex-1">
              <SearchIcon size={15} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
              <Input placeholder="Search keys or text" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "missing")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="missing">Missing Bangla {missing > 0 && <Badge tone="accent" className="ml-1.5 h-5 px-1.5">{missing}</Badge>}</TabsTrigger>
              </TabsList>
            </Tabs>
            {dirty && <Badge tone="accent">Unsaved</Badge>}
            <Button variant="primary" size="sm" disabled={pending || !dirty} onClick={save} trailing={<SaveIcon size={13} strokeWidth={1.5} />}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="core overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                <th className="w-48 px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">English</th>
                <th className="px-4 py-3 font-medium" lang="bn">বাংলা</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {keys.map((k) => (
                <tr key={k} className="align-top">
                  <td className="px-4 py-2 font-mono text-[12px] text-ink">{k}</td>
                  <td className="px-2 py-1.5">
                    <input value={en[k] ?? ""} onChange={(e) => setValue("en", k, e.target.value)} className={cn(inputClass, "h-9 py-1.5")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input lang="bn" value={bn[k] ?? ""} onChange={(e) => setValue("bn", k, e.target.value)} className={cn(inputClass, "h-9 py-1.5 text-[15px]", !bn[k]?.trim() && "shadow-[inset_3px_0_0_var(--accent)]")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => removeKey(k)} aria-label={`Remove ${k}`} className="flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-accent/10 hover:text-accent-text">
                      <Trash2Icon size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 px-4 py-3">
            <Input placeholder="newKeyName" mono value={newKey} onChange={(e) => setNewKey(e.target.value)} className="h-9 w-56 py-1.5" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKey())} />
            <Button size="sm" onClick={addKey} leading={<PlusIcon size={14} strokeWidth={1.5} />}>
              Add key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
