import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X, Heart, User as UserIcon, LogIn, ChevronDown, Languages, HelpCircle, Sofa, Briefcase, Sprout, ShieldCheck,
  Trophy, Images, SearchCheck, Info, BookOpen, Phone, FolderKanban, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { prefetchHandlers } from "@/lib/prefetch";

export const Navbar = () => {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const isHome = location.pathname === "/";
  const headerRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 20);
        setHidden(false);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock body scroll while the mobile menu is open to avoid header jump/jitter.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for the disappearing scrollbar to prevent layout jump.
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    document.body.style.overflow = "hidden";
    setHidden(false);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // Close mobile menu on outside click, Escape, or route change
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Close More dropdown on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  type MoreLink = { to: string; ar: string; en: string; descAr: string; descEn: string; Icon: LucideIcon; group: "about" | "give" };
  const moreLinks: MoreLink[] = [
    { to: "/trust", ar: "الشفافية", en: "Transparency", descAr: "تقارير وأرقام الصرف", descEn: "Reports and spending", Icon: ShieldCheck, group: "about" },
    { to: "/about#achievements", ar: "إنجازاتنا", en: "Our achievements", descAr: "ما تحقق بتبرعاتكم", descEn: "What your gifts did", Icon: Trophy, group: "about" },
    { to: "/gallery", ar: "معرض الصور", en: "Gallery", descAr: "صور من الميدان", descEn: "Photos from the field", Icon: Images, group: "about" },
    { to: "/faqs", ar: "الأسئلة الشائعة", en: "FAQs", descAr: "الزكاة والتبرع والإيصالات", descEn: "Zakat, giving, receipts", Icon: HelpCircle, group: "about" },
    { to: "/donate/track", ar: "تتبع تبرعك", en: "Track donation", descAr: "برقم التبرع", descEn: "With your reference", Icon: SearchCheck, group: "give" },
    { to: "/markoun", ar: "حملة مَرْكون", en: "Markoun", descAr: "تبرع بالأثاث والأجهزة", descEn: "Furniture and appliances", Icon: Sofa, group: "give" },
    { to: "/arboun", ar: "عربون خير", en: "Arboun", descAr: "مبادرة للمستقلين", descEn: "For freelancers", Icon: Briefcase, group: "give" },
    { to: "/farm", ar: "المزارع الوقفية", en: "Endowment farm", descAr: "وقف أجره مستمر", descEn: "A lasting endowment", Icon: Sprout, group: "give" },
  ];

  // Primary navigation (always in the bar on desktop; sizes tighten on 1024–1280 px so nothing overlaps).
  const links: { to: string; label: string; highlight?: boolean; wide?: boolean; Icon?: LucideIcon; descAr?: string; descEn?: string }[] = [
    { to: "/about",     label: t.nav.about, wide: true, Icon: Info, descAr: "من نحن وكيف نعمل", descEn: "Who we are" },
    { to: "/programs",  label: lang === "ar" ? "برامجنا" : "Programs" },
    { to: "/projects",  label: lang === "ar" ? "مشاريعنا" : "Projects", wide: true, Icon: FolderKanban, descAr: "مشاريع الخير الكبيرة", descEn: "Our larger projects" },
    { to: "/campaigns", label: lang === "ar" ? "حملاتنا" : "Campaigns" },
    { to: "/misbaha",   label: lang === "ar" ? "المسبحة" : "Tasbih" },
    { to: "/cases",     label: lang === "ar" ? "الحالات" : "Cases" },
    { to: "/blog",      label: lang === "ar" ? "المدونة" : "Blog", wide: true, Icon: BookOpen, descAr: "قصص ومقالات", descEn: "Stories and articles" },
    { to: "/contact",   label: t.nav.contact, wide: true, Icon: Phone, descAr: "واتساب وهاتف وعنوان", descEn: "WhatsApp, phone, address" },
  ];

  const isActive = (to: string) => {
    if (to.startsWith("/#")) return location.pathname === "/" && location.hash === to.slice(1);
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  // Transparent overlay state on home before scroll → use white text.
  // When the mobile menu is open, force a solid bar so the dropdown is readable.
  const transparent = isHome && !scrolled && !open;
  const linkBase = transparent
    ? "text-white/95 hover:text-white hover:bg-white/15"
    : "text-foreground/80 hover:text-primary hover:bg-secondary/20";
  const ghostBtn = transparent
    ? "border-white/40 bg-white/10 text-white hover:bg-white/20"
    : "border-border bg-background/50 hover:bg-secondary/20";

  const solidBar =
    // Blur only on desktop: on phones a backdrop-filter over the animating home carousel is recomputed
    // every frame (visible as tremor on iPhone); a near-opaque background looks the same there.
    "bg-background/95 shadow-elegant lg:backdrop-blur-md lg:supports-[backdrop-filter]:bg-background/80";

  return (
    <header
      data-source="navbar"
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-[100] transition-transform duration-300 will-change-transform motion-reduce:transition-none ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled || open || !isHome
          ? solidBar
          : ""
      }`}
    >
      <nav className="container mx-auto flex h-20 max-w-7xl items-center justify-between gap-1 px-4 sm:px-6 lg:px-8">
        <Logo className={transparent ? "text-white" : "text-primary"} />

        <div className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-label={`nav-${l.label}`}
              aria-current={isActive(l.to) ? "page" : undefined}
              {...prefetchHandlers(l.to)}
              className={
                l.highlight
                  ? `rounded-full px-3 py-2 text-[13.5px] font-extrabold ring-1 transition bg-secondary/25 ring-secondary/50 hover:bg-secondary/40 ${transparent ? "text-white" : "text-primary"}`
                  : `inline-flex shrink-0 whitespace-nowrap rounded-full px-[7px] py-2 text-[12.5px] font-bold transition-colors xl:px-3 xl:text-[13.5px] ${linkBase} ${isActive(l.to) ? (transparent ? "bg-white/15 text-white font-black" : "bg-secondary/25 text-primary font-black") : ""}`
              }
            >
              {l.label}
            </Link>
          ))}
          {/* More dropdown (desktop) */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen ? "true" : "false"}
              className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-[7px] py-2 text-[12.5px] font-bold transition-colors xl:px-3 xl:text-[13.5px] ${linkBase} ${moreOpen ? (transparent ? "bg-white/15" : "bg-secondary/20 text-primary") : ""}`}
            >
              {lang === "ar" ? "المزيد" : "More"}
              <ChevronDown className={`h-3.5 w-3.5 transition ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div
                role="menu"
                aria-label={lang === "ar" ? "المزيد" : "More"}
                className="absolute end-0 top-full z-10 mt-3 w-[min(30rem,calc(100vw-2rem))] origin-top animate-fade-in-up rounded-3xl border border-border/80 bg-background p-3 text-start shadow-card"
              >
                <span aria-hidden className="absolute -top-1.5 end-8 h-3 w-3 rotate-45 border-s border-t border-border/80 bg-background" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["about", "give"] as const).map((g) => (
                    <div key={g}>
                      <p className="px-2 pb-1 text-[11px] font-black text-muted-foreground">
                        {g === "about" ? (lang === "ar" ? "تعرّف علينا" : "About us") : lang === "ar" ? "طرق أخرى للخير" : "More ways to give"}
                      </p>
                      <div className="grid gap-0.5">
                        {moreLinks.filter((m) => m.group === g).map((m) => (
                          <MenuItem key={m.to} to={m.to} label={lang === "ar" ? m.ar : m.en} desc={lang === "ar" ? m.descAr : m.descEn} Icon={m.Icon} active={isActive(m.to)} onClick={() => setMoreOpen(false)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className={`${open ? "hidden" : "inline-flex"} h-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold leading-none transition sm:h-9 sm:px-3 sm:text-xs ${ghostBtn}`}
            aria-label="Toggle language"
          >
            <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-accent" />
            {lang === "ar" ? "EN" : "AR"}
          </button>
          {user ? (
            <Link to={user.roles.includes("donor") ? "/dashboard" : "/profile"} data-label="nav-account" {...prefetchHandlers(user.roles.includes("donor") ? "/dashboard" : "/profile")} className={`hidden h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition sm:inline-flex ${ghostBtn}`}>
              <UserIcon className="h-4 w-4" />
              <span className="max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
            </Link>
          ) : null}
          <Button
            asChild
            className="hidden whitespace-nowrap rounded-full bg-orange-grad px-4 text-accent-foreground shadow-cta hover:opacity-95 sm:inline-flex xl:px-5"
          >
            <Link to="/donate" data-label="nav-donate-cta" {...prefetchHandlers("/donate")}>
              <Heart className="h-4 w-4" />
              {t.nav.donate}
            </Link>
          </Button>
          <button
            onClick={() => setOpen(!open)}
            className={`lg:hidden rounded-full p-2.5 transition ${transparent ? "text-white hover:bg-white/15" : "text-foreground hover:bg-secondary/20"}`}
            aria-label="Menu"
            aria-expanded={open ? "true" : "false"}
            aria-controls="mobile-menu"
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <span
                aria-hidden
                className={`flex h-5 w-6 flex-col items-stretch justify-between opacity-100 ${lang === "en" ? "scale-x-[-1]" : ""}`}
              >
                <span className="block h-[2px] w-full rounded-full bg-current opacity-100" />
                <span className={`block h-[2px] w-3/4 rounded-full bg-current opacity-100 ${lang === "ar" ? "self-end" : "self-start"}`} />
                <span className="block h-[2px] w-full rounded-full bg-current opacity-100" />
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Premium Clean & Calm Mobile Drawer Menu ── */}
      {open && (
        <div id="mobile-menu" aria-label={lang === "ar" ? "القائمة" : "Menu"} className="lg:hidden border-t border-border/70 bg-background/98 backdrop-blur-xl shadow-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto focus-within:outline-none">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-5">
            {/* Primary Nav Links — Calm & Clean Stack */}
            <div className="flex flex-col gap-1 rounded-2xl bg-card/60 p-2 border border-border/60 shadow-soft">
              {links.map((l) => {
                const active = isActive(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    data-label={`nav-mobile-${l.label}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-all ${
                      active
                        ? "bg-secondary/20 text-primary shadow-sm"
                        : "text-foreground/85 hover:bg-secondary/10 hover:text-primary"
                    }`}
                  >
                    <span>{l.label}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>

            {/* More Pages — Elegant Soft Pills */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-3 shadow-soft">
              <span className="block px-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                {lang === "ar" ? "روابط سريعة ومبادرات" : "Quick Links & Initiatives"}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {moreLinks.map((p) => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/80 px-3 py-2.5 text-xs font-bold text-foreground/85 transition-colors hover:border-secondary/50 hover:bg-secondary/15 hover:text-primary"
                  >
                    <p.Icon className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="min-w-0 truncate">{lang === "ar" ? p.ar : p.en}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Account & Quick Action Footer */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                to={user ? (user.roles.includes("donor") ? "/dashboard" : "/profile") : "/login"}
                onClick={() => setOpen(false)}
                data-label="nav-mobile-account"
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/80 px-4 py-2.5 text-xs font-black text-foreground/85 hover:bg-secondary/15 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {user ? <UserIcon className="h-4 w-4 text-primary" /> : <LogIn className="h-4 w-4 text-primary" />}
                  <span>{user ? (lang === "ar" ? `حسابي (${user.name})` : `Profile (${user.name})`) : (lang === "ar" ? "تسجيل الدخول إلى حسابك" : "Login to your account")}</span>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">{lang === "ar" ? "دخول" : "Open"}</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/90 px-3 text-xs font-black text-foreground hover:bg-secondary/15 transition"
                >
                  <Languages className="h-4 w-4 text-accent" />
                  <span>{lang === "ar" ? "English" : "العربية"}</span>
                </button>

                <Button asChild className="h-11 flex-1 rounded-2xl bg-orange-grad font-black text-accent-foreground shadow-cta hover:opacity-95 text-xs">
                  <Link to="/donate" onClick={() => setOpen(false)} data-label="nav-mobile-donate">
                    <Heart className="h-4 w-4" />
                    <span>{t.nav.donate}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

function MenuItem({ to, label, desc, Icon, active, onClick }: { to: string; label: string; desc?: string; Icon: LucideIcon; active: boolean; onClick: () => void }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      {...prefetchHandlers(to)}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-secondary/15 focus-visible:bg-secondary/15 focus-visible:outline-none ${active ? "bg-secondary/20" : ""}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary transition group-hover:bg-secondary group-hover:text-slate-950">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-primary">{label}</span>
        {desc && <span className="block truncate text-[11px] font-semibold text-muted-foreground">{desc}</span>}
      </span>
    </Link>
  );
}

export default Navbar;
