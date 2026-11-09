import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Users, Layers, ArrowUpRight, Menu, X, Globe, LogOut, HeartHandshake, ShieldCheck, BarChart3, Sparkles, ChevronDown, Heart, BookOpen, Target, Lock,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import logoAsset from "@/assets/logo-circle.png";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { useAdminNav, type NavGroup } from "@/components/admin/adminNav";
import { canOpenAdminPath } from "@/auth/adminAccess";
import { NotificationsBell } from "@/components/common/NotificationsBell";
import { BACKEND_PENDING_AR, PENDING_ADMIN_SCREENS, pendingForPath } from "@/data/api/backendPending";

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
  const drawerRef = useRef<HTMLElement | null>(null);

  // The public site's phone-only CSS (huge headings, centred lone items) must not reach the dashboard.
  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  // Phone menu: closes on navigation and with Esc, locks the page behind it, opens at the current item.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ block: "center" }), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  const { roleKey, navGroups, serverAllowed } = useAdminNav();
  const blocked = serverAllowed !== null && !canOpenAdminPath(pathname, serverAllowed);
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
          <div className="fixed inset-0 z-[120] md:hidden" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={lang === "ar" ? "قائمة لوحة التحكم" : "Dashboard menu"}>
            <div className="absolute inset-0 bg-[#03140b]/60 backdrop-blur-[2px] animate-in fade-in-0 duration-200" />
            <aside
              ref={drawerRef}
              className={`absolute inset-y-0 start-0 flex w-[86vw] max-w-[320px] flex-col text-primary-foreground shadow-2xl animate-in duration-300 ease-out ${lang === "ar" ? "slide-in-from-right-full rounded-s-3xl" : "slide-in-from-left-full rounded-e-3xl"}`}
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
          <header className="bg-subhero sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-secondary/20 px-3 backdrop-blur md:h-[61px] md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-secondary/30 bg-primary-foreground/10 text-primary-foreground transition active:scale-95 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-[15px] font-black leading-tight text-primary-foreground md:text-xl">{pageTitle}</h1>
                </div>
                <p className="hidden text-[11px] text-primary-foreground/70 md:block">
                  {lang === "ar" ? "مؤسسة اليسر الخيرية — لوحة الإدارة" : "Al-Yusr Foundation — Admin"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
              <NotificationsBell />
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex h-9 items-center gap-1 rounded-xl border border-secondary/30 bg-primary-foreground/10 px-2 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/20 md:px-2.5"
                aria-label="toggle language"
              >
                <Globe className="hidden h-3.5 w-3.5 sm:block" />
                {lang === "ar" ? "EN" : "ع"}
              </button>
              <Link
                to="/"
                aria-label={lang === "ar" ? "فتح الموقع" : "Open the site"}
                className="flex h-9 items-center gap-1 rounded-xl bg-secondary px-2.5 text-xs font-bold text-secondary-foreground hover:opacity-90 md:px-3"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === "ar" ? "الموقع" : "Site"}</span>
              </Link>
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 md:p-6">
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
              {blocked ? (
                <div className="mx-auto mt-10 max-w-md rounded-3xl bg-card p-8 text-center shadow-soft">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary">
                    <Lock className="h-6 w-6" aria-hidden />
                  </span>
                  <h2 className="mt-3 text-lg font-black text-primary">{lang === "ar" ? "الصفحة دي مش ضمن صلاحياتك" : "This page isn't in your permissions"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lang === "ar" ? "لو محتاجها في شغلك، اطلب من المدير يضيفلك الدور المناسب من «المستخدمون والأدوار»." : "If you need it, ask the admin to add the right role for you under Users & Roles."}
                  </p>
                  <Link to="/admin" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground hover:opacity-95">
                    {lang === "ar" ? "الرجوع للوحة التحكم" : "Back to the dashboard"}
                  </Link>
                </div>
              ) : (
                children
              )}
            </div>
            {loading && (
              // A thin moving line at the top (same motion as the site's loading mark): the page
              // underneath stays readable instead of blurring and blinking.
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] overflow-hidden bg-primary/10" role="status" aria-label={lang === "ar" ? "جاري التحميل" : "Loading"}>
                <span className="absolute inset-y-0 w-2/5 rounded-full bg-primary motion-safe:animate-[yusr-slide_1.2s_ease-in-out_infinite]" />
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
        <button onClick={onNavigate} className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10 text-primary-foreground/80 transition hover:text-primary-foreground active:scale-95 md:hidden" aria-label={lang === "ar" ? "اقفل القائمة" : "Close menu"}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
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
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition text-start md:py-2 md:text-sm ${
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
                    className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition text-start md:py-2 md:text-sm ${
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