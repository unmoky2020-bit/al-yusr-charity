import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, TrendingUp, Users, Settings, Target,
  ReceiptText, ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  CreditCard, Wallet, Smartphone, LogOut, Trash2, Truck, PackageCheck, Wallet2, Hourglass, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { donationsStore, subscribeDonations, type DonationRecord } from "@/data/donationsStore";
import { listMyDonations, listCaseDocuments } from "@/data/casesApi";
import { formatServerImageUrl } from "@/data/laravelApi";
import { toast } from "@/hooks/use-toast";

type Tab = "impact" | "donations" | "account";

/** Steps reflect the lifecycle: pending → paid (received) → distributed → completed (spent). */
type StepKey = "pending" | "received" | "processing" | "delivered";
const STEP_ORDER: StepKey[] = ["pending", "received", "processing", "delivered"];
const STEP_LABEL: Record<StepKey, { ar: string; en: string; icon: typeof Heart }> = {
  pending:    { ar: "قيد الانتظار",        en: "Pending",        icon: Hourglass },
  received:   { ar: "تم الاستلام",         en: "Received",       icon: CheckCircle2 },
  processing: { ar: "قيد المعالجة",        en: "Processing",     icon: PackageCheck },
  delivered:  { ar: "تم التسليم لمستحقيه", en: "Delivered",      icon: Truck },
};

/** Map DB payment_status → index in STEP_ORDER reached (0..3). */
const stepFromStatus = (s?: string | null): number => {
  switch (s) {
    case "pending":   return 0; // only "pending" reached
    case "paid":      return 1; // received; not yet distributed
    case "completed": return 3; // delivered to beneficiaries
    case "refunded":  return 1;
    case "failed":    return 0;
    default:          return 0;
  }
};

