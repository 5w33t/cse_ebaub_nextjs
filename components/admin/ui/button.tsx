"use client";

import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "hairline bg-surface text-ink hover:bg-paper-2",
  ghost: "text-ink-muted hover:bg-paper-2 hover:text-ink",
  accent: "bg-accent text-accent-foreground hover:brightness-105",
  danger: "hairline bg-surface text-accent-text hover:bg-accent/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  /** Trailing icon nested in its own circle (button-in-button). */
  trailing?: ReactNode;
  leading?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", asChild, trailing, leading, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,color,transform,opacity,filter] duration-500 ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        trailing && (size === "sm" ? "pr-1" : "pr-1.5"),
        className,
      )}
      {...props}
    >
      {leading}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {trailing && (
        <span
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-full transition-transform duration-500 ease-out-expo group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105",
            size === "sm" ? "size-6" : "size-7",
            variant === "primary" ? "bg-white/10 dark:bg-black/10" : "bg-ink/5 dark:bg-white/10",
          )}
        >
          {trailing}
        </span>
      )}
    </Comp>
  );
});
