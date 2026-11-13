import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertCircle, BellOff, CheckCircle2, Loader2 } from "lucide-react";
import { misbahaMailApi } from "@/data/api/mailApi";
import { ApiError } from "@/data/laravelApi";
import { PageLayout } from "@/components/layout/PageLayout";
import { track } from "@/lib/track";

type Status = "loading" | "ok" | "error" | "unavailable";

/** Links from misbaha emails: /misbaha/confirm?token=… and /misbaha/unsubscribe?token=… */
export default function MisbahaMailAction({ action }: { action: "confirm" | "unsubscribe" }) {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("loading");
  const [room, setRoom] = useState<{ slug: string; name: string } | null>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    (async () => {
      try {
        const r = action === "confirm" ? await misbahaMailApi.confirm(token) : await misbahaMailApi.unsubscribe(token);
        setRoom(r);
        setStatus("ok");
        track(action === "confirm" ? "misbaha_follow_confirmed" : "misbaha_follow_unsubscribed", { payload: { room: r?.slug }, fbCustom: false });
      } catch (e) {
        const code = e instanceof ApiError ? e.status : 0;
        setStatus([400, 404, 410, 422].includes(code) ? "error" : "unavailable");
      }
    })();
  }, [token, action]);

  const title = action === "confirm" ? "تم تأكيد متابعة السبحة" : "اتلغت متابعة السبحة";
  return (
    <PageLayout>
      <Helmet><title>{`${title} | اليسر`}</title><meta name="robots" content="noindex" /></Helmet>
      <section className="container mx-auto max-w-2xl px-4 py-20" dir="rtl">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          {status === "loading" && <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}
          {status === "ok" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-secondary">
                {action === "confirm" ? <CheckCircle2 className="h-8 w-8" /> : <BellOff className="h-8 w-8" />}
              </div>
              <h1 className="mt-4 text-2xl font-black text-primary md:text-3xl">{title}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                {action === "confirm"
                  ? `هنبعتلك لما ${room?.name ? "«" + room.name + "»" : "السبحة"} توصل للهدف، وملخص صغير كل جمعة.`
                  : "مش هيوصلك إيميلات عن السبحة دي تاني. تقدر تتابعها من جديد من صفحتها في أي وقت."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {room?.slug && (
                  <Link to={`/misbaha/${room.slug}`} className="inline-flex h-11 items-center rounded-2xl bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta">سبّح دلوقتي</Link>
                )}
                <Link to="/misbaha" className="inline-flex h-11 items-center rounded-2xl border border-primary/15 bg-background px-5 text-sm font-extrabold text-primary">المسبحة</Link>
              </div>
            </>
          )}
          {(status === "error" || status === "unavailable") && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive"><AlertCircle className="h-8 w-8" /></div>
              <h1 className="mt-4 text-2xl font-black text-primary">{status === "error" ? "الرابط ده مش صحيح" : "حصلت مشكلة"}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{status === "error" ? "الرابط قديم أو ناقص. افتحه تاني من الإيميل." : "ما قدرناش نكمّل دلوقتي. افتح الرابط تاني بعد شوية."}</p>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
