import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Mail, Send, Eye, MousePointerClick, Plus, Trash2, RefreshCw, ArrowLeft } from "lucide-react";

type Campaign = {
  id: string;
  subject: string;
  preheader: string | null;
  html: string;
  text_body: string | null;
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
};

const TEMPLATES: { name: string; subject: string; html: string }[] = [
  {
    name: "ترحيب",
    subject: "أهلًا بك في نشرة اليسر 🌿",
    html: `<h2>أهلًا بك في عائلة اليسر</h2><p>سعداء بانضمامك لقائمتنا. كل أسبوعين هنبعتلك أحدث القصص والحملات.</p><p><a href="https://elyusr.org/donate">تبرع الآن</a></p>`,
  },
  {
    name: "قصة شهرية",
    subject: "قصة هذا الشهر — أثر تبرعك",
    html: `<h2>قصة من الميدان</h2><p>اكتب هنا قصة المستفيد، الصورة، والأثر…</p><p><a href="https://elyusr.org/stories">شاهد المزيد من القصص</a></p>`,
  },
  {
    name: "حملة عاجلة",
    subject: "حملة طارئة — احتياجنا لدعمك الآن",
    html: `<h2>حملة عاجلة</h2><p>تفاصيل الحملة، المبلغ المستهدف، والمدة…</p><p><a href="https://elyusr.org/campaigns">المشاركة في الحملة</a></p>`,
  },
];

const empty: Partial<Campaign> = {
  subject: "", preheader: "", html: "", text_body: "", from_name: "مؤسسة اليسر",
  from_email: "", reply_to: "", status: "draft",
};