const StatusBadge = ({ s, lang }: { s?: string | null; lang: "ar" | "en" }) => {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    pending:   { ar: "قيد الانتظار", en: "Pending",   cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
    paid:      { ar: "مدفوع",         en: "Paid",      cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
    completed: { ar: "مكتمل",         en: "Completed", cls: "bg-primary/15 text-primary" },
    refunded:  { ar: "مُسترد",        en: "Refunded",  cls: "bg-muted text-muted-foreground" },
    failed:    { ar: "فشل",           en: "Failed",    cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" },
  };
  const v = map[s || "pending"] ?? map.pending;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${v.cls}`}>{v[lang]}</span>;
};

/** Compute per-step display dates from available timestamps. */
const buildStepDates = (created?: string, updated?: string, status?: string | null): Record<StepKey, string | null> => {
  const cur = stepFromStatus(status);
  const created_iso = created || null;
  const updated_iso = updated || created || null;
  return {
    pending:    created_iso,
    received:   cur >= 1 ? updated_iso : null,
    processing: cur >= 2 ? updated_iso : null,
    delivered:  cur >= 3 ? updated_iso : null,
  };
};

const DonationTimeline = ({ status, dates, lang }: { status?: string | null; dates?: Record<StepKey, string | null>; lang: "ar" | "en" }) => {
  const cur = stepFromStatus(status);
  return (
    <ol className="relative grid grid-cols-4 gap-2">
      {STEP_ORDER.map((k, i) => {
        const meta = STEP_LABEL[k];
        const Icon = meta.icon;
        const done = i <= cur;
        const active = i === cur + 1;
        const date = dates?.[k];
        return (
          <li key={k} className="flex flex-col items-center text-center">
            <span className={`grid h-9 w-9 place-items-center rounded-full ring-2 transition ${
              done ? "bg-secondary text-secondary-foreground ring-secondary"
                   : active ? "bg-accent/20 text-accent ring-accent/40 animate-pulse"
                   : "bg-muted text-muted-foreground ring-border"
            }`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className={`mt-1.5 text-[10px] font-extrabold ${done || active ? "text-primary" : "text-muted-foreground"}`}>
              {meta[lang]}
            </span>
            {date && (
              <span className="text-[9px] text-muted-foreground" dir="ltr">{new Date(date).toLocaleDateString()}</span>
            )}
          </li>
        );
      })}
      <span aria-hidden className="absolute left-4 right-4 top-4 -z-10 h-0.5 bg-border" />
    </ol>
  );
};

const Inner = () => {
  const { lang } = useLang();
  const { user, updateProfile, logout, removeUser } = useAuth();
  const navigate = useNavigate();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [tab, setTab] = useState<Tab>("impact");
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [dbDonations, setDbDonations] = useState<Awaited<ReturnType<typeof listMyDonations>>>([]);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | "case" | "program">("all");
  const [docsByCase, setDocsByCase] = useState<Record<string, { id: string; storage_path: string; doc_type: string; caption: string | null; created_at: string }[]>>({});

  useEffect(() => {
    const load = () => setDonations(donationsStore.byDonor(user!.email));
    load();
    return subscribeDonations(load);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => { listMyDonations().then(setDbDonations).catch(() => {}); };
    refresh();
    // Refresh when the donor comes back to the tab (e.g. after paying in another tab) —
    // replaces the old Supabase realtime channel.
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { document.removeEventListener("visibilitychange", onVisible); };
  }, [user]);

  // Lazy-load public documents for the case linked to a donation when expanded.
  useEffect(() => {
    if (!openRef) return;
    const row = dbDonations.find((d) => (d as any).ref_code === openRef) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const caseId = row?.case_id;
    if (!caseId || docsByCase[caseId]) return;
    listCaseDocuments(caseId).then((docs) => {
      setDocsByCase((m) => ({ ...m, [caseId]: docs as any })); // eslint-disable-line @typescript-eslint/no-explicit-any
    }).catch(() => { /* ignore — RLS may block private docs */ });
  }, [openRef, dbDonations, docsByCase]);

  // Documents come from Laravel (GET /cases/{id}/documents) as full URLs or storage paths.
  const publicDocUrl = (path: string) => formatServerImageUrl(path) || path;

  // Dedupe local entries against DB rows (DB is the source of truth).
  const dbRefs = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => new Set(dbDonations.map((d: any) => d.ref_code).filter(Boolean)),
    [dbDonations]
  );
  const localOnly = useMemo(
    () => donations.filter((d) => !dbRefs.has(d.ref)),
    [donations, dbRefs]
  );

  const impact = useMemo(() => {
    // Only count completed (delivered) donations toward "total donated impact".
    const dbTotal = dbDonations
      .filter((d) => d.payment_status === "completed")
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const localTotal = localOnly
      .filter((d) => d.status === "completed")
      .reduce((s, d) => s + d.amount, 0);
    const total = localTotal + dbTotal;
    const families = Math.floor(total / 350);
    const meals = Math.floor(total / 25);
    return { total, families, meals, count: localOnly.length + dbDonations.length };
  }, [localOnly, dbDonations]);

  const tabs: { id: Tab; ar: string; en: string; icon: typeof Heart }[] = [
    { id: "impact", ar: "أثرك", en: "Impact", icon: TrendingUp },
    { id: "donations", ar: "تبرعاتي", en: "Donations", icon: Heart },
    { id: "account", ar: "الحساب", en: "Account", icon: Settings },
  ];

  const AccountTab = () => {
    const [form, setForm] = useState({
      name: user!.name, email: user!.email, phone: user!.phone || "",
      currency: "EGP", language: lang,
    });
    const save = async () => {
      try {
        await updateProfile(user!.id, { name: form.name, email: form.email, phone: form.phone });
        toast({ title: lang === "ar" ? "تم الحفظ" : "Saved" });
      } catch { /* AuthContext already showed the server error */ }
    };
    const onLogout = () => { logout(); navigate("/"); };
    const onDelete = () => {
      if (!confirm(lang === "ar" ? "تأكيد حذف الحساب نهائيًا؟" : "Permanently delete account?")) return;
      removeUser(user!.id);
      navigate("/");
    };
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-soft md:p-8">
          <h3 className="text-lg font-extrabold text-primary">{lang === "ar" ? "التفاصيل الشخصية" : "Personal details"}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={lang === "ar" ? "الاسم بالكامل" : "Full name"}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
            </Field>
            <Field label={lang === "ar" ? "رقم الهاتف" : "Phone"}>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="h-11" />
            </Field>
            <Field label={lang === "ar" ? "البريد الإلكتروني" : "Email"}>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
            </Field>
            <Field label={lang === "ar" ? "العملة المفضلة" : "Preferred currency"}>
              <UiSelect value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-bold">
                <option value="EGP">{lang === "ar" ? "الجنيه المصري (EGP)" : "Egyptian Pound (EGP)"}</option>
                <option value="USD">{lang === "ar" ? "دولار أمريكي (USD)" : "US Dollar (USD)"}</option>
                <option value="SAR">{lang === "ar" ? "ريال سعودي (SAR)" : "Saudi Riyal (SAR)"}</option>
              </UiSelect>
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={save} className="bg-orange-grad text-accent-foreground shadow-cta">{lang === "ar" ? "حفظ التغييرات" : "Save changes"}</Button>
            <Button asChild variant="outline"><Link to="/profile">{lang === "ar" ? "إعدادات متقدمة" : "Advanced settings"}</Link></Button>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-soft md:p-8">
          <h3 className="text-lg font-extrabold text-primary">{lang === "ar" ? "طرق الدفع" : "Payment methods"}</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[{i: CreditCard, ar: "بطاقة (Kashier)", en: "Card (Kashier)"},
              {i: Wallet, ar: "Vodafone Cash", en: "Vodafone Cash"},
              {i: Smartphone, ar: "InstaPay", en: "InstaPay"}].map((m) => (
              <button key={m.en} className="flex items-center gap-2 rounded-2xl border-2 border-border p-3 text-start text-sm font-extrabold transition hover:border-secondary">
                <m.i className="h-5 w-5 text-primary" />
                <span>{m[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-destructive/20 bg-card p-6 shadow-soft md:p-8">
          <h3 className="text-lg font-extrabold text-primary">{lang === "ar" ? "إدارة الحساب" : "Account management"}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onLogout}><LogOut className="h-4 w-4" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}</Button>
            <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> {lang === "ar" ? "حذف الحساب" : "Delete account"}
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {lang === "ar" ? "بحذف حسابك، فإنك تقبل بالشروط والأحكام الخاصة بنا." : "By deleting your account, you accept our terms and conditions."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={lang === "ar" ? "لوحة المتبرع | اليسر" : "Donor Dashboard | Al-Yusr"}
        description={lang === "ar" ? "تابع أثر تبرعاتك وانضم لتحديات الخير ودوائر العائلة." : "Track your donation impact and join giving challenges & circles."}
        path="/dashboard"
      />
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[{ name: lang === "ar" ? "الرئيسية" : "Home", href: "/" }, { name: lang === "ar" ? "لوحتي" : "Dashboard" }]} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-primary-foreground/70">{lang === "ar" ? "أهلًا" : "Welcome"}</p>
            <h1 className="text-3xl font-black md:text-4xl">{user!.name}</h1>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur md:top-20">
        <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition md:text-sm ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted"
                }`}>
                <Icon className="me-1.5 inline h-3.5 w-3.5" />{t[lang]}
              </button>
            );
          })}
        </div>
      </div>

      <section className="bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto max-w-5xl px-4">

          {tab === "impact" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label={lang === "ar" ? "إجمالي تبرعاتك" : "Total donated"} value={`${impact.total.toLocaleString()} EGP`} icon={Heart} color="orange" />
                <KpiCard label={lang === "ar" ? "أسر استفادت" : "Families helped"} value={impact.families.toString()} icon={Users} color="lime" />
                <KpiCard label={lang === "ar" ? "وجبات وُزّعت" : "Meals distributed"} value={impact.meals.toLocaleString()} icon={Sparkles} color="primary" />
              </div>

              {localOnly.length + dbDonations.length === 0 ? (
                <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-primary">
                    <Target className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-primary">
                    {lang === "ar" ? "ابدأ رحلتك مع اليسر" : "Start your Al-Yusr journey"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {lang === "ar" ? "بمجرد أن تتبرع، ستبدأ في رؤية قصص وتحديثات مخصصة لك من الميدان." : "Once you donate, you'll start seeing personalized stories and updates from the field."}
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl bg-card p-6 shadow-soft">
                  <h3 className="text-lg font-extrabold text-primary">{lang === "ar" ? "آخر التحديثات" : "Latest updates"}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {dbDonations.slice(0, 3).map((d, idx) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const row = d as any;
                      const label = row.cases?.title
                        || (row.case_categories ? (lang === "ar" ? row.case_categories.name_ar : row.case_categories.name_en) : (lang === "ar" ? "تبرع عام" : "General donation"));
                      return (
                        <li key={row.ref_code || row.id || idx} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                          <div className="flex-1">
                            <p className="font-bold text-primary">{label} — {Number(row.amount).toLocaleString()} {row.currency || "EGP"}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{new Date(row.created_at).toLocaleDateString()} · {row.payment_status}</p>
                          </div>
                        </li>
                      );
                    })}
                    {dbDonations.length === 0 && localOnly.slice(0, 3).map((d) => (
                      <li key={d.ref} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                        <div className="flex-1">
                          <p className="font-bold text-primary">{d.programLabel} — {d.amount} EGP</p>
                          <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()} · {d.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "donations" && (
            <div className="rounded-3xl bg-card p-4 shadow-soft md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-primary">{lang === "ar" ? "سجل التبرعات وتتبّع المسار" : "Donations & step-by-step tracking"}</h3>
                <span className="text-xs text-muted-foreground">{dbDonations.length + localOnly.length} {lang === "ar" ? "عملية" : "items"}</span>
              </div>
              {/* Kind filter — separate case donations from program donations */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {([
                  { id: "all",     ar: "الكل",      en: "All" },
                  { id: "case",    ar: "حالات",     en: "Cases" },
                  { id: "program", ar: "برامج",     en: "Programs" },
                ] as const).map((f) => {
                  const active = kindFilter === f.id;
                  const count = f.id === "all"
                    ? dbDonations.length
                    : f.id === "case"
                      ? dbDonations.filter((d) => (d as any).case_id).length // eslint-disable-line @typescript-eslint/no-explicit-any
                      : dbDonations.filter((d) => !(d as any).case_id).length; // eslint-disable-line @typescript-eslint/no-explicit-any
                  return (
                    <button key={f.id} onClick={() => setKindFilter(f.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${active ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:bg-secondary/15"}`}>
                      {f[lang]} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* DB donations (authenticated, real lifecycle) */}
              {dbDonations.length > 0 && (
                <div className="mt-4 space-y-3">
                  {dbDonations
                    .filter((d) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const isCase = !!(d as any).case_id;
                      if (kindFilter === "case") return isCase;
                      if (kindFilter === "program") return !isCase;
                      return true;
                    })
                    .map((d, idx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const row = d as any;
                    const ref = row.ref_code as string;
                    const isOpen = openRef === ref;
                    const isCase = !!row.case_id;
                    return (
                      <article key={ref || row.id || idx} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                        <header className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">#{ref}</span>
                              <StatusBadge s={row.payment_status} lang={lang} />
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${isCase ? "bg-accent/15 text-accent" : "bg-secondary/20 text-primary"}`}>
                                {isCase ? (lang === "ar" ? "حالة" : "Case") : (lang === "ar" ? "برنامج" : "Program")}
                              </span>
                            </div>
                            <h4 className="mt-1 truncate text-sm font-extrabold text-primary">
                              {row.cases?.title || (row.case_categories ? (lang === "ar" ? row.case_categories.name_ar : row.case_categories.name_en) : (lang === "ar" ? "تبرع عام" : "General donation"))}
                            </h4>
                            <p className="text-[11px] text-muted-foreground" dir="ltr">
                              {new Date(row.created_at).toLocaleString()} · {row.payment_method || "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-orange-grad px-3 py-1 text-xs font-extrabold text-accent-foreground shadow-cta">
                              {Number(row.amount).toLocaleString()} {row.currency || "EGP"}
                            </span>
                            <button onClick={() => setOpenRef(isOpen ? null : ref)} className="grid h-7 w-7 place-items-center rounded-full bg-card text-muted-foreground hover:bg-secondary/20" aria-label="toggle">
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </header>

                        {isOpen && (
                          <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                            <DonationTimeline
                              status={row.payment_status}
                              dates={buildStepDates(row.created_at, row.updated_at, row.payment_status)}
                              lang={lang}
                            />
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                {lang === "ar" ? "تاريخ المعاملة" : "Transaction history"}
                              </div>
                              <ul className="mt-2 space-y-1.5 text-xs">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-secondary" /><span dir="ltr">{new Date(row.created_at).toLocaleString()}</span> — {lang === "ar" ? "تم إنشاء التبرع" : "Donation created"}</li>
                                {row.payment_status !== "pending" && (
                                  <li className="flex items-center gap-2"><Wallet2 className="h-3.5 w-3.5 text-accent" /><span dir="ltr">{new Date(row.updated_at || row.created_at).toLocaleString()}</span> — {lang === "ar" ? "تأكيد الدفع" : "Payment confirmed"} <StatusBadge s={row.payment_status} lang={lang} /></li>
                                )}
                                {row.cases?.ref_code && (
                                  <li className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" />{lang === "ar" ? "موجّه إلى الحالة" : "Linked to case"} <Link to={`/cases/${row.cases.ref_code}`} className="font-bold text-accent hover:underline" dir="ltr">{row.cases.ref_code}</Link></li>
                                )}
                              </ul>
                            </div>
                            {row.case_id && (
                              <div>
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                  {lang === "ar" ? "وثائق وملفات الصرف" : "Disbursement files & documents"}
                                </div>
                                {(() => {
                                  const docs = docsByCase[row.case_id] || [];
                                  if (docs.length === 0) return (
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                      {lang === "ar" ? "لا توجد وثائق منشورة بعد لهذه الحالة." : "No public files published yet for this case."}
                                    </p>
                                  );
                                  return (
                                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                      {docs.map((d) => (
                                        <li key={d.id} className="rounded-lg bg-muted/40 p-2 text-xs">
                                          <a href={publicDocUrl(d.storage_path)} target="_blank" rel="noreferrer"
                                             className="flex items-center gap-2 font-bold text-accent hover:underline">
                                            <ReceiptText className="h-3.5 w-3.5" />
                                            <span className="truncate">{d.caption || d.doc_type || (lang === "ar" ? "وثيقة" : "Document")}</span>
                                          </a>
                                          <span className="block text-[10px] text-muted-foreground" dir="ltr">{new Date(d.created_at).toLocaleString()}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                })()}
                              </div>
                            )}
                            {row.cases?.ref_code && (
                              <Link to={`/cases/${row.cases.ref_code}`} className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                                {lang === "ar" ? "عرض الحالة وآخر التحديثات" : "View case updates"} <Arrow className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {dbDonations.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-bold text-muted-foreground">{lang === "ar" ? "لا توجد تبرعات بعد." : "No donations yet."}</p>
                  <Button asChild className="mt-4 bg-orange-grad text-accent-foreground shadow-cta">
                    <Link to="/donate"><Heart className="h-4 w-4" /> {lang === "ar" ? "ابدأ تبرعك الأول" : "Make your first donation"}</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === "account" && (
            <AccountTab />
          )}
        </div>
      </section>
    </PageLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-extrabold text-muted-foreground">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const KpiCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Heart; color: "orange" | "lime" | "primary" }) => {
  const cls =
    color === "orange" ? "from-accent/15 to-accent/5 text-accent"
    : color === "lime" ? "from-secondary/25 to-secondary/5 text-primary"
    : "from-primary/15 to-primary/5 text-primary";
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${cls} p-5 shadow-soft`}>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-card/70">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-black text-primary md:text-3xl">{value}</div>
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
    </div>
  );
};

const DonorDashboard = () => (
  <RequireAuth>
    <Inner />
  </RequireAuth>
);

export default DonorDashboard;
