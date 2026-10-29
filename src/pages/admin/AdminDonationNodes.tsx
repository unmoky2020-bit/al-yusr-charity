import { useEffect, useState } from "react";
import { donationNodesApi, type DonationNode } from "@/data/api/donationNodesApi";
import { apiErrorMessage, isEndpointMissing, FEATURE_PENDING_MSG } from "@/data/api/adminApiHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ChevronRight } from "lucide-react";

type Node = DonationNode;

export default function AdminDonationNodes() {
  const [path, setPath] = useState<Node[]>([]);
  const [items, setItems] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ slug: "", title_ar: "", title_en: "", amount: "", direct_checkout: false });

  const parent = path[path.length - 1] ?? null;

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await donationNodesApi.listChildren(parent?.id ?? null));
    } catch (e) {
      setItems([]);
      setLoadError(isEndpointMissing(e) ? FEATURE_PENDING_MSG : apiErrorMessage(e, "تعذر تحميل العناصر"));
    } finally {
      setLoading(false);
    }
  };
  const fail = (title: string, e: unknown) =>
    toast({ variant: "destructive", title, description: apiErrorMessage(e) });
  useEffect(() => { void reload(); }, [parent?.id]);

  const toggleActive = async (n: Node) => {
    try {
      await donationNodesApi.update(n.id, { active: !n.active });
      toast({ title: !n.active ? "تم التفعيل" : "تم التعطيل" });
    } catch (e) {
      fail("فشل تغيير الحالة", e);
    }
    reload();
  };
  const toggleDirect = async (n: Node) => {
    try {
      await donationNodesApi.update(n.id, { direct_checkout: !n.direct_checkout });
    } catch (e) {
      fail("فشل تغيير التبرع المباشر", e);
    }
    reload();
  };
  const remove = async (n: Node) => {
    if (!confirm("حذف العنصر وكل أبنائه؟")) return;
    try {
      await donationNodesApi.remove(n.id);
      toast({ title: "تم الحذف" });
    } catch (e) {
      fail("فشل الحذف", e);
    }
    reload();
  };
  const create = async () => {
    if (!draft.slug || !draft.title_ar) {
      toast({ title: "أدخل slug والاسم العربي" });
      return;
    }
    try {
      await donationNodesApi.create({
        parent_id: parent?.id ?? null,
        type: parent ? "option" : "program",
        slug: draft.slug,
        title_ar: draft.title_ar,
        title_en: draft.title_en,
        amount: draft.amount ? Number(draft.amount) : null,
        active: true,
        direct_checkout: draft.direct_checkout,
        sort_order: items.length,
      });
    } catch (e) {
      fail("فشل الإضافة", e);
      return;
    }
    setDraft({ slug: "", title_ar: "", title_en: "", amount: "", direct_checkout: false });
    setAdding(false);
    reload();
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black text-primary">إدارة برامج التبرع</h1>
      <p className="mt-1 text-sm text-muted-foreground">فعّل/عطّل البرامج والمشاريع والحملات والخيارات. الشجرة تُحرّك صفحة التبرع تلقائيًا.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
        <button onClick={() => setPath([])} className="rounded-full bg-muted px-3 py-1 hover:text-primary">الجذر</button>
        {path.map((p, i) => (
          <span key={String(p.id)} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3 rotate-180" />
            <button onClick={() => setPath((a) => a.slice(0, i + 1))} className="rounded-full bg-muted px-3 py-1 text-primary">{p.title_ar}</button>
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="divide-y divide-border">
            {loadError && <div className="py-6 text-center text-sm font-bold text-destructive">{loadError}</div>}
            {!loadError && items.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">لا توجد عناصر هنا</div>}
            {items.map((n) => (
              <div key={String(n.id)} className="flex flex-wrap items-center gap-3 py-3">
                <button onClick={() => setPath((a) => [...a, n])} className="text-start">
                  <div className="font-extrabold text-primary">{n.title_ar}</div>
                  <div className="text-[11px] text-muted-foreground">{n.slug} · {n.type}{n.amount ? ` · ${n.amount} EGP` : ""}</div>
                </button>
                <div className="ms-auto flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1"><Switch checked={n.active} onCheckedChange={() => toggleActive(n)} /> نشط</label>
                  <label className="flex items-center gap-1"><Switch checked={n.direct_checkout} onCheckedChange={() => toggleDirect(n)} /> تبرع مباشر</label>
                  <button onClick={() => remove(n)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-2">
            <Input placeholder="slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            <Input placeholder="الاسم بالعربية" value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} />
            <Input placeholder="Title (English)" value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
            <Input placeholder="السعر (اختياري)" type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
            <label className="col-span-full flex items-center gap-2 text-xs"><Switch checked={draft.direct_checkout} onCheckedChange={(v) => setDraft({ ...draft, direct_checkout: v })} /> تبرع مباشر (تخطّي الاختيارات)</label>
            <div className="col-span-full flex gap-2">
              <Button onClick={create}>إضافة</Button>
              <Button variant="outline" onClick={() => setAdding(false)}>إلغاء</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setAdding(true)} className="mt-4" variant="outline"><Plus className="h-4 w-4" /> إضافة عنصر</Button>
        )}
      </div>
    </div>
  );
}