"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "hairline w-full rounded-2xl bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-[box-shadow,background-color] duration-500 ease-out-expo focus:bg-surface focus:shadow-[0_0_0_2px_var(--ring)] disabled:opacity-60 aria-[invalid=true]:shadow-[0_0_0_2px_var(--accent)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(function Input(
  { className, mono, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, mono && "font-mono text-[13px]", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(inputClass, "resize-y leading-relaxed", className)} {...props} />;
});

/** Label, help text and error wrapper shared by every control. */
export function Field({
  label,
  help,
  error,
  required,
  htmlFor,
  children,
  className,
  actions,
}: {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ml-1 text-accent-text">*</span>}
        </label>
        {actions}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-accent-text">
          {error}
        </p>
      ) : help ? (
        <p className="text-xs text-ink-muted">{help}</p>
      ) : null}
    </div>
  );
}
