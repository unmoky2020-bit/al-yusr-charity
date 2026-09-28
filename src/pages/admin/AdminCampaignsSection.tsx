import { useMemo } from "react";
import { formatNumberEN } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { programs } from "@/data/programs";
import { useCampaignsSettings } from "@/data/campaignsSettings";
import { useCampaignsMetrics } from "@/lib/campaignsMetrics";
import { useLang } from "@/i18n/LangContext";
import { GripVertical, ArrowUp, ArrowDown, RotateCcw, MousePointerClick, Heart, TrendingUp } from "lucide-react";

/**
 * /admin/campaigns-section — controls the homepage "Al-Yusr Campaigns"
 * horizontal-scroll section: which programs appear, in what order, how
 * fast the horizontal scroll plays, and the headline copy.
 */
const AdminCampaignsSection = () => {
  const { settings, update, reset } = useCampaignsSettings();
  const { metrics, reset: resetMetrics } = useCampaignsMetrics();
  const { toast } = useToast();
  const { lang } = useLang();
  const isAr = lang === "ar";

  // Merge admin-curated order with any new programs added later so the
  // admin UI always reflects the full catalog (the homepage uses the same
  // merging logic via getVisibleCampaignPrograms).
  const orderedSlugs = useMemo(() => {
    const saved = settings.enabledSlugs ?? [];
    const savedSet = new Set(saved);
    const appended = programs.map((p) => p.slug).filter((s) => !savedSet.has(s));
    return [...saved, ...appended];
  }, [settings.enabledSlugs]);

  const disabledSet = useMemo(
    () => new Set(settings.disabledSlugs ?? []),
    [settings.disabledSlugs],
  );

  const toggleSlug = (slug: string) => {
    const next = new Set(disabledSet);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ disabledSlugs: [...next] });
  };

  const move = (slug: string, dir: -1 | 1) => {
    const idx = orderedSlugs.indexOf(slug);
    if (idx < 0) return;
    const next = [...orderedSlugs];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    update({ enabledSlugs: next });
  };

  return (
    <AdminLayout>
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="mx-auto max-w-4xl space-y-6 p-6 text-start [&_label]:block [&_label]:text-start"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary">قسم حملات اليسر</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              تحكم في البرامج اللي تظهر في كاروسيل الحملات على الصفحة الرئيسية، ترتيبها، وسرعة التمرير.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { reset(); toast({ title: "تمت الاستعادة" }); }}>
            <RotateCcw className="h-4 w-4" /> استعادة الافتراضي
          </Button>
        </header>

        <Tabs defaultValue="content" dir={isAr ? "rtl" : "ltr"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">محتوى القسم</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-6">
        {/* General */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-black text-primary">إعدادات عامة</h2>
          <div className="mt-4 grid gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-bold">إظهار القسم</Label>
                <p className="text-xs text-muted-foreground">إخفاء أو إظهار قسم الحملات بالكامل على الصفحة الرئيسية.</p>
              </div>
              <Switch checked={settings.enabled} onCheckedChange={(v) => update({ enabled: v })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-bold">إظهار بطاقة الدعوة النهائية</Label>
                <p className="text-xs text-muted-foreground">البطاقة الذهبية في نهاية الكاروسيل (تبرعك النهارده يصنع الفرق).</p>
              </div>
              <Switch checked={settings.showFinalCta} onCheckedChange={(v) => update({ showFinalCta: v })} />
            </div>
            <div>
              <Label className="font-bold">سرعة التمرير الأفقي</Label>
              <p className="text-xs text-muted-foreground">القيم الأعلى = تمرير أبطأ وأكثر سلاسة (مساحة أطول للسكرول).</p>
              <div className="mt-3 flex items-center gap-4">
                <Slider
                  value={[settings.scrollSpeed]}
                  min={1}
                  max={4}
                  step={0.1}
                  onValueChange={([v]) => update({ scrollSpeed: v })}
                  className="flex-1"
                />
                <span className="w-16 text-end font-mono text-sm font-bold text-primary">{settings.scrollSpeed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </section>

        {/* Copy */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-black text-primary">نصوص رأس القسم</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            عدّل العنوان والوصف الظاهر فوق الكاروسيل على الصفحة الرئيسية. اتركه فارغًا للرجوع للنص الافتراضي.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label>العنوان (عربي)</Label>
              <Input
                dir="rtl"
                value={settings.title?.ar ?? ""}
                placeholder="حملات تصنع الأثر"
                onChange={(e) => update({ title: { ar: e.target.value, en: settings.title?.en ?? "" } })}
              />
            </div>
            <div>
              <Label>Title (English)</Label>
              <Input
                dir="ltr"
                value={settings.title?.en ?? ""}
                placeholder="Campaigns that make impact"
                onChange={(e) => update({ title: { ar: settings.title?.ar ?? "", en: e.target.value } })}
              />
            </div>
            <div>
              <Label>الوصف (عربي)</Label>
              <Input
                dir="rtl"
                value={settings.subtitle?.ar ?? ""}
                placeholder="اكتب وصفًا قصيرًا يحفّز الزائر للتمرير — مثال: مرّر بهدوء، كل بطاقة قصة أثر حقيقية"
                onChange={(e) => update({ subtitle: { ar: e.target.value, en: settings.subtitle?.en ?? "" } })}
              />
            </div>
            <div>
              <Label>Subtitle (English)</Label>
              <Input
                dir="ltr"
                value={settings.subtitle?.en ?? ""}
                placeholder="Short line that invites the visitor to scroll — e.g. Scroll gently; every card is a real story of impact"
                onChange={(e) => update({ subtitle: { ar: settings.subtitle?.ar ?? "", en: e.target.value } })}
              />
            </div>
          </div>
        </section>

        {/* Programs list */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-black text-primary">البرامج المعروضة</h2>
          <p className="mt-1 text-xs text-muted-foreground">رتب البرامج بالأسهم وفعّل/عطل أي برنامج. الترتيب هنا هو نفس ترتيب الظهور.</p>

          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
            إجمالي البرامج: <span className="text-primary">{orderedSlugs.length}</span> — الظاهر حاليًا:{" "}
            <span className="text-primary">{orderedSlugs.length - disabledSet.size}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {orderedSlugs.map((slug, i) => {
              const p = programs.find((x) => x.slug === slug);
              if (!p) return null;
              const isDisabled = disabledSet.has(slug);
              return (
                <li
                  key={slug}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                    isDisabled
                      ? "border-dashed border-border bg-muted/30 opacity-60"
                      : "border-border bg-background"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <img
                    src={p.image}
                    alt=""
                    className={`h-12 w-12 rounded-lg object-cover ${isDisabled ? "grayscale" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-bold text-primary">{p.ar.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.slug}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(slug, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={i === orderedSlugs.length - 1} onClick={() => move(slug, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Switch checked={!isDisabled} onCheckedChange={() => toggleSlug(slug)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-primary">إحصائيات القسم</h2>
                <Button variant="outline" size="sm" onClick={() => { resetMetrics(); toast({ title: "تم تصفير العدادات" }); }}>
                  <RotateCcw className="h-4 w-4" /> تصفير
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                عدّادات محلية (متصفح المستخدم) — كل حدث يُرسل أيضًا لـ GTM/Google Analytics/Meta Pixel كمصدر بيانات موحّد.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <StatTile icon={TrendingUp} label="ظهور القسم" value={metrics.sectionViews} />
                <StatTile icon={MousePointerClick} label="نقرات التفاصيل" value={sum(metrics.bySlug, "details_click")} />
                <StatTile icon={Heart} label="نقرات التبرع" value={sum(metrics.bySlug, "donate_click")} />
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-end text-xs font-bold text-muted-foreground">
                      <th className="py-2 text-start">البرنامج</th>
                      <th className="py-2">تفاصيل</th>
                      <th className="py-2">تبرع</th>
                      <th className="py-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...programs.map((p) => ({ slug: p.slug, name: p.ar.name })),
                      { slug: "__cta__", name: "بطاقة CTA النهائية" }].map((row) => {
                      const m = metrics.bySlug[row.slug] || { details_click: 0, donate_click: 0 };
                      const total = (m.details_click || 0) + (m.donate_click || 0);
                      return (
                        <tr key={row.slug} className="border-b border-border/60">
                          <td className="py-2 font-semibold text-primary">{row.name}</td>
                          <td className="py-2 text-center font-mono">{m.details_click}</td>
                          <td className="py-2 text-center font-mono">{m.donate_click}</td>
                          <td className="py-2 text-center font-mono text-muted-foreground">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCampaignsSection;

const StatTile = ({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-background p-3">
    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
      <Icon className="h-4 w-4 text-secondary" />
      {label}
    </div>
    <div className="mt-1 font-mono text-2xl font-black text-primary">{formatNumberEN(value)}</div>
  </div>
);

const sum = (
  bySlug: Record<string, { details_click: number; donate_click: number }>,
  key: "details_click" | "donate_click",
) => Object.values(bySlug).reduce((acc, r) => acc + (r?.[key] || 0), 0);