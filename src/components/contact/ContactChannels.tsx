import type { ReactNode } from "react";
import { Building2, Check, ChevronLeft, ChevronRight, Clock, Copy, Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { ORG, isOfficeOpen, whatsappLink, useOrg } from "@/data/orgInfo";

function Row({ icon, label, children, action }: { icon: ReactNode; label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.07] text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold text-muted-foreground">{label}</div>
        <div className="text-sm font-extrabold leading-6 text-foreground">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}

const pill = "inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-background px-3 text-[11px] font-black text-primary transition hover:border-secondary/60 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

/**
 * «تواصل معنا» in one box: phone, WhatsApp, email, the office, its hours (open now or not) and the
 * official bank account — one row each, the action on the side.
 */
export function ContactChannels({ isRTL, copiedPhone, onCopyPhone, bank, copiedBank, onCopyBank }: {
  isRTL: boolean;
  copiedPhone: boolean;
  onCopyPhone: () => void;
  bank: { title: string; value: string } | null;
  copiedBank: boolean;
  onCopyBank: () => void;
}) {
  useOrg(); // re-render when the dashboard's organisation data arrives
  const open = isOfficeOpen();
  const Go = isRTL ? ChevronLeft : ChevronRight;
  return (
    <section aria-labelledby="contact-channels" className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-card">
      <header className="flex items-center gap-3 border-b border-border/60 bg-secondary/[0.06] px-4 py-4 sm:px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/20 text-primary ring-1 ring-secondary/30">
          <Phone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 id="contact-channels" className="text-base font-black text-foreground">{isRTL ? "قنوات التواصل والمقر" : "Ways to reach us"}</h3>
          <p className="text-xs leading-5 text-muted-foreground">{isRTL ? "كلّمنا بالطريقة اللي تريحك، أو زورنا في مواعيد العمل." : "Reach us the way you like, or visit during office hours."}</p>
        </div>
      </header>
      <ul className="divide-y divide-border/60">
        <Row
          icon={<Phone className="h-4 w-4" />}
          label={isRTL ? "اتصال هاتفي" : "Phone"}
          action={
            <button type="button" onClick={onCopyPhone} className={pill} aria-label={isRTL ? "نسخ الرقم" : "Copy number"}>
              {copiedPhone ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedPhone ? (isRTL ? "اتنسخ" : "Copied") : isRTL ? "نسخ" : "Copy"}
            </button>
          }
        >
          <a href={`tel:${ORG.phoneE164}`} dir="ltr" className="hover:text-primary hover:underline">+20 109 700 0137</a>
        </Row>
        <Row
          icon={<WhatsAppIcon className="h-4 w-4" />}
          label={isRTL ? "واتساب" : "WhatsApp"}
          action={
            <a href={whatsappLink(isRTL ? "السلام عليكم، عندي استفسار لمؤسسة اليسر." : "Hello, I have a question for Al-Yusr.")} target="_blank" rel="noopener" className={pill}>
              {isRTL ? "ابدأ محادثة" : "Chat"}<Go className="h-3.5 w-3.5" />
            </a>
          }
        >
          {isRTL ? "رسالة سريعة على نفس الرقم" : "A quick message on the same number"}
        </Row>
        <Row
          icon={<Mail className="h-4 w-4" />}
          label={isRTL ? "البريد الإلكتروني" : "Email"}
          action={<a href={`mailto:${ORG.email}`} className={pill} aria-label={isRTL ? "راسلنا بالبريد" : "Email us"}>{isRTL ? "راسلنا" : "Write"}<Go className="h-3.5 w-3.5" /></a>}
        >
          <a href={`mailto:${ORG.email}`} dir="ltr" className="break-all hover:text-primary hover:underline">{ORG.email}</a>
        </Row>
        <Row
          icon={<MapPin className="h-4 w-4" />}
          label={isRTL ? "المقر الرئيسي" : "Office"}
          action={<a href="#contact-map" className={pill}>{isRTL ? "الخريطة" : "Map"}<Go className="h-3.5 w-3.5" /></a>}
        >
          {isRTL ? ORG.addressAr : ORG.addressEn}
          <span className="block text-xs font-semibold text-muted-foreground">{isRTL ? ORG.landmarkAr : ORG.landmarkEn}</span>
        </Row>
        <Row
          icon={<Clock className="h-4 w-4" />}
          label={isRTL ? "مواعيد العمل" : "Office hours"}
          action={
            <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black ${open ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-muted-foreground/60"}`} />
              {open ? (isRTL ? "مفتوح دلوقتي" : "Open now") : isRTL ? "مقفول دلوقتي" : "Closed now"}
            </span>
          }
        >
          {isRTL ? ORG.hours.labelAr : ORG.hours.labelEn}
        </Row>
        {bank && (
          <Row
            icon={<Building2 className="h-4 w-4" />}
            label={`${isRTL ? "الحساب البنكي الرسمي" : "Official bank account"} ${bank.title}`}
            action={
              <button type="button" onClick={onCopyBank} className={pill} aria-label={isRTL ? "نسخ رقم الحساب" : "Copy account number"}>
                {copiedBank ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedBank ? (isRTL ? "اتنسخ" : "Copied") : isRTL ? "نسخ" : "Copy"}
              </button>
            }
          >
            <span dir="ltr" className="font-mono tracking-wider">{bank.value}</span>
          </Row>
        )}
      </ul>
    </section>
  );
}
