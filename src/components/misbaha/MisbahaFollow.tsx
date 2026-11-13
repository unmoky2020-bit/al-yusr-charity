import { useState } from "react";
import { BellRing, CheckCircle2, Loader2, Mail } from "lucide-react";
import { misbahaMailApi } from "@/data/api/mailApi";
import { useAuth } from "@/auth/AuthContext";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { track } from "@/lib/track";

/**
 * Under a shared misbaha: "send me an email when we reach the goal + a short Friday summary".
 * Double opt-in (a confirm email), except for a signed-in account with a verified email.
 */
export function MisbahaFollow({ slug, name, hasTarget, isAr }: { slug: string; name: string; hasTarget: boolean; isAr: boolean }) {
  const { user } = useAuth();
  const [email, setEmail] = useState((user as { email?: string } | null)?.email ?? "");
  const [goal, setGoal] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setState("error"); setMsg(isAr ? "اكتب بريد إلكتروني صحيح." : "Enter a valid email."); return; }
    if (!goal && !weekly) { setState("error"); setMsg(isAr ? "اختار حاجة واحدة على الأقل." : "Pick at least one."); return; }
    setState("busy");
    try {
      const r = await misbahaMailApi.subscribe(slug, { email: email.trim(), goal: hasTarget ? goal : false, weekly });
      setState("done");
      setMsg(r.message);
      track("misbaha_follow", { payload: { room: slug, confirmed: r.confirmed }, fbCustom: false });
    } catch (err) {
      setState("error");
      setMsg(apiErrorMessage(err, isAr ? "تعذر الاشتراك، حاول تاني." : "Couldn't subscribe."));
    }
  };

  return (
    <section className="container mx-auto max-w-3xl px-4 py-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/10 p-5 shadow-soft sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><BellRing className="h-5 w-5" /></span>
          <div>
            <p role="heading" aria-level={2} className="text-base font-black leading-7 text-primary sm:text-xl">{isAr ? "تابع السبحة على الإيميل" : "Follow this misbaha by email"}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isAr ? `هنبعتلك ${hasTarget ? "لما «" + name + "» توصل للهدف، و" : ""}ملخص صغير كل جمعة بالعدد ودعاء. من غير إزعاج، وتقدر تلغي في أي وقت.` : "We'll email you when it reaches its goal and a short Friday summary. Unsubscribe anytime."}
            </p>
          </div>
        </div>

        {state === "done" ? (
          <div className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> {msg}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{isAr ? "البريد الإلكتروني" : "Email"}</span>
                <Mail className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
                <input type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
                  placeholder="name@example.com" className="h-12 w-full rounded-2xl border border-border bg-background px-10 text-base outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" />
              </label>
              <button type="submit" disabled={state === "busy"} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-grad px-6 text-sm font-black text-accent-foreground shadow-cta disabled:opacity-70">
                {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />} {isAr ? "تابع" : "Follow"}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {hasTarget && (
                <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={goal} onChange={(e) => setGoal(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> {isAr ? "لما نوصل للهدف" : "When the goal is reached"}</label>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> {isAr ? "ملخص كل جمعة" : "Friday summary"}</label>
            </div>
            {state === "error" && <p className="text-sm font-bold text-destructive" role="alert">{msg}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
