import { ReactNode, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  LayoutDashboard, TrendingUp, HandCoins, Users, FolderKanban, Layers,
  FileEdit, FileBarChart2, ArrowUpRight, Menu, X, Globe, LogOut, Search,
  HandHeart, HeartHandshake, ShieldCheck, UserCog, Megaphone, ClipboardCheck,
  ListChecks, Mail, BarChart3, Activity, Wallet, Image as ImageIcon, FolderArchive, Loader2,
  Server, Sparkles, Building2, Compass, Calendar, ChevronDown, Heart, BookOpen, Target,
  HelpCircle, SlidersHorizontal, Bell,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import logoAsset from "@/assets/logo-circle.png";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { inferPermissions } from "@/auth/permissions";
import { NotificationsBell } from "@/components/common/NotificationsBell";
import { BACKEND_PENDING_AR, PENDING_ADMIN_SCREENS, pendingForPath } from "@/data/api/backendPending";

type NavItem = { href: string; ar: string; en: string; icon: typeof LayoutDashboard };

type NavGroup = { ar: string; en: string; items: NavItem[] };

const ALL_NAV_GROUPS: NavGroup[] = [
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
      { href: "/admin/page-galleries", ar: "معارض صور الصفحات", en: "Page Galleries", icon: ImageIcon },
      { href: "/admin/content", ar: "المقالات والمدونة", en: "Articles & Blog", icon: FileEdit },
      { href: "/admin/blog-seo", ar: "سيو المدونة", en: "Blog SEO", icon: Search },
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

/** Hrefs allowed per ROLE. Roles are now strictly separated:
 *  - admin        : full access
 *  - case_manager : cases / donations / reports
 *  - editor       : content + blog-seo + review
 *  - volunteer    : tasks + campaigns
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
  editor: [
    "/admin", "/admin/analytics",
    "/admin/homepage-content", "/admin/about-us", "/admin/axes",
    "/admin/projects", "/admin/programs", "/admin/services", "/admin/donation-campaigns", "/admin/campaigns", "/admin/seasons", "/admin/reports",
    "/admin/content", "/admin/stories", "/admin/site-stats", "/admin/gallery", "/admin/page-galleries", "/admin/media",
    "/admin/review", "/admin/blog-seo", "/admin/faqs", "/admin/newsletter", "/admin/inbox",
    "/admin/my-tasks", "/admin/profile", "/admin/notifications", "/admin/campaigns-section",
  ],
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
  "content.publish": ["/admin/content", "/admin/stories", "/admin/review", "/admin/blog-seo"],
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

const ROLE_LABEL: Record<string, { ar: string; en: string; cls: string }> = {
  admin:     { ar: "مدير",  en: "Admin",     cls: "bg-secondary text-secondary-foreground" },
  case_manager: { ar: "مسؤول حالات", en: "Case manager", cls: "bg-emerald-500/20 text-emerald-100" },
  editor:    { ar: "محرر",  en: "Editor",    cls: "bg-accent/20 text-accent" },
  delegate:  { ar: "مندوب ميداني", en: "Field delegate", cls: "bg-sky-500/20 text-sky-100" },
  volunteer: { ar: "متطوع", en: "Volunteer", cls: "bg-primary-foreground/15 text-primary-foreground" },
};

export const AdminLayout = ({
  children, title, loading = false,
}: { children: ReactNode; title?: { ar: string; en: string }; loading?: boolean }) => {
  const { lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const pending = pendingForPath(pathname);
  const [open, setOpen] = useState(false);

  const roleKey = pickRoleKey(user?.roles as unknown as string[] | undefined);
  // Volunteers can unlock additional sections via skill-derived permissions
  // (e.g. "content.write" → /admin/content + /admin/review).
  const perms = roleKey === "volunteer"
    ? (user?.permissions ?? inferPermissions(user?.skills))
    : [];
  const extraAllowed = Array.from(new Set(perms.flatMap((p) => PERM_GRANTS[p] ?? [])));
  const navGroups = filterGroups(roleKey, extraAllowed);
  const roleBadge = ROLE_LABEL[roleKey];
  const allItems = navGroups.flatMap((g) => g.items);
  const current = allItems.find((i) => i.href === pathname || (i.href !== "/admin" && pathname.startsWith(i.href)));
  const pageTitle = title?.[lang] || current?.[lang] || (lang === "ar" ? "لوحة التحكم" : "Dashboard");

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} | Al-Yusr Admin`}</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Helmet>

      <div className="flex h-screen w-full overflow-hidden bg-muted/30" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Sidebar - desktop (sticky, full height) — solid color matching header */}
        <aside
          className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-secondary/15 text-primary-foreground shadow-[0_0_40px_-10px_hsl(152_70%_8%/0.4)] md:flex"
          style={{ backgroundColor: "hsl(152 55% 14%)" }}
        >
          <SidebarContent groups={navGroups} roleBadge={roleBadge} pathname={pathname} lang={lang} onNavigate={() => {}} userName={user?.name} userEmail={user?.email} onLogout={() => { logout(); nav("/"); }} />
        </aside>

        {/* Sidebar - mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <aside
              className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col text-primary-foreground shadow-2xl"
              dir={lang === "ar" ? "rtl" : "ltr"}
              style={{ backgroundColor: "hsl(152 55% 14%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent groups={navGroups} roleBadge={roleBadge} pathname={pathname} lang={lang} onNavigate={() => setOpen(false)} userName={user?.name} userEmail={user?.email} onLogout={() => { logout(); nav("/"); }} />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-subhero sticky top-0 z-30 flex h-[61px] shrink-0 items-center justify-between gap-2 border-b border-secondary/20 px-3 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-secondary/30 bg-primary-foreground/10 text-primary-foreground md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-black text-primary-foreground md:text-xl">{pageTitle}</h1>
                </div>
                <p className="hidden text-[11px] text-primary-foreground/70 md:block">
                  {lang === "ar" ? "مؤسسة اليسر الخيرية — لوحة الإدارة" : "Al-Yusr Foundation — Admin"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <NotificationsBell />
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex h-9 items-center gap-1 rounded-lg border border-secondary/30 bg-primary-foreground/10 px-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/20"
                aria-label="toggle language"
              >
                <Globe className="h-3.5 w-3.5" />
                {lang === "ar" ? "EN" : "ع"}
              </button>
              <Link
                to="/"
                className="flex h-9 items-center gap-1 rounded-lg bg-secondary px-3 text-xs font-bold text-secondary-foreground hover:opacity-90"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === "ar" ? "الموقع" : "Site"}</span>
              </Link>
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto p-3 md:p-6">
            <div key={pathname} className="admin-fade-in admin-stagger">
              {pending && (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900" dir="rtl">
                  <p className="font-black">
                    {pending.partial ? `جزء من الشاشة دي ${BACKEND_PENDING_AR}:` : `الشاشة دي ${BACKEND_PENDING_AR}:`}
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 ps-5 font-semibold">
                    {pending.missing.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </div>
              )}
              {children}
            </div>
            {loading && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-background/40 backdrop-blur-[1px]">
                <div className="mt-6 flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-xs font-bold text-primary shadow-lg ring-1 ring-border/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {lang === "ar" ? "جاري التحميل…" : "Loading…"}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

const ABOUT_US_SUB_SECTIONS = [
  { id: "hero", ar: "الهيرو والتعريف", en: "Hero & Identity", icon: Sparkles },
  { id: "stats", ar: "الأرقام والإحصائيات", en: "Stats & Numbers", icon: BarChart3 },
  { id: "programs", ar: "البرامج والمبادرات", en: "Programs", icon: Layers },
  { id: "trust", ar: "الاعتمادات والموثوقية", en: "Trust & Licenses", icon: ShieldCheck },
  { id: "why-us", ar: "لماذا تثق بنا", en: "Why Trust Us", icon: HeartHandshake },
  { id: "values", ar: "قيمنا المؤسسية", en: "Our Values", icon: Heart },
  { id: "story", ar: "قصتنا ورسالتنا", en: "Our Story", icon: BookOpen },
  { id: "vision-2030", ar: "مستهدفات 2030", en: "Vision 2030", icon: Target },
];

const SidebarContent = ({
  groups, roleBadge, pathname, lang, onNavigate, userName, userEmail, onLogout,
}: { groups: NavGroup[]; roleBadge?: { ar: string; en: string; cls: string }; pathname: string; lang: "ar" | "en"; onNavigate: () => void; userName?: string; userEmail?: string; onLogout: () => void }) => {
  const location = useLocation();
  // Dropdown is collapsed (مقفول) by default on desktop and mobile
  const [aboutUsDropdownOpen, setAboutUsDropdownOpen] = useState(false);

  return (
    <>
      <div className="relative flex h-[61px] shrink-0 items-center justify-between gap-2 border-b border-secondary/15 px-4">
        <Link to="/" className="flex items-center gap-2.5 text-primary-foreground" aria-label="Al-Yusr home">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
            <img src={logoAsset} alt="" width={40} height={40} className="h-8 w-8 object-contain" />
          </span>
          <span className="flex min-w-0 flex-col leading-[1.1]">
            <span className="text-[10.5px] font-extrabold tracking-wide text-primary-foreground/75">
              {lang === "ar" ? "مؤسسة" : "Al-Yusr"}
            </span>
            <span className="text-[13.5px] font-black text-primary-foreground whitespace-normal break-words">
              {lang === "ar" ? "اليسر الخيرية" : "Charity Foundation"}
            </span>
          </span>
        </Link>
        <button onClick={onNavigate} className="rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground md:hidden" aria-label="close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.ar}>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary/80">
              {g[lang]}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon;

                // Special handling for "محتوى من نحن" to provide a collapsible dropdown
                if (it.href === "/admin/about-us") {
                  const isParentActive = pathname === "/admin/about-us";
                  const searchParams = new URLSearchParams(location.search);
                  const currentTab = searchParams.get("tab") || "hero";

                  return (
                    <div key={it.href} className="space-y-1">
                      <div
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition text-start ${
                          isParentActive
                            ? "bg-secondary text-secondary-foreground shadow-md font-black"
                            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        }`}
                      >
                        <NavLink
                          to="/admin/about-us"
                          onClick={onNavigate}
                          className="flex flex-1 items-center gap-3 text-start min-w-0"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{it[lang]}</span>
                        </NavLink>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAboutUsDropdownOpen((prev) => !prev);
                          }}
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-transform duration-200 ${
                            isParentActive
                              ? "hover:bg-black/10 text-secondary-foreground"
                              : "hover:bg-primary-foreground/15 text-primary-foreground/70"
                          }`}
                          title={aboutUsDropdownOpen ? (lang === "ar" ? "طي الأقسام" : "Collapse sections") : (lang === "ar" ? "عرض أقسام من نحن" : "Expand sections")}
                          aria-label="Toggle About Us sections"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              aboutUsDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Dropdown subsections */}
                      {aboutUsDropdownOpen && (
                        <div className="ps-3 pe-1 py-1 space-y-1 border-s-2 border-secondary/30 ms-3 transition-all">
                          {ABOUT_US_SUB_SECTIONS.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = isParentActive && currentTab === sub.id;
                            return (
                              <NavLink
                                key={sub.id}
                                to={`/admin/about-us?tab=${sub.id}`}
                                onClick={onNavigate}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                                  isSubActive
                                    ? "bg-[#bbf438] text-[#062c19] font-black shadow-xs ring-1 ring-lime-400"
                                    : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold"
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 shrink-0 ${isSubActive ? "text-[#062c19]" : "text-primary-foreground/60"}`} />
                                <span className="truncate">{sub[lang]}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
                return (
                  <NavLink
                    key={it.href}
                    to={it.href}
                    end={it.href === "/admin"}
                    onClick={onNavigate}
                    className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition text-start ${
                      active
                        ? "bg-secondary text-secondary-foreground shadow-md font-black"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex min-w-0 flex-1 flex-col text-start">
                      <span className="truncate">{it[lang]}</span>
                      {PENDING_ADMIN_SCREENS[it.href] && (
                        <span
                          className="truncate text-[9.5px] font-bold text-amber-300"
                          title={PENDING_ADMIN_SCREENS[it.href].missing.join("\n")}
                        >
                          {PENDING_ADMIN_SCREENS[it.href].partial ? `جزء ${BACKEND_PENDING_AR}` : BACKEND_PENDING_AR}
                        </span>
                      )}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-secondary/15 bg-black/20 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-primary-foreground/[0.06] p-3 ring-1 ring-primary-foreground/10">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-black text-secondary-foreground shadow-md">{(userName || "م").charAt(0)}</div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-xs font-extrabold leading-tight">{userName || (lang === "ar" ? "ضيف" : "Guest")}</div>
              {roleBadge && (
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold leading-tight ${roleBadge.cls}`}>
                  {roleBadge[lang]}
                </span>
              )}
            </div>
            <div className="truncate text-[10.5px] leading-tight text-primary-foreground/65 text-right" dir="auto">{userEmail || "—"}</div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-foreground/10 px-2 py-1.5 text-[11px] font-bold text-primary-foreground/85 ring-1 ring-primary-foreground/10 transition hover:bg-destructive/80 hover:text-destructive-foreground hover:ring-destructive/40"
            aria-label={lang === "ar" ? "تسجيل خروج" : "Sign out"}
            title={lang === "ar" ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{lang === "ar" ? "خروج" : "Logout"}</span>
          </button>
        </div>
      </div>
    </>
  );
};

/* ---------- Shared building blocks ---------- */

export const StatCard = ({
  label, value, sub, accent = false, icon: Icon, delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  delta?: { value: number; label?: string } | null;
}) => {
  const isPositive = (delta?.value ?? 0) >= 0;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-3 sm:p-4 md:p-5 transition-all hover:-translate-y-0.5 ${
        accent
          ? "bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.55)] ring-1 ring-primary/30"
          : "bg-card shadow-soft ring-1 ring-border/60 hover:ring-primary/20 hover:shadow-[0_18px_40px_-26px_hsl(var(--primary)/0.35)]"
      }`}
    >
      {/* decorative blur for accent variant */}
      {accent && (
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-secondary/25 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
        <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider line-clamp-1 ${accent ? "text-secondary" : "text-muted-foreground"}`}>{label}</div>
        {Icon && (
          <span
            className={`inline-grid h-7 w-7 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg sm:rounded-xl transition-transform group-hover:scale-110 ${
              accent
                ? "bg-primary-foreground/10 text-secondary ring-1 ring-secondary/30"
                : "bg-primary/10 text-primary ring-1 ring-primary/15"
            }`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        )}
      </div>
      <div className={`relative mt-1.5 sm:mt-2 text-xl sm:text-2xl md:text-[28px] font-black tabular-nums md:leading-[1.1] ${accent ? "text-secondary" : "text-primary"}`}>
        {value}
      </div>
      <div className="relative mt-1 flex flex-wrap items-center gap-1.5">
        {sub && (
          <span className={`text-[10px] sm:text-[11px] leading-tight ${accent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{sub}</span>
        )}
        {delta && Number.isFinite(delta.value) && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
            title={delta.label}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

export const ChartCard = ({
  title, subtitle, children, action, icon: Icon,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex h-full flex-col rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-[0_18px_40px_-26px_hsl(var(--primary)/0.3)] sm:p-4 md:p-5">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-primary md:text-base">
          {Icon && (
            <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="truncate">{title}</span>
        </h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="mt-1 flex-1">{children}</div>
  </div>
);