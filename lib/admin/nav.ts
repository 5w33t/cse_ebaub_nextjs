import type { Role } from "@/lib/auth/session";

export type NavEntry = { label: string; href: string; icon: string; minRole?: Role };
export type NavGroup = { label: string; entries: NavEntry[] };

/** Sidebar structure from spec 3.2. Icon names map to lucide components in the shell. */
export const adminNav: NavGroup[] = [
  {
    label: "Overview",
    entries: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    label: "Pages",
    entries: [
      { label: "Home", href: "/admin/pages/home", icon: "House" },
      { label: "About", href: "/admin/pages/about", icon: "BookOpen" },
      { label: "Vision and mission", href: "/admin/pages/missionVision", icon: "Compass" },
      { label: "Chairman's message", href: "/admin/pages/chairmanMessage", icon: "PenLine" },
      { label: "Contact", href: "/admin/pages/contact", icon: "MapPin" },
    ],
  },
  {
    label: "Academics",
    entries: [
      { label: "Programs", href: "/admin/content/programs", icon: "GraduationCap" },
      { label: "Courses", href: "/admin/content/courses", icon: "ListTree" },
      { label: "OBE framework", href: "/admin/pages/obe", icon: "Target" },
    ],
  },
  {
    label: "People",
    entries: [
      { label: "Faculty", href: "/admin/content/faculty", icon: "Users" },
      { label: "Officers and staff", href: "/admin/content/staff", icon: "IdCard" },
    ],
  },
  {
    label: "Content",
    entries: [
      { label: "Notices", href: "/admin/content/notices", icon: "Megaphone" },
      { label: "Notice categories", href: "/admin/content/noticeCategories", icon: "Tags" },
      { label: "News and events", href: "/admin/content/events", icon: "CalendarDays" },
      { label: "Downloads", href: "/admin/content/downloads", icon: "Download" },
      { label: "Research areas", href: "/admin/content/researchAreas", icon: "FlaskConical" },
      { label: "Laboratories", href: "/admin/content/labs", icon: "Microscope" },
      { label: "Publications", href: "/admin/content/publications", icon: "ScrollText" },
    ],
  },
  {
    label: "Inbox",
    entries: [{ label: "Messages", href: "/admin/inbox", icon: "Inbox" }],
  },
  {
    label: "Library",
    entries: [{ label: "Images and files", href: "/admin/images", icon: "Images" }],
  },
  {
    label: "Settings",
    entries: [
      { label: "Site settings", href: "/admin/pages/site", icon: "Settings2", minRole: "superAdmin" },
      { label: "UI labels", href: "/admin/settings/ui-labels", icon: "Languages", minRole: "superAdmin" },
      { label: "Users", href: "/admin/users", icon: "ShieldCheck", minRole: "superAdmin" },
      { label: "Activity log", href: "/admin/activity", icon: "History" },
    ],
  },
];
