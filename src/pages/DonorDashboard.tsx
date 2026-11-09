import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Bell, CheckCheck, ChevronDown, CreditCard, ExternalLink, Heart, LogOut, ReceiptText,
  Settings, Smartphone, Sparkles, Target, Trash2, TrendingUp, Truck, Users, Wallet,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationsEmpty } from "@/components/notifications/NotificationsEmpty";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ListSkeleton } from "@/components/common/ContentSkeletons";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { listCaseDocuments } from "@/data/casesApi";
import { listMyDonations, type MyDonation } from "@/data/myDonations";
import { formatServerImageUrl } from "@/data/laravelApi";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { EmailVerifyCard } from "@/components/auth/EmailVerifyCard";
import { AvatarUploader, initialsOf } from "@/components/account/AvatarUploader";
import { ProfileDetailsForm } from "@/components/account/ProfileDetailsForm";
import { ContactPreferences } from "@/components/account/ContactPreferences";
import { DeliveryJourney } from "@/components/donations/DeliveryJourney";
import { cn } from "@/lib/utils";

type Tab = "impact" | "donations" | "notifications" | "account";
const TABS: Tab[] = ["impact", "donations", "notifications", "account"];
const isTab = (v: string | null): v is Tab => !!v && (TABS as string[]).includes(v);
type Lang = "ar" | "en";

