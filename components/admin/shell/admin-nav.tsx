"use client";

import {
  BookOpenIcon,
  CalendarDaysIcon,
  CompassIcon,
  DownloadIcon,
  FlaskConicalIcon,
  GraduationCapIcon,
  HistoryIcon,
  HouseIcon,
  IdCardIcon,
  ImagesIcon,
  InboxIcon,
  LanguagesIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  MapPinIcon,
  MegaphoneIcon,
  MicroscopeIcon,
  PenLineIcon,
  ScrollTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  TagsIcon,
  TargetIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as RadixDialog } from "radix-ui";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminNav } from "@/lib/admin/nav";
import { roleAtLeast, type Role } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { SignOutButton } from "../sign-out-button";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard: LayoutDashboardIcon,
  House: HouseIcon,
  BookOpen: BookOpenIcon,
  Compass: CompassIcon,
  PenLine: PenLineIcon,
  MapPin: MapPinIcon,
  GraduationCap: GraduationCapIcon,
  ListTree: ListTreeIcon,
  Target: TargetIcon,
  Users: UsersIcon,
  IdCard: IdCardIcon,
  Megaphone: MegaphoneIcon,
  Tags: TagsIcon,
  CalendarDays: CalendarDaysIcon,
  Download: DownloadIcon,
  FlaskConical: FlaskConicalIcon,
  Microscope: MicroscopeIcon,
  ScrollText: ScrollTextIcon,
  Inbox: InboxIcon,
  Images: ImagesIcon,
  Settings2: Settings2Icon,
  Languages: LanguagesIcon,
  ShieldCheck: ShieldCheckIcon,
  History: HistoryIcon,
};

const THEME_LABELS = { theme: "Theme", light: "Light", dark: "Dark", system: "System" };

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ role, pathname, onNavigate, stagger }: { role: Role; pathname: string; onNavigate?: () => void; stagger?: boolean }) {
  let index = 0;
  return (
    <nav className="flex flex-col gap-5" aria-label="Admin">
      {adminNav.map((group) => {
        const entries = group.entries.filter((e) => !e.minRole || roleAtLeast(role, e.minRole));
        if (!entries.length) return null;
        return (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="eyebrow mb-1 w-max">{group.label}</p>
            {entries.map((entry) => {
              const Icon = ICONS[entry.icon] ?? LayoutDashboardIcon;
              const active = isActive(pathname, entry.href);
              const delay = stagger ? `${80 + index++ * 35}ms` : undefined;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  style={delay ? { animationDelay: delay } : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-[background-color,color,transform] duration-500 ease-out-expo active:scale-[0.98]",
                    stagger && "anim-slide-in-left",
                    active ? "bg-primary text-primary-foreground" : "text-ink-muted hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  <Icon size={16} strokeWidth={1.5} aria-hidden />
                  <span className="truncate">{entry.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminNav({ user }: { user: { email: string; role: Role } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-2">
      <Image src="/images/brand/logo-256.webp" alt="" width={36} height={36} className="size-9 rounded-full bg-white" />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] text-ink">CSE · EBAUB</span>
        <span className="text-[11px] text-ink-muted">Admin</span>
      </span>
    </Link>
  );

  const footer = (
    <div className="flex flex-col gap-3 px-2">
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle labels={THEME_LABELS} />
        <SignOutButton />
      </div>
      <p className="truncate text-[11px] text-ink-muted">
        {user.email} · {user.role}
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop: floating glass panel detached from the viewport edges */}
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-72 shrink-0 lg:block">
        <div className="shell flex h-full flex-col">
          <div className="core flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
            {brand}
            <NavLinks role={user.role} pathname={pathname} />
            <div className="mt-auto">{footer}</div>
          </div>
        </div>
      </aside>

      {/* Mobile: floating bar + full-screen blurred overlay with staggered links */}
      <div className="sticky top-3 z-40 lg:hidden">
        <div className="shell bg-paper-2/80 backdrop-blur-xl">
          <div className="core flex items-center justify-between px-2 py-1.5">
            {brand}
            <RadixDialog.Root open={open} onOpenChange={setOpen}>
              <RadixDialog.Trigger asChild>
                <button type="button" aria-label={open ? "Close menu" : "Open menu"} className="relative flex size-10 items-center justify-center rounded-full hover:bg-paper-2">
                  <span className={cn("absolute h-px w-5 bg-ink transition-transform duration-500 ease-spring", open ? "rotate-45" : "-translate-y-1.5")} />
                  <span className={cn("absolute h-px w-5 bg-ink transition-[opacity,transform] duration-500 ease-spring", open && "scale-x-0 opacity-0")} />
                  <span className={cn("absolute h-px w-5 bg-ink transition-transform duration-500 ease-spring", open ? "-rotate-45" : "translate-y-1.5")} />
                </button>
              </RadixDialog.Trigger>
              <RadixDialog.Portal>
                <RadixDialog.Overlay className="fixed inset-0 z-40 bg-paper/80 backdrop-blur-3xl data-[state=open]:anim-fade-in data-[state=closed]:anim-fade-out" />
                <RadixDialog.Content className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto px-4 pb-8 outline-none">
                  <RadixDialog.Title className="sr-only">Admin menu</RadixDialog.Title>
                  <div className="flex flex-col gap-8">
                    <NavLinks role={user.role} pathname={pathname} onNavigate={() => setOpen(false)} stagger />
                    {footer}
                  </div>
                </RadixDialog.Content>
              </RadixDialog.Portal>
            </RadixDialog.Root>
          </div>
        </div>
      </div>
    </>
  );
}