const AdminNewsletterCampaigns = () => {
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<Partial<Campaign> | null>(null);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [sending, setSending] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("newsletter_campaigns").select("*")
      .order("created_at", { ascending: false });
    setList((data ?? []) as Campaign[]);
    const { count } = await supabase.from("newsletter_subscribers")
      .select("*", { count: "exact", head: true }).eq("status", "confirmed");
    setConfirmedCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    if (!active) return;
    if (!active.subject?.trim()) { toast({ title: "اكتب عنوان الموضوع" }); return; }
    const payload = {
      subject: active.subject!, preheader: active.preheader || null,
      html: active.html || "", text_body: active.text_body || null,
      from_name: active.from_name || "مؤسسة اليسر",
      from_email: active.from_email || null, reply_to: active.reply_to || null,
      status: active.status || "draft",
      scheduled_at: active.scheduled_at || null,
    };
    if (active.id) {
      const { error } = await supabase.from("newsletter_campaigns").update(payload).eq("id", active.id);
      if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); return; }
      toast({ title: "تم الحفظ" });
    } else {
      const { data, error } = await supabase.from("newsletter_campaigns").insert(payload).select().single();
      if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); return; }
      setActive(data as Campaign);
      toast({ title: "تم الإنشاء" });
    }
    fetchAll();
  };

  const sendCampaign = async (testEmail?: string) => {
    if (!active?.id) { toast({ title: "احفظ المسودة أولًا" }); return; }
    if (!testEmail && !confirm(`إرسال الحملة لـ ${confirmedCount} مشترك مؤكد؟`)) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-send", {
        body: { campaign_id: active.id, test_email: testEmail },
      });
      if (error) throw error;
      toast({ title: testEmail ? "تم إرسال نسخة تجريبية" : "تم الإرسال", description: `أُرسلت ${(data as any)?.sent ?? 0} — فشل ${(data as any)?.failed ?? 0}`,
      });
      fetchAll();
      if (active.id) {
        const { data: refreshed } = await supabase.from("newsletter_campaigns").select("*").eq("id", active.id).single();
        if (refreshed) setActive(refreshed as Campaign);
      }
    } catch (e) {
      toast({ title: "تعذّر الإرسال", description: String((e as Error).message), variant: "destructive" });
    } finally { setSending(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الحملة وسجلها؟")) return;
    await supabase.from("newsletter_campaigns").delete().eq("id", id);
    if (active?.id === id) setActive(null);
    fetchAll();
  };

  if (active) {
    const openRate = active.recipients_count ? Math.round(((active.opened_count ?? 0) / active.recipients_count) * 100) : 0;
    const clickRate = active.recipients_count ? Math.round(((active.clicked_count ?? 0) / active.recipients_count) * 100) : 0;
    return (
      <div className="space-y-4 p-4 md:p-6" dir="rtl">
        <Helmet><title>تعديل حملة | اليسر</title></Helmet>
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setActive(null)}><ArrowLeft className="h-4 w-4 ml-1" /> رجوع</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const t = prompt("أرسل تجربة إلى:");
              if (t) sendCampaign(t);
            }} disabled={sending}>إرسال تجربة</Button>
            <Button onClick={save}>حفظ</Button>
            <Button onClick={() => sendCampaign()} disabled={sending || !active.id} className="bg-primary">
              <Send className="h-4 w-4 ml-1" /> إرسال للجميع ({confirmedCount})
            </Button>
          </div>
        </div>

        {active.id && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3"><div className="text-xs text-muted-foreground">الحالة</div><div className="font-bold">{active.status}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">المستلمون</div><div className="font-bold">{active.recipients_count ?? 0}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">تم الإرسال</div><div className="font-bold">{active.sent_count ?? 0}</div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">فتح</div><div className="font-bold">{active.opened_count ?? 0} <span className="text-xs">({openRate}%)</span></div></Card>
            <Card className="p-3"><div className="text-xs text-muted-foreground">نقر</div><div className="font-bold">{active.clicked_count ?? 0} <span className="text-xs">({clickRate}%)</span></div></Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label>الموضوع</Label>
              <Input value={active.subject || ""} onChange={(e) => setActive({ ...active, subject: e.target.value })} />
            </div>
            <div>
              <Label>Preheader (تلميح أسفل الموضوع)</Label>
              <Input value={active.preheader || ""} onChange={(e) => setActive({ ...active, preheader: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>اسم المرسل</Label><Input value={active.from_name || ""} onChange={(e) => setActive({ ...active, from_name: e.target.value })} /></div>
              <div><Label>بريد المرسل (From)</Label><Input dir="ltr" value={active.from_email || ""} onChange={(e) => setActive({ ...active, from_email: e.target.value })} placeholder="newsletter@yourdomain.com" /></div>
            </div>
            <div><Label>Reply-To</Label><Input dir="ltr" value={active.reply_to || ""} onChange={(e) => setActive({ ...active, reply_to: e.target.value })} /></div>
            <div>
              <Label>قوالب جاهزة</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TEMPLATES.map((t) => (
                  <Button key={t.name} type="button" variant="outline" size="sm"
                    onClick={() => setActive({ ...active, subject: t.subject, html: t.html })}>{t.name}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>HTML</Label>
              <Textarea dir="ltr" rows={14} value={active.html || ""} onChange={(e) => setActive({ ...active, html: e.target.value })} className="font-mono text-xs" />
            </div>
            <div>
              <Label>نسخة نصية (اختياري)</Label>
              <Textarea rows={3} value={active.text_body || ""} onChange={(e) => setActive({ ...active, text_body: e.target.value })} />
            </div>
          </Card>
          <Card className="p-4">
            <Label>معاينة</Label>
            <div className="mt-2 rounded-2xl border bg-card p-4 max-h-[600px] overflow-auto">
              <div className="text-xs text-muted-foreground mb-1">{active.from_name} &lt;{active.from_email || "—"}&gt;</div>
              <div className="font-bold mb-1">{active.subject || "(بدون عنوان)"}</div>
              {active.preheader && <div className="text-xs text-muted-foreground mb-3">{active.preheader}</div>}
              <div dir="rtl" className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: active.html || "" }} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6" dir="rtl">
      <Helmet><title>حملات النشرة | اليسر</title></Helmet>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-extrabold">حملات النشرة البريدية</h1>
          <Badge variant="secondary">{confirmedCount} مؤكد</Badge>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/newsletter"><Button variant="outline">المشتركون</Button></Link>
          <Button variant="outline" onClick={fetchAll} disabled={loading}><RefreshCw className="h-4 w-4 ml-1" /> تحديث</Button>
          <Button onClick={() => setActive({ ...empty })}><Plus className="h-4 w-4 ml-1" /> حملة جديدة</Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-right">
              <th className="p-3">الموضوع</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">المستلمون</th>
              <th className="p-3"><Eye className="inline h-4 w-4" /></th>
              <th className="p-3"><MousePointerClick className="inline h-4 w-4" /></th>
              <th className="p-3">تاريخ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const open = c.recipients_count ? Math.round((c.opened_count / c.recipients_count) * 100) : 0;
              const click = c.recipients_count ? Math.round((c.clicked_count / c.recipients_count) * 100) : 0;
              return (
                <tr key={c.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => setActive(c)}>
                  <td className="p-3 font-medium">{c.subject || "(بدون عنوان)"}</td>
                  <td className="p-3"><Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge></td>
                  <td className="p-3">{c.recipients_count}</td>
                  <td className="p-3">{c.opened_count} <span className="text-xs text-muted-foreground">({open}%)</span></td>
                  <td className="p-3">{c.clicked_count} <span className="text-xs text-muted-foreground">({click}%)</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(c.sent_at || c.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); remove(c.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">لا توجد حملات بعد. ابدأ بإنشاء حملة جديدة.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminNewsletterCampaigns;