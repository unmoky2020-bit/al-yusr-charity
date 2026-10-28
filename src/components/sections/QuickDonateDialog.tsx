import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, Wallet, Heart, ShieldCheck, User as UserIcon, Phone, Mail, Beef, Home as HomeIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/i18n/LangContext";
import { formatNumberEN } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Method = "paymob" | "vodafone" | "instapay";

const METHODS: { id: Method; ar: string; en: string; icon: typeof CreditCard }[] = [
  { id: "paymob",   ar: "فيزا / ماستر",  en: "Visa / Master", icon: CreditCard },
  { id: "vodafone", ar: "فودافون كاش",   en: "Vodafone Cash", icon: Wallet },
  { id: "instapay", ar: "إنستاباي",       en: "InstaPay",      icon: Smartphone },
];

type ProgramTier = { id: string; ar: string; en: string; amount: number; tagAr?: string; tagEn?: string };
type ProgramGroup = { id: string; ar: string; en: string; icon: typeof CreditCard; tiers: ProgramTier[] };

const PROGRAMS: ProgramGroup[] = [
  {
    id: "odhya", ar: "صك الأضحية", en: "Qurbani share", icon: Beef,
    tiers: [
      { id: "qurbani-buffalo",   ar: "جاموسي — صك ٣٠ك صافي",     en: "Buffalo — 30kg net share",      amount: 14000 },
      { id: "qurbani-cow-30",    ar: "بقري — صك ٣٠ك صافي",        en: "Cow — 30kg net share",           amount: 16000, tagAr: "الأكثر طلبًا", tagEn: "Most chosen" },
      { id: "qurbani-cow-37",    ar: "بقري — صك ٣٥-٣٧ صافي",      en: "Cow — 35-37kg net share",        amount: 18000 },
      { id: "qurbani-sheep",     ar: "خروف — ٥٠-٦٠ك قائم",        en: "Sheep — 50-60kg live",           amount: 1500 },
      { id: "qurbani-share",     ar: "سُبع بقرة",                  en: "1/7 cow share",                  amount: 2300 },
      { id: "qurbani-quarter",   ar: "ربع عجل",                    en: "1/4 cow",                        amount: 4000, tagAr: "مرن", tagEn: "Flexible" },
      { id: "qurbani-half",      ar: "نصف عجل",                    en: "1/2 cow",                        amount: 8000 },
      { id: "qurbani-3quarter",  ar: "ثلاثة أرباع عجل",            en: "3/4 cow",                        amount: 12000 },
      { id: "qurbani-full",      ar: "عجل كامل",                   en: "Full cow",                       amount: 16000 },
      { id: "qurbani-any",       ar: "أيّ مبلغ مساهمة",            en: "Any contribution",               amount: 500 },
    ],
  },
  {
    id: "markoun", ar: "حملة مَرْكون", en: "Markoun campaign", icon: HomeIcon,
    tiers: [
      { id: "markoun-meds",      ar: "علاج شهري لمسنّ",           en: "Monthly meds — elder",           amount: 500 },
      { id: "markoun-mattress",  ar: "مرتبة + لحاف",                en: "Mattress + duvet",               amount: 1200, tagAr: "الأكثر طلبًا", tagEn: "Most requested" },
      { id: "markoun-allowance", ar: "مرتب صغير لأم معيلة",        en: "Small mother allowance",         amount: 800 },
      { id: "markoun-appliance", ar: "جهاز كهربائي بسيط",          en: "Basic appliance",                amount: 2500 },
      { id: "markoun-full",      ar: "تجهيز بيت كامل",              en: "Full home setup",                amount: 7500, tagAr: "كفالة كاملة", tagEn: "Full sponsorship" },
      { id: "markoun-any",       ar: "أيّ مبلغ مساهمة",            en: "Any contribution",               amount: 250 },
    ],
  },
  {
    id: "general", ar: "تبرع عام", en: "General donation", icon: Sparkles,
    tiers: [
      { id: "general-100",  ar: "١٠٠ جنيه",  en: "100 EGP",  amount: 100 },
      { id: "general-250",  ar: "٢٥٠ جنيه",  en: "250 EGP",  amount: 250 },
      { id: "general-500",  ar: "٥٠٠ جنيه",  en: "500 EGP",  amount: 500 },
      { id: "general-1000", ar: "١٠٠٠ جنيه", en: "1,000 EGP", amount: 1000 },
    ],
  },
];

const schema = z.object({
  name:   z.string().trim().min(2, "الاسم قصير").max(80),
  phone:  z.string().trim().regex(/^(\+?20)?0?1[0125]\d{8}$/, "رقم موبايل مصري غير صحيح"),
  email:  z.string().trim().email().max(120).optional().or(z.literal("")),
  amount: z.number().int().min(10, "أقل مبلغ 10 جنيه").max(1000000),
});

