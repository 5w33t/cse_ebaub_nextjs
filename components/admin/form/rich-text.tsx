"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  RedoIcon,
  UnderlineIcon,
  UndoIcon,
  UnlinkIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Field } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";
import { LocaleSwitcher, type LocalizedValue } from "./localized-input";

type LocaleKey = "en" | "bn";

function ToolbarButton({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-ink-muted transition-[background-color,color,transform] duration-500 ease-out-expo hover:bg-paper-2 hover:text-ink active:scale-[0.96]",
        active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL (https://… or /path)", previous ?? "https://");
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><BoldIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><ItalicIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2Icon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3Icon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><ListIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrderedIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><QuoteIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><CodeIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><MinusIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><UnlinkIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}><UndoIcon size={15} strokeWidth={1.5} /></ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}><RedoIcon size={15} strokeWidth={1.5} /></ToolbarButton>
    </div>
  );
}

/** One Tiptap instance for one locale. Re-keyed by the parent when the locale switches. */
function SingleEditor({ value, onChange, lang }: { value: string; onChange: (html: string) => void; lang: LocaleKey }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Placeholder.configure({ placeholder: lang === "bn" ? "এখানে লিখুন…" : "Write here…" }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        lang,
        class: cn("prose-academic min-h-[220px] px-4 py-3 outline-none", lang === "bn" && "text-[15px] leading-[1.75]"),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // Sync external resets (e.g. restoring a revision) without clobbering in-progress typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return <div className="min-h-[220px] animate-pulse bg-paper-2/60" />;
  return (
    <>
      <div className="hairline-b border-b border-hairline">
        <Toolbar editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </>
  );
}

export function RichTextField({
  label,
  value,
  onChange,
  help,
  error,
  required,
}: {
  label: string;
  value: LocalizedValue | undefined;
  onChange: (value: LocalizedValue) => void;
  help?: string;
  error?: string;
  required?: boolean;
}) {
  const [active, setActive] = useState<LocaleKey>("en");
  const current: LocalizedValue = { en: value?.en ?? "", bn: value?.bn ?? "" };

  return (
    <Field
      label={label}
      help={help}
      error={error}
      required={required}
      actions={
        <div className="flex items-center gap-2">
          {active === "bn" && current.en && !current.bn && (
            <button type="button" onClick={() => onChange({ ...current, bn: current.en })} className="text-[11px] text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Copy English
            </button>
          )}
          <LocaleSwitcher active={active} onChange={setActive} value={current} />
        </div>
      }
    >
      <div className={cn("hairline overflow-hidden rounded-2xl bg-paper transition-shadow duration-500 ease-out-expo focus-within:bg-surface focus-within:shadow-[0_0_0_2px_var(--ring)]", error && "shadow-[0_0_0_2px_var(--accent)]")}>
        <SingleEditor key={active} lang={active} value={current[active]} onChange={(html) => onChange({ ...current, [active]: html })} />
      </div>
    </Field>
  );
}
