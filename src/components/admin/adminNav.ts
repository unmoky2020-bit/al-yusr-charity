import {
  LayoutDashboard, TrendingUp, HandCoins, Users, FolderKanban, FileEdit, FileBarChart2, HandHeart, HeartHandshake, ShieldCheck, UserCog, Megaphone, ClipboardCheck, ListChecks, Mail, BarChart3, Activity, Wallet, Image as ImageIcon, FolderArchive, Sparkles, Building2, Compass, Calendar, BookOpen, HelpCircle, SlidersHorizontal, Bell,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { inferPermissions } from "@/auth/permissions";
import { allowedAdminPaths, canOpenAdminPath } from "@/auth/adminAccess";

/**
 * The dashboard menu: every section, which roles may open which, and the hook that picks what the
 * signed-in account sees (sidebar, home page shortcuts).
 */
export type NavItem = { href: string; ar: string; en: string; icon: typeof LayoutDashboard };

export type NavGroup = { ar: string; en: string; items: NavItem[] };

export const ALL_NAV_GROUPS: NavGroup[] = [
  {
    ar: "الرئيسية", en: "Main",
    items: [
      { href: "/admin", ar: "لوحة التحكم", en: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", ar: "التحليلات", en: "Analytics", icon: TrendingUp },
      { href: "/admin/notifications", ar: "الإشعارات", en: "Notifications", icon: Bell },
    ],
  },
  {
    ar: "إدارة العمليات والمشاريع", en: "Operations & Projects",
    items: [
      { href: "/admin/donations", ar: "التبرعات", en: "Donations", icon: HandCoins },
      { href: "/admin/payment-methods", ar: "طرق الدفع", en: "Payment Methods", icon: Wallet },
      { href: "/admin/cases", ar: "الحالات", en: "Cases", icon: Users },
      { href: "/admin/projects", ar: "إدارة المشاريع", en: "Projects Management", icon: FolderKanban },
      { href: "/admin/programs", ar: "إدارة البرامج", en: "Programs Management", icon: BookOpen },
      { href: "/admin/donation-campaigns", ar: "إدارة الحملات والمبادرات", en: "Donation Campaigns", icon: Megaphone },
      { href: "/admin/campaigns", ar: "حملات التطوع الميدانية", en: "Volunteer Campaigns", icon: Users },
      { href: "/admin/seasons", ar: "إدارة المواسم", en: "Seasons CMS", icon: Calendar },
      { href: "/admin/reports", ar: "التقارير والتصدير", en: "Reports & Exports", icon: FileBarChart2 },
    ],
  },
  {
    ar: "إدارة محتوى الموقع", en: "Website CMS",
    items: [
      { href: "/admin/homepage-content", ar: "الهيرو والبراند بروميس", en: "Hero & Brand Promise", icon: Sparkles },
      { href: "/admin/about-us", ar: "محتوى من نحن", en: "About Us CMS", icon: Building2 },
      { href: "/admin/axes", ar: "محاور رسالتنا", en: "Work Axes", icon: Compass },
      { href: "/admin/site-stats", ar: "الأرقام والإنجازات", en: "Stats & Numbers", icon: BarChart3 },
      { href: "/admin/campaigns-section", ar: "كاروسيل الرئيسية", en: "Homepage Carousel", icon: SlidersHorizontal },
      { href: "/admin/stories", ar: "قصص الأثر", en: "Stories CMS", icon: HeartHandshake },
      { href: "/admin/media", ar: "مكتبة الوسائط", en: "Media Library", icon: FolderArchive },
      { href: "/admin/gallery", ar: "معرض الصور", en: "Photo Gallery", icon: ImageIcon },
      { href: "/admin/content", ar: "محتوى الموقع", en: "Website Content", icon: FileEdit },
      { href: "/admin/page-galleries", ar: "معارض صور الصفحات", en: "Page Galleries", icon: ImageIcon },
      { href: "/admin/blog", ar: "المدونة", en: "Blog", icon: BookOpen },
      { href: "/admin/faqs", ar: "الأسئلة الشائعة", en: "FAQs CMS", icon: HelpCircle },
      { href: "/admin/inbox", ar: "رسائل تواصل معنا", en: "Contact inbox", icon: Mail },
      { href: "/admin/newsletter", ar: "النشرة البريدية", en: "Newsletter", icon: Mail },
      { href: "/admin/review",  ar: "مراجعة واعتماد التعديلات", en: "Change Approvals", icon: ClipboardCheck },
    ],
  },
  {
    ar: "فريق العمل والأشخاص", en: "People & Team",
    items: [
      { href: "/admin/volunteers", ar: "المتطوعون", en: "Volunteers", icon: HandHeart },
      { href: "/admin/my-tasks", ar: "مهامي الميدانية", en: "My Tasks", icon: ListChecks },
      { href: "/admin/delegates", ar: "متابعة المندوبين", en: "Delegate Tracking", icon: ShieldCheck },
      { href: "/admin/donors", ar: "سجل المتبرعين", en: "Donors", icon: HeartHandshake },
      { href: "/admin/users", ar: "المستخدمون والأدوار", en: "Users & Roles", icon: UserCog },
    ],
  },
  {
    ar: "التسويق والأمان", en: "Marketing & Audit",
    items: [
      { href: "/admin/ad-campaigns", ar: "حملات إعلانية", en: "Ad Campaigns", icon: Megaphone },
      { href: "/admin/activity", ar: "سجل النشاط", en: "Activity Log", icon: Activity },
      { href: "/admin/profile", ar: "حسابي", en: "My Profile", icon: UserCog },
    ],
  },
];

/** Hrefs allowed per ROLE when the server can't say (older backend without GET /me/access):
 *  - admin        : full access
 *  - case_manager : cases / donations / reports
 *  - editor       : the blog (more only when the super admin adds a role, e.g. «محرر حالات»)
 *  - volunteer    : tasks + campaigns
 * Editors and case managers otherwise follow their role permissions on the server (adminAccess.ts).
 */
const ROLE_ALLOWED: Record<string, string[]> = {
  admin: ["*"],
  case_manager: [
    "/admin", "/admin/analytics",
    "/admin/donations", "/admin/cases", "/admin/my-cases", "/admin/delegates", "/admin/projects", "/admin/programs", "/admin/axes", "/admin/services", "/admin/donation-campaigns",
    "/admin/campaigns", "/admin/my-tasks", "/admin/reports", "/admin/volunteers",
    "/admin/donors", "/admin/transactions",
    "/admin/profile", "/admin/notifications",
  ],
  editor: ["/admin", "/admin/blog", "/admin/media", "/admin/profile", "/admin/notifications"],
  volunteer: [
    "/admin", "/admin/campaigns", "/admin/my-tasks", "/admin/profile", "/admin/notifications",
  ],
  delegate: [
    "/admin", "/admin/my-cases", "/admin/my-tasks", "/admin/profile", "/admin/notifications",
  ],
};

/** Volunteer permission → extra hrefs they unlock when granted. */
const PERM_GRANTS: Record<string, string[]> = {
  "content.write":   ["/admin/content", "/admin/stories", "/admin/review"],
  "content.publish": ["/admin/content", "/admin/stories", "/admin/review", "/admin/blog"],
  "cases.manage":    ["/admin/cases"],
  "field.coordinate":["/admin/campaigns", "/admin/my-tasks"],
  "media.upload":    ["/admin/content"],
};

/** Pick the strongest single role for badge + base permissions. */
const pickRoleKey = (roles: string[] | undefined): string => {
  if (!roles || !roles.length) return "volunteer";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("case_manager") || roles.includes("caseworker")) return "case_manager";
  if (roles.includes("editor")) return "editor";
  if (roles.includes("delegate")) return "delegate";
  if (roles.includes("volunteer")) return "volunteer";
  return "volunteer";
};

const filterGroups = (roleKey: string, extra: string[] = []): NavGroup[] => {
  const base = ROLE_ALLOWED[roleKey] ?? [];
  if (base.includes("*")) return ALL_NAV_GROUPS;
  const allow = new Set([...base, ...extra]);
  return ALL_NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => allow.has(i.href)) }))
    .filter((g) => g.items.length > 0);
};


/**
 * The dashboard menu the signed-in account may open: its role, plus (editors and case managers)
 * the permissions their roles have on the server. One source for the sidebar and the home page.
 */
export function useAdminNav() {
  const { user, access } = useAuth();
  const roleKey = pickRoleKey(user?.roles as unknown as string[] | undefined);
  // Volunteers can unlock additional sections via skill-derived permissions
  // (e.g. "content.write" → /admin/content + /admin/review).
  const perms = roleKey === "volunteer"
    ? (user?.permissions ?? inferPermissions(user?.skills))
    : [];
  const extraAllowed = Array.from(new Set(perms.flatMap((p) => PERM_GRANTS[p] ?? [])));
  // Editors and case managers: the menu and the pages follow their role permissions on the server.
  const serverAllowed = (roleKey === "editor" || roleKey === "case_manager") && access ? allowedAdminPaths(access) : null;
  const navGroups = serverAllowed
    ? ALL_NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canOpenAdminPath(i.href, serverAllowed)) })).filter((g) => g.items.length > 0)
    : filterGroups(roleKey, extraAllowed);
  return { roleKey, navGroups, serverAllowed };
}