export const QuickDonateDialog = ({
  open,
  onOpenChange,
  defaultProgram = "general",
  defaultAmount = 500,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultProgram?: string;
  defaultAmount?: number;
}) => {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [program, setProgram] = useState<string>(
    PROGRAMS.find((p) => p.id === defaultProgram)?.id || "general",
  );
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [method, setMethod] = useState<Method>("paymob");
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from signed-in user
  useEffect(() => {
    if (!user) return;
    setName((v) => v || user.name || "");
    setEmail((v) => v || user.email || "");
    setPhone((v) => v || user.phone || "");
  }, [user]);

  useEffect(() => { setAmount(defaultAmount); }, [defaultAmount, open]);
  useEffect(() => {
    const next = PROGRAMS.find((p) => p.id === defaultProgram)?.id;
    if (next) setProgram(next);
  }, [defaultProgram, open]);

  const activeGroup = useMemo(
    () => PROGRAMS.find((p) => p.id === program) || PROGRAMS[2],
    [program],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, phone, email, amount });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      toast({ title: isAr ? "تحقّق من البيانات" : "Check your data", description: first, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const params = new URLSearchParams({
      program,
      amount:  String(amount),
      method,
      autostart: "1",
    });
    // Donor details travel in router state, not in the URL, so they never land in
    // browser history, server logs, referrers or analytics.
    navigate(`/donate?${params.toString()}`, {
      state: { donor: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || "" } },
    });
    onOpenChange(false);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-secondary/30 p-0">
        {/* Decorative pattern header — matches the hero/site pattern */}
        <div className="relative pattern-hero-luxe hero-pattern-fade px-6 pb-6 pt-7 text-primary-foreground">
          <div className="absolute inset-0 leaf-bg opacity-40" aria-hidden />
          <DialogHeader className="relative">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
              <Heart className="h-3.5 w-3.5" /> {isAr ? "تبرع سريع وآمن" : "Quick & secure donation"}
            </div>
            <DialogTitle className="mt-2 text-2xl font-black text-primary-foreground md:text-3xl">
              {isAr ? "أتمم تبرعك في 30 ثانية" : "Complete your donation in 30 seconds"}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {isAr ? "بياناتك آمنة، ووصل التبرع بيوصلك على الواتساب فورًا." : "Your info is safe — receipt sent to WhatsApp instantly."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto bg-card p-6">
          {/* Program / campaign */}
          <div>
            <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {isAr ? "البرنامج" : "Program"}
            </Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PROGRAMS.map((g) => {
                const Icon = g.icon;
                const active = program === g.id;
                return (
                  <button
                    type="button" key={g.id}
                    onClick={() => { setProgram(g.id); setAmount(g.tiers[0].amount); }}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition ${
                      active ? "border-secondary bg-secondary/15" : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-extrabold leading-tight">{g[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier presets — depend on program */}
          <div>
            <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {isAr ? "اختر الباقة" : "Pick a tier"}
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {activeGroup.tiers.map((t) => {
                const active = amount === t.amount;
                return (
                  <button
                    type="button" key={t.id} onClick={() => setAmount(t.amount)}
                    className={`relative flex items-center justify-between rounded-xl border-2 p-3 text-start transition ${
                      active ? "border-secondary bg-secondary/15" : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <span className="text-xs font-extrabold leading-tight text-primary">{t[lang === "ar" ? "ar" : "en"]}</span>
                    <span className="ms-2 shrink-0 rounded-md bg-orange-grad px-2 py-0.5 text-[11px] font-black text-accent-foreground shadow-cta">
                      {formatNumberEN(t.amount)} {isAr ? "ج" : "EGP"}
                    </span>
                    {(t.tagAr || t.tagEn) && (
                      <span className="absolute -top-2 end-2 rounded-full bg-secondary px-2 py-[2px] text-[9px] font-black text-secondary-foreground shadow">
                        {isAr ? t.tagAr : t.tagEn}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method */}
          <div>
            <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {isAr ? "طريقة الدفع" : "Payment method"}
            </Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    type="button" key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition ${
                      active ? "border-secondary bg-secondary/15" : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-extrabold leading-tight">{m[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {isAr ? "المبلغ بالجنيه" : "Amount (EGP)"}
            </Label>
            <Input
              type="number" min={10} value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mt-2 h-11 text-base font-bold"
              placeholder={isAr ? "أو اكتب مبلغ مخصص" : "Or enter custom amount"}
            />
          </div>

          {/* Donor info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="qd-name" className="text-xs font-bold text-muted-foreground">{isAr ? "الاسم" : "Name"}</Label>
              <div className="relative mt-1">
                <UserIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="qd-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                  className="h-11 ps-9" placeholder={isAr ? "اسمك بالكامل" : "Your full name"} />
              </div>
            </div>
            <div>
              <Label htmlFor="qd-phone" className="text-xs font-bold text-muted-foreground">{isAr ? "موبايل" : "Phone"}</Label>
              <div className="relative mt-1">
                <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="qd-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="h-11 ps-9" placeholder="01xxxxxxxxx" inputMode="tel" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="qd-email" className="text-xs font-bold text-muted-foreground">{isAr ? "بريد إلكتروني (اختياري)" : "Email (optional)"}</Label>
              <div className="relative mt-1">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="qd-email" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120}
                  className="h-11 ps-9" placeholder="you@example.com" />
              </div>
            </div>
          </div>

            <Button type="submit" disabled={submitting} size="lg"
            className="h-12 w-full bg-orange-grad text-base font-black text-accent-foreground shadow-cta hover:opacity-95">
            <Heart className="h-5 w-5" />
            {isAr ? `تبرع الآن بـ ${formatNumberEN(amount)} جنيه` : `Donate ${formatNumberEN(amount)} EGP now`}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> {isAr ? "دفع مشفّر SSL" : "SSL encrypted"}</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Kashier · VF Cash · InstaPay</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickDonateDialog;
