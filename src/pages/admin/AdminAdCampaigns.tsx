import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone, ExternalLink, Plus, Save, Trash2, Filter, Copy, RefreshCw,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { formatNumberEN } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";

import { programs } from "@/data/programs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type AdCampaign = {
  id: string;
  slug: string;
  name: string;
  status: string;
  channel: string;
  program_slug: string | null;
  target_url: string | null;
  hero_image_url: string | null;
  headline_ar: string;
  headline_en: string;
  subheadline_ar: string;
  subheadline_en: string;
  cta_label_ar: string;
  cta_label_en: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string | null;
  utm_content: string | null;
  budget_egp: number;
  spend_egp: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type AdEvent = {
  campaign_id: string;
  event_type: string;
  donation_amount: number | null;
  created_at: string;
};

const slugify = (s: string) =>
  s.toString().trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60) || `c-${Date.now()}`;

const emptyForm = (): Partial<AdCampaign> => ({
  slug: "",
  name: "",
  status: "draft",
  channel: "facebook",
  program_slug: null,
  target_url: null,
  hero_image_url: null,
  headline_ar: "",
  headline_en: "",
  subheadline_ar: "",
  subheadline_en: "",
  cta_label_ar: "تبرع الآن",
  cta_label_en: "Donate now",
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  budget_egp: 0,
  spend_egp: 0,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: null,
});

const dateNDaysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
};

