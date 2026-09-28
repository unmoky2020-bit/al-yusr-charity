import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { trackDonationStarted } from "@/lib/track";

const methods = [
  { id: "paymob_card", icon: CreditCard, label: "Visa / MasterCard" },
  { id: "vodafone_cash", icon: Wallet, label: "Vodafone Cash" },
  { id: "instapay", icon: Smartphone, label: "InstaPay" },
  { id: "bank_transfer", icon: Building2, label: "Bank Transfer" },
];

const presets = [100, 250, 500, 1000];

export const Donate = () => {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [active, setActive] = useState<number>(500);

  const buildHref = (amount?: number, method?: string) => {
    const params = new URLSearchParams();
    if (amount) params.set("amount", String(amount));
    if (method) params.set("method", method);
    params.set("utm_source", "home");
    params.set("utm_medium", "donate_teaser");
    return `/donate?${params.toString()}`;
  };

  const onPick = (amount: number, method?: string) => {
    setActive(amount);
    if (method) trackDonationStarted({ amount, method, source: "home-teaser" });
  };

  return (
    <section
      id="donate"
      className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade py-20 text-primary-foreground md:py-28"
    >
    
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
            {isAr ? "تبرع سريع " : "Quick donate "}
            </span>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">{t.donate.title}</h2>
            <p className="mt-3 text-primary-foreground/85">{t.donate.subtitle}</p>
          </div>

          <div className="mt-10 rounded-3xl border border-secondary/30 bg-card p-6 text-foreground shadow-card md:p-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {methods.map((methodItem) => {
                const Icon = methodItem.icon;
                return (
                  <Link
                    key={methodItem.id}
                    to={buildHref(active, methodItem.id)}
                    onClick={() => onPick(active, methodItem.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border p-4 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:border-secondary/60 hover:bg-secondary/5"
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{methodItem.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <div className="text-sm font-bold text-muted-foreground">{t.donate.amount}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {presets.map((preset) => (
                  <Link
                    key={preset}
                    to={buildHref(preset)}
                    onClick={() => onPick(preset)}
                    className={`rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${
                      active === preset
                        ? "border-secondary bg-secondary text-secondary-foreground shadow-cta"
                        : "border-border hover:border-secondary"
                    }`}
                  >
                    {preset} {isAr ? "جنيه" : "EGP"}
                  </Link>
                ))}
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-6 h-14 w-full bg-orange-grad text-base font-black text-accent-foreground shadow-cta hover:opacity-95"
            >
              <Link
                to={buildHref(active)}
                onClick={() => trackDonationStarted({ amount: active, method: "quick-teaser", source: "home" })}
              >
                <Heart className="h-5 w-5" /> {t.donate.cta}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-secondary" /> {t.donate.secure}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-secondary" /> {t.donate.paymentSecure}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
