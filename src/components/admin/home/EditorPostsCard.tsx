import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { useAllBlogRowsAdmin } from "@/data/useBlogPosts";
import type { DbStatus } from "@/data/blogApi";

const STATUS: Record<DbStatus, { ar: string; en: string; tone: string }> = {
  draft: { ar: "مسودة", en: "Draft", tone: "bg-slate-100 text-slate-700" },
  pending_review: { ar: "بانتظار المراجعة", en: "In review", tone: "bg-amber-100 text-amber-900" },
  scheduled: { ar: "مجدول", en: "Scheduled", tone: "bg-sky-100 text-sky-800" },
  published: { ar: "منشور", en: "Published", tone: "bg-emerald-100 text-emerald-800" },
  archived: { ar: "مؤرشف", en: "Archived", tone: "bg-muted text-muted-foreground" },
};
const ORDER: DbStatus[] = ["draft", "pending_review", "scheduled", "published"];

/** The editor's home: how many articles are where, and the last ones touched (to continue them). */
export function EditorPostsCard({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const { rows, loading } = useAllBlogRowsAdmin();
  const More = ar ? ChevronLeft : ChevronRight;
  const { counts, latest } = useMemo(() => {
    const own = rows.filter((r) => !r.id.startsWith("static-"));
    const counts = Object.fromEntries(ORDER.map((s) => [s, own.filter((r) => r.status === s).length])) as Record<DbStatus, number>;
    const latest = [...own].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, 4);
    return { counts, latest };
  }, [rows]);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-primary"><BookOpen className="h-4 w-4" />{ar ? "المقالات" : "Articles"}</h3>
        <Link to="/admin/blog" className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline">{ar ? "كل المقالات" : "All articles"}<More className="h-3.5 w-3.5" /></Link>
      </header>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        {ORDER.map((s) => (
          <div key={s} className="rounded-2xl bg-muted/40 px-3 py-2.5">
            <div className="text-[11px] font-bold text-muted-foreground">{STATUS[s][lang]}</div>
            <div className="text-xl font-black tabular-nums text-primary">{loading ? "…" : counts[s]}</div>
          </div>
        ))}
      </div>
      {latest.length > 0 && (
        <ul className="border-t border-border/60">
          {latest.map((r) => (
            <li key={r.id} className="border-b border-border/40 last:border-0">
              <Link to={`/admin/blog/${encodeURIComponent(r.slug)}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
                <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{(ar ? r.title_ar : r.title_en) || r.title_ar || r.slug}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-black ${STATUS[r.status]?.tone ?? STATUS.draft.tone}`}>{(STATUS[r.status] ?? STATUS.draft)[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