const STATUS: Record<string, { ar: string; en: string; cls: string }> = {
  pending: { ar: "بانتظار التأكيد", en: "Awaiting confirmation", cls: "bg-amber-100 text-amber-800" },
  paid: { ar: "مدفوع", en: "Paid", cls: "bg-emerald-100 text-emerald-800" },
  completed: { ar: "مكتمل", en: "Completed", cls: "bg-primary/15 text-primary" },
  refunded: { ar: "مُسترد", en: "Refunded", cls: "bg-muted text-muted-foreground" },
  failed: { ar: "ما اكتملش", en: "Not completed", cls: "bg-rose-100 text-rose-800" },
};
const StatusBadge = ({ s, lang }: { s: string; lang: Lang }) => {
  const v = STATUS[s] ?? STATUS.pending;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${v.cls}`}>{v[lang]}</span>;
};
const KIND: Record<MyDonation["targetKind"], { ar: string; en: string }> = {
  case: { ar: "حالة", en: "Case" },
  program: { ar: "برنامج", en: "Program" },
  campaign: { ar: "حملة", en: "Campaign" },
  project: { ar: "مشروع", en: "Project" },
  general: { ar: "تبرع عام", en: "General" },
};
const money = (n: number, lang: Lang) => `${n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} ${lang === "ar" ? "ج.م" : "EGP"}`;
const when = (iso: string, lang: Lang) => (iso ? new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "");

/** «لوحتي»: the donor's giving, its journey to the family, notifications and account settings. */
const DonorDashboard = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab: Tab = isTab(params.get("tab")) ? (params.get("tab") as Tab) : "impact";
  const setTab = (t: Tab) => setParams(t === "impact" ? {} : { tab: t }, { replace: true });
  const notifications = useNotifications();
  const [donations, setDonations] = useState<MyDonation[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () => listMyDonations().then((d) => alive && setDonations(d)).catch(() => alive && setDonations((cur) => cur ?? []));
    load();
    // Back from paying in another tab → fresh statuses.
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible); };
  }, [user]);

  const impact = useMemo(() => {
    const list = donations ?? [];
    const paid = list.filter((d) => d.status === "paid" || d.status === "completed");
    return {
      total: paid.reduce((s, d) => s + d.amount, 0),
      count: list.length,
      delivered: paid.filter((d) => d.delivery?.stage === "delivered").length,
    };
  }, [donations]);

  if (!user) return null;
  const tabs: { id: Tab; ar: string; en: string; icon: typeof Heart }[] = [
    { id: "impact", ar: "أثرك", en: "Impact", icon: TrendingUp },
    { id: "donations", ar: "تبرعاتي", en: "Donations", icon: Heart },
    { id: "notifications", ar: "الإشعارات", en: "Notifications", icon: Bell },
    { id: "account", ar: "الحساب", en: "Account", icon: Settings },
  ];
  const ar = lang === "ar";

  return (
    <PageLayout>
      <SEOHelmet
        noindex
        title={ar ? "لوحة المتبرع | اليسر" : "Donor Dashboard | Al-Yusr"}
        description={ar ? "تابع تبرعاتك لحد ما توصل للأسرة، وإشعاراتك وبيانات حسابك." : "Follow your donations to the family, your notifications and account."}
        path="/dashboard"
      />

      {/* Hero — same width as the header */}
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "لوحتي" : "Dashboard" }]} />
          </div>
          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary/20 text-xl font-black text-secondary ring-4 ring-secondary/30 md:h-20 md:w-20">
                {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initialsOf(user.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-primary-foreground/70">{ar ? "أهلًا" : "Welcome"}</p>
                <h1 className="truncate text-2xl font-black md:text-4xl">{user.name}</h1>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-2 md:min-w-[440px]">
              {[
                { label: ar ? "تبرعاتك المؤكدة" : "Confirmed giving", value: donations ? money(impact.total, lang) : "—" },
                { label: ar ? "عدد التبرعات" : "Donations", value: donations ? impact.count.toLocaleString(ar ? "ar-EG" : "en-US") : "—" },
                { label: ar ? "اتسلّمت للأسر" : "Delivered", value: donations ? impact.delivered.toLocaleString(ar ? "ar-EG" : "en-US") : "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-primary-foreground/10 px-3 py-3 text-center ring-1 ring-secondary/20 backdrop-blur">
                  <dd className="truncate text-base font-black text-secondary md:text-xl">{s.value}</dd>
                  <dt className="mt-0.5 text-[10.5px] font-bold text-primary-foreground/75 md:text-xs">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-20 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition md:text-sm",
                    active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="me-1.5 inline h-3.5 w-3.5" />{t[lang]}
                  {t.id === "notifications" && notifications.unreadCount > 0 && (
                    <span className="ms-1.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">{notifications.unreadCount}</span>
                  )}
                </button>
              );
            })}
          </div>
          <Button asChild size="sm" className="hidden shrink-0 bg-orange-grad font-extrabold text-accent-foreground shadow-cta sm:inline-flex">
            <Link to="/donate"><Heart className="h-4 w-4" /> {ar ? "تبرع جديد" : "New donation"}</Link>
          </Button>
        </div>
      </div>

      {/* pb leaves room for the newsletter card that floats over the page end */}
      <section className="bg-muted/30 pb-24 pt-8 md:pb-32 md:pt-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {tab === "impact" && <ImpactTab donations={donations} impact={impact} lang={lang} onOpenDonations={() => setTab("donations")} />}
          {tab === "donations" && <DonationsTab donations={donations} lang={lang} />}
          {tab === "notifications" && (
            <div className="rounded-3xl bg-card shadow-soft">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
                <div>
                  <h2 className="text-lg font-extrabold text-primary">{ar ? "إشعاراتك" : "Your notifications"}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ar ? "أخبار تبرعاتك هنا: تأكيد الدفع، تحديد الأسرة، التجهيز، وصور التسليم." : "Your donations' news: payment, family chosen, preparation and delivery photos."}
                  </p>
                </div>
                {notifications.unreadCount > 0 && (
                  <Button size="sm" variant="outline" onClick={() => void notifications.markAllRead()} className="shrink-0 rounded-full">
                    <CheckCheck className="me-1 h-4 w-4" />{ar ? "تعليم الكل كمقروء" : "Mark all read"}
                  </Button>
                )}
              </div>
              {!notifications.loaded ? (
                <div className="p-5"><ListSkeleton rows={3} /></div>
              ) : notifications.items.length === 0 ? (
                <NotificationsEmpty text={ar ? "لسه مفيش إشعارات. هنبلغك هنا بكل خطوة في رحلة تبرعك." : "No notifications yet. Every step of your donation will show up here."} />
              ) : (
                <div className="divide-y divide-border">
                  {notifications.items.map((n) => (
                    <NotificationItem key={n.id} n={n} onOpen={(x) => { void notifications.markRead(x.id); }} onDelete={(x) => { void notifications.remove(x.id); }} />
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === "account" && <AccountTab lang={lang} />}
        </div>
      </section>
    </PageLayout>
  );
};

/* ── Impact ─────────────────────────────────────────────────────────────── */
function ImpactTab({ donations, impact, lang, onOpenDonations }: {
  donations: MyDonation[] | null;
  impact: { total: number; count: number; delivered: number };
  lang: Lang;
  onOpenDonations: () => void;
}) {
  const ar = lang === "ar";
  if (donations === null) return <ListSkeleton rows={3} />;
  if (donations.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-8 text-center shadow-soft md:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-primary"><Target className="h-8 w-8" /></div>
        <h2 className="mt-4 text-xl font-black text-primary">{ar ? "ابدأ رحلتك مع اليسر" : "Start your Al-Yusr journey"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {ar ? "أول ما تتبرع، هتشوف هنا تبرعك خطوة بخطوة لحد ما يتسلّم للأسرة." : "Once you donate, you'll follow it here step by step until it reaches a family."}
        </p>
        <Button asChild className="mt-5 bg-orange-grad font-extrabold text-accent-foreground shadow-cta">
          <Link to="/donate"><Heart className="h-4 w-4" /> {ar ? "ابدأ تبرعك الأول" : "Make your first donation"}</Link>
        </Button>
      </div>
    );
  }
  const latest = donations.slice(0, 3);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label={ar ? "تبرعاتك المؤكدة" : "Confirmed giving"} value={money(impact.total, lang)} icon={Heart} tone="orange" />
          <Kpi label={ar ? "عدد تبرعاتك" : "Your donations"} value={impact.count.toLocaleString(ar ? "ar-EG" : "en-US")} icon={Users} tone="lime" />
          <Kpi label={ar ? "اتسلّمت للأسر" : "Delivered"} value={impact.delivered.toLocaleString(ar ? "ar-EG" : "en-US")} icon={Sparkles} tone="primary" />
        </div>
        <div className="rounded-3xl bg-card p-5 shadow-soft md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-primary">{ar ? "آخر تبرعاتك وفين وصلت" : "Your latest donations"}</h2>
            <button type="button" onClick={onOpenDonations} className="text-xs font-extrabold text-accent hover:underline">{ar ? "كل التبرعات" : "All donations"}</button>
          </div>
          <ul className="mt-4 space-y-4">
            {latest.map((d) => (
              <li key={d.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-primary">{d.targetName || KIND[d.targetKind][lang]} — {money(d.amount, lang)}</p>
                  <StatusBadge s={d.status} lang={lang} />
                </div>
                <DeliveryJourney className="mt-4" status={d.status} delivery={d.delivery} createdAt={d.createdAt} lang={lang} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-card">
          <Truck className="h-8 w-8 text-secondary" />
          <h3 className="mt-3 text-lg font-black">{ar ? "تبرعك بيوصل على 5 خطوات" : "Five steps to the family"}</h3>
          <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
            {ar
              ? "بعد تأكيد الدفع، فريقنا الميداني بيحدد الأسرة المستحقة، يجهّز التبرع، ويسلّمه. هنبلغك في كل خطوة هنا وفي الإشعارات."
              : "After payment, our field team chooses the family, prepares the gift and delivers it. You'll be told at each step."}
          </p>
        </div>
        <Link to="/donate/track" className="flex items-center gap-3 rounded-3xl bg-card p-5 text-sm font-extrabold text-primary shadow-soft transition hover:shadow-card">
          <ReceiptText className="h-5 w-5 text-secondary" /> {ar ? "تتبع تبرع برقمه" : "Track a donation by reference"}
        </Link>
      </aside>
    </div>
  );
}

/* ── Donations ──────────────────────────────────────────────────────────── */
type CaseDoc = Awaited<ReturnType<typeof listCaseDocuments>>[number];

function DonationsTab({ donations, lang }: { donations: MyDonation[] | null; lang: Lang }) {
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const [filter, setFilter] = useState<"all" | "case" | "other">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, CaseDoc[]>>({});

  const openRow = (d: MyDonation) => {
    const next = open === d.id ? null : d.id;
    setOpen(next);
    if (next && d.caseId && !docs[d.caseId]) {
      listCaseDocuments(d.caseId).then((list) => setDocs((m) => ({ ...m, [d.caseId as string]: list }))).catch(() => undefined);
    }
  };

  if (donations === null) return <ListSkeleton rows={4} />;
  const list = donations.filter((d) => (filter === "all" ? true : filter === "case" ? d.targetKind === "case" : d.targetKind !== "case"));
  const count = (f: typeof filter) => donations.filter((d) => (f === "all" ? true : f === "case" ? d.targetKind === "case" : d.targetKind !== "case")).length;

  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-primary">{ar ? "سجل التبرعات وتتبّع المسار" : "Donation history and tracking"}</h2>
        <span className="text-xs text-muted-foreground">{donations.length.toLocaleString(ar ? "ar-EG" : "en-US")} {ar ? "عملية" : "items"}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {([["all", ar ? "الكل" : "All"], ["case", ar ? "حالات" : "Cases"], ["other", ar ? "برامج وحملات" : "Programs & campaigns"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn("rounded-full px-3 py-1 text-[11px] font-extrabold transition", filter === id ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:bg-secondary/15")}
          >
            {label} <span className="opacity-70">({count(id)})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold text-muted-foreground">{ar ? "مفيش تبرعات هنا لسه." : "No donations here yet."}</p>
          <Button asChild className="mt-4 bg-orange-grad text-accent-foreground shadow-cta">
            <Link to="/donate"><Heart className="h-4 w-4" /> {ar ? "تبرع دلوقتي" : "Donate now"}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((d) => {
            const isOpen = open === d.id;
            return (
              <li key={d.id} className="rounded-2xl border border-border/60 bg-muted/20">
                <button type="button" onClick={() => openRow(d)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-start" aria-expanded={isOpen}>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground" dir="ltr">#{d.ref}</span>
                      <StatusBadge s={d.status} lang={lang} />
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold", d.targetKind === "case" ? "bg-accent/15 text-accent" : "bg-secondary/20 text-primary")}>
                        {KIND[d.targetKind][lang]}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-sm font-extrabold text-primary">{d.targetName || (ar ? "تبرع عام" : "General donation")}</span>
                    <span className="block text-[11px] text-muted-foreground">{when(d.createdAt, lang)}{d.method ? ` · ${d.method}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-orange-grad px-3 py-1 text-xs font-extrabold text-accent-foreground shadow-cta">{money(d.amount, lang)}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", isOpen && "rotate-180")} />
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-4 border-t border-border/60 p-4">
                    <DeliveryJourney status={d.status} delivery={d.delivery} createdAt={d.createdAt} lang={lang} />
                    {d.status === "pending" && !d.isGateway && (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        {ar ? "بنراجع الدفع (تحويل أو مندوب) وهنأكده خلال 24 ساعة. أول ما يتأكد هتلاقي الخطوة اتعلّمت." : "We're confirming this payment (transfer or pickup) within 24 hours."}
                      </p>
                    )}
                    {d.caseId && (
                      <div>
                        <p className="text-[11px] font-extrabold text-muted-foreground">{ar ? "وثائق وملفات الصرف" : "Disbursement documents"}</p>
                        {(docs[d.caseId] ?? []).length === 0 ? (
                          <p className="mt-1.5 text-[11px] text-muted-foreground">{ar ? "لسه مفيش وثائق منشورة للحالة دي." : "No public documents yet for this case."}</p>
                        ) : (
                          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                            {(docs[d.caseId] ?? []).map((doc) => (
                              <li key={doc.id} className="rounded-lg bg-muted/40 p-2 text-xs">
                                <a href={formatServerImageUrl(doc.storage_path) || doc.storage_path} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-accent hover:underline">
                                  <ReceiptText className="h-3.5 w-3.5" /> <span className="truncate">{doc.caption || doc.doc_type || (ar ? "وثيقة" : "Document")}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs font-bold">
                      <Link to={`/donate/track/${encodeURIComponent(d.ref)}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                        {ar ? "صفحة تتبع التبرع والإيصال" : "Tracking page and receipt"} <ExternalLink className="h-3 w-3" />
                      </Link>
                      {d.caseCode && (
                        <Link to={`/cases/${d.caseCode}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          {ar ? "الحالة وآخر تحديثاتها" : "Case updates"} <Arrow className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Account ────────────────────────────────────────────────────────────── */
function AccountTab({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-3xl bg-card p-6 text-center shadow-soft">
        <AvatarUploader />
        <EmailVerifyCard className="mt-4" />
        <div className="mt-5 grid gap-2">
          <Button variant="outline" onClick={() => { logout(); navigate("/"); }}><LogOut className="h-4 w-4" /> {ar ? "تسجيل الخروج" : "Sign out"}</Button>
          <Button asChild variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5">
            <Link to="/contact"><Trash2 className="h-4 w-4" /> {ar ? "طلب حذف الحساب" : "Ask to delete my account"}</Link>
          </Button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {ar ? "الحذف بيتم من فريق اليسر بعد التأكد إنك صاحب الحساب، وسجل تبرعاتك بيتحفظ للإيصالات." : "The team deletes the account after confirming it is yours; donation records are kept for receipts."}
        </p>
      </aside>
      <div className="min-w-0 space-y-6">
        <section className="rounded-3xl bg-card p-5 shadow-soft md:p-7">
          <h2 className="mb-5 text-lg font-extrabold text-primary">{ar ? "البيانات الشخصية" : "Personal details"}</h2>
          <ProfileDetailsForm />
        </section>
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <section className="rounded-3xl bg-card p-5 shadow-soft md:p-7">
            <h2 className="mb-5 text-lg font-extrabold text-primary">{ar ? "التواصل والإشعارات" : "Contact & updates"}</h2>
            <ContactPreferences />
          </section>
          <div className="space-y-6">
            <section className="rounded-3xl bg-card p-5 shadow-soft md:p-7">
              <h2 className="mb-5 text-lg font-extrabold text-primary">{ar ? "كلمة المرور" : "Password"}</h2>
              <ChangePasswordForm size="compact" />
            </section>
            <section className="rounded-3xl bg-card p-5 shadow-soft md:p-7">
              <h2 className="text-lg font-extrabold text-primary">{ar ? "طرق الدفع المتاحة" : "Ways to pay"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{ar ? "بتختار طريقة الدفع مع كل تبرع. مش بنحفظ بيانات بطاقتك." : "You choose how to pay with each donation. We never store your card."}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {[{ i: CreditCard, ar: "بطاقة بنكية", en: "Bank card" }, { i: Wallet, ar: "فودافون كاش", en: "Vodafone Cash" }, { i: Smartphone, ar: "إنستاباي", en: "InstaPay" }].map((m) => (
                  <li key={m.en} className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-sm font-extrabold">
                    <m.i className="h-5 w-5 text-primary" aria-hidden /> <span>{m[lang]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Heart; tone: "orange" | "lime" | "primary" }) {
  const cls = tone === "orange" ? "from-accent/15 to-accent/5 text-accent" : tone === "lime" ? "from-secondary/25 to-secondary/5 text-primary" : "from-primary/15 to-primary/5 text-primary";
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${cls} p-5 shadow-soft`}>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-card/70"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 text-2xl font-black text-primary md:text-3xl">{value}</div>
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
    </div>
  );
}

export default DonorDashboard;