const Page = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [events, setEvents] = useState<AdEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState<string>(dateNDaysAgo(30));
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Partial<AdCampaign>>(emptyForm());

  const load = async () => {
    setLoading(true);
    // ad_campaigns table is Supabase-only — not available with Laravel backend
    setCampaigns([]);
    setEvents([]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (channel !== "all" && c.channel !== channel) return false;
      if (program !== "all" && c.program_slug !== program) return false;
      return true;
    });
  }, [campaigns, channel, program]);

  const stats = useMemo(() => {
    const ids = new Set(filteredCampaigns.map((c) => c.id));
    const evs = events.filter((e) => ids.has(e.campaign_id));
    const views = evs.filter((e) => e.event_type === "page_view").length;
    const clicks = evs.filter((e) => e.event_type === "cta_click").length;
    const completed = evs.filter((e) => e.event_type === "donation_completed");
    const conversions = completed.length;
    const revenue = completed.reduce((s, e) => s + Number(e.donation_amount || 0), 0);
    const spend = filteredCampaigns.reduce((s, c) => s + Number(c.spend_egp || 0), 0);
    const ctr = views ? (clicks / views) * 100 : 0;
    const cvr = clicks ? (conversions / clicks) * 100 : 0;
    const roas = spend ? revenue / spend : 0;
    return { views, clicks, conversions, revenue, spend, ctr, cvr, roas };
  }, [events, filteredCampaigns]);

  const perCampaign = useMemo(() => {
    return filteredCampaigns.map((c) => {
      const evs = events.filter((e) => e.campaign_id === c.id);
      const views = evs.filter((e) => e.event_type === "page_view").length;
      const clicks = evs.filter((e) => e.event_type === "cta_click").length;
      const completed = evs.filter((e) => e.event_type === "donation_completed");
      const conversions = completed.length;
      const revenue = completed.reduce((s, e) => s + Number(e.donation_amount || 0), 0);
      const spend = Number(c.spend_egp || 0);
      return {
        c,
        views, clicks, conversions, revenue, spend,
        ctr: views ? (clicks / views) * 100 : 0,
        cvr: clicks ? (conversions / clicks) * 100 : 0,
        roas: spend ? revenue / spend : 0,
      };
    });
  }, [filteredCampaigns, events]);

  const openCreate = () => { setForm(emptyForm()); setOpenForm(true); };
  const openEdit = (c: AdCampaign) => { setForm({ ...c }); setOpenForm(true); };

  const save = async () => {
    toast({ title: isAr ? "هذه الميزة غير متاحة حالياً" : "Feature not available without Supabase", variant: "destructive" });
  };

  const remove = async (_id: string) => {
    toast({ title: isAr ? "هذه الميزة غير متاحة حالياً" : "Feature not available", variant: "destructive" });
  };

  const buildLink = (c: AdCampaign) => {
    const params = new URLSearchParams({
      utm_source: c.utm_source || "",
      utm_medium: c.utm_medium || "",
      utm_campaign: c.utm_campaign || c.slug,
      ...(c.utm_term ? { utm_term: c.utm_term } : {}),
      ...(c.utm_content ? { utm_content: c.utm_content } : {}),
    });
    return `${window.location.origin}/c/${c.slug}?${params.toString()}`;
  };

  const copyLink = async (c: AdCampaign) => {
    try { await navigator.clipboard.writeText(buildLink(c)); toast({ title: isAr ? "تم النسخ" : "Copied" }); } catch {}
  };

  return (
    <AdminLayout title={{ ar: "حملات إعلانية", en: "Ad Campaigns" }}>
      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" /> {isAr ? "الفلاتر" : "Filters"}
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">{isAr ? "من" : "From"}</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">{isAr ? "إلى" : "To"}</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">{isAr ? "القناة" : "Channel"}</label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="other">{isAr ? "أخرى" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">{isAr ? "البرنامج" : "Program"}</label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p[lang].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={load} className="h-9"><RefreshCw className="h-4 w-4" /> {isAr ? "تحديث" : "Refresh"}</Button>
              <Button onClick={openCreate} className="h-9 bg-orange-grad text-accent-foreground"><Plus className="h-4 w-4" /> {isAr ? "حملة جديدة" : "New campaign"}</Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label={isAr ? "مشاهدات الصفحة" : "Page views"} value={formatNumberEN(stats.views)} />
          <StatCard label={isAr ? "نقرات CTA" : "CTA clicks"} value={formatNumberEN(stats.clicks)} sub={`CTR ${stats.ctr.toFixed(1)}%`} />
          <StatCard label={isAr ? "تبرعات مكتملة" : "Conversions"} value={formatNumberEN(stats.conversions)} sub={`CVR ${stats.cvr.toFixed(1)}%`} />
          <StatCard label="ROAS" value={`${stats.roas.toFixed(2)}x`} sub={`${formatNumberEN(stats.revenue)} / ${formatNumberEN(stats.spend)} EGP`} accent />
        </div>

        {/* Per-campaign table */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 border-b p-4">
            <Megaphone className="h-4 w-4 text-accent" />
            <h2 className="font-extrabold text-primary">{isAr ? "أداء الحملات" : "Campaign performance"}</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "القناة" : "Channel"}</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CVR</TableHead>
                  <TableHead className="text-right">{isAr ? "إيراد" : "Revenue"}</TableHead>
                  <TableHead className="text-right">{isAr ? "إنفاق" : "Spend"}</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">{isAr ? "أدوات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground">…</TableCell></TableRow>
                )}
                {!loading && perCampaign.length === 0 && (
                  <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                    {isAr ? "لا توجد حملات بعد. أنشئ أول حملة." : "No campaigns yet. Create your first one."}
                  </TableCell></TableRow>
                )}
                {perCampaign.map((row) => (
                  <TableRow key={row.c.id}>
                    <TableCell>
                      <div className="font-bold text-primary">{row.c.name}</div>
                      <div className="text-xs text-muted-foreground">/c/{row.c.slug}</div>
                    </TableCell>
                    <TableCell><Badge variant={row.c.status === "active" ? "default" : "secondary"}>{row.c.status}</Badge></TableCell>
                    <TableCell className="capitalize">{row.c.channel}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.views}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.clicks}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.ctr.toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{row.conversions}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.cvr.toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumberEN(row.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumberEN(row.spend)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold">{row.roas.toFixed(2)}x</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" title={isAr ? "نسخ رابط UTM" : "Copy UTM link"} onClick={() => copyLink(row.c)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button asChild size="sm" variant="ghost" title={isAr ? "افتح" : "Open"}>
                          <Link to={`/c/${row.c.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row.c)}>{isAr ? "تعديل" : "Edit"}</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(row.c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? (isAr ? "تعديل حملة" : "Edit campaign") : (isAr ? "حملة جديدة" : "New campaign")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={isAr ? "اسم داخلي" : "Internal name"}>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
            </Field>
            <Field label="Slug (/c/:slug)">
              <Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </Field>
            <Field label={isAr ? "الحالة" : "Status"}>
              <Select value={form.status || "draft"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="paused">paused</SelectItem>
                  <SelectItem value="archived">archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={isAr ? "القناة" : "Channel"}>
              <Select value={form.channel || "facebook"} onValueChange={(v) => setForm({ ...form, channel: v, utm_source: form.utm_source || v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">facebook</SelectItem>
                  <SelectItem value="instagram">instagram</SelectItem>
                  <SelectItem value="google">google</SelectItem>
                  <SelectItem value="tiktok">tiktok</SelectItem>
                  <SelectItem value="email">email</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={isAr ? "البرنامج المرتبط" : "Linked program"}>
              <Select value={form.program_slug || "__none"} onValueChange={(v) => setForm({ ...form, program_slug: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{isAr ? "بدون" : "None"}</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p[lang].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={isAr ? "رابط هدف مخصص (اختياري)" : "Custom target URL (optional)"}>
              <Input dir="ltr" value={form.target_url || ""} onChange={(e) => setForm({ ...form, target_url: e.target.value || null })} placeholder="/donate?program=…" />
            </Field>
            <Field label={isAr ? "صورة الـHero" : "Hero image URL"}>
              <Input dir="ltr" value={form.hero_image_url || ""} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value || null })} />
            </Field>
            <Field label={isAr ? "زر CTA (عربي)" : "CTA label (AR)"}>
              <Input value={form.cta_label_ar || ""} onChange={(e) => setForm({ ...form, cta_label_ar: e.target.value })} />
            </Field>
            <Field label={isAr ? "العنوان (عربي)" : "Headline (AR)"}>
              <Input value={form.headline_ar || ""} onChange={(e) => setForm({ ...form, headline_ar: e.target.value })} />
            </Field>
            <Field label={isAr ? "العنوان (إنجليزي)" : "Headline (EN)"}>
              <Input value={form.headline_en || ""} onChange={(e) => setForm({ ...form, headline_en: e.target.value })} />
            </Field>
            <Field label={isAr ? "الوصف (عربي)" : "Subheadline (AR)"} className="md:col-span-2">
              <textarea className="min-h-[70px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.subheadline_ar || ""} onChange={(e) => setForm({ ...form, subheadline_ar: e.target.value })} />
            </Field>
            <Field label={isAr ? "الوصف (إنجليزي)" : "Subheadline (EN)"} className="md:col-span-2">
              <textarea className="min-h-[70px] w-full rounded-md border border-input bg-background p-2 text-sm" value={form.subheadline_en || ""} onChange={(e) => setForm({ ...form, subheadline_en: e.target.value })} />
            </Field>
            <Field label="utm_source"><Input dir="ltr" value={form.utm_source || ""} onChange={(e) => setForm({ ...form, utm_source: e.target.value })} /></Field>
            <Field label="utm_medium"><Input dir="ltr" value={form.utm_medium || ""} onChange={(e) => setForm({ ...form, utm_medium: e.target.value })} /></Field>
            <Field label="utm_campaign"><Input dir="ltr" value={form.utm_campaign || ""} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} placeholder={form.slug || ""} /></Field>
            <Field label="utm_content"><Input dir="ltr" value={form.utm_content || ""} onChange={(e) => setForm({ ...form, utm_content: e.target.value })} /></Field>
            <Field label={isAr ? "الميزانية (EGP)" : "Budget (EGP)"}><Input type="number" value={form.budget_egp ?? 0} onChange={(e) => setForm({ ...form, budget_egp: Number(e.target.value) })} /></Field>
            <Field label={isAr ? "الإنفاق الفعلي (EGP)" : "Spend (EGP)"}><Input type="number" value={form.spend_egp ?? 0} onChange={(e) => setForm({ ...form, spend_egp: Number(e.target.value) })} /></Field>
            <Field label={isAr ? "بداية" : "Start date"}><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value || null })} /></Field>
            <Field label={isAr ? "نهاية" : "End date"}><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-orange-grad text-accent-foreground"><Save className="h-4 w-4" /> {isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`block ${className || ""}`}>
    <span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default function AdminAdCampaigns() {
  return (
    <RequireAuth roles={["admin", "editor"]}>
      <Page />
    </RequireAuth>
  );
}