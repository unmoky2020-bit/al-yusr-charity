import { Printer, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import type { DonationRecord } from "@/data/donationsStore";

export const DonationReceipt = ({ d }: { d: DonationRecord }) => {
  const { lang } = useLang();
  const print = () => window.print();
  const download = () => {
    const lines = [
      `Al-Yusr Charity Foundation — Donation Receipt`,
      `============================================`,
      `Reference : ${d.ref}`,
      `Date      : ${new Date(d.createdAt).toLocaleString()}`,
      `Donor     : ${d.donor.name}`,
      `Email     : ${d.donor.email}`,
      `Phone     : ${d.donor.phone}`,
      `Amount    : ${d.amount} EGP`,
      `Program   : ${d.programLabel}`,
      `Method    : ${d.method}`,
      `Status    : ${d.status}`,
      ``,
      `Reg. NGO 2655/2019 — Ministry of Social Solidarity, Egypt`,
      `Mansoura, Dakahlia | +20 109 700 0137 | info@elyosrcharity.com`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${d.ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tr = lang === "ar" ? {
    title: "إيصال تبرع رسمي",
    sub: "مؤسسة اليسر الخيرية — مشهرة 2655/2019",
    ref: "رقم العملية",
    date: "التاريخ",
    donor: "المتبرع",
    email: "البريد",
    phone: "الهاتف",
    amount: "المبلغ",
    program: "البرنامج",
    method: "طريقة الدفع",
    status: "الحالة",
    note: "هذا الإيصال يُعتمد إلكترونيًا. سيتم التواصل معك خلال 24 ساعة لتأكيد العملية.",
    print: "طباعة",
    download: "تحميل نسخة",
    secure: "موثّق ومحمي",
  } : {
    title: "Official Donation Receipt",
    sub: "Al-Yusr Charity Foundation — Reg. 2655/2019",
    ref: "Reference", date: "Date", donor: "Donor", email: "Email", phone: "Phone",
    amount: "Amount", program: "Program", method: "Method", status: "Status",
    note: "This receipt is electronically valid. We will contact you within 24 hours to confirm.",
    print: "Print", download: "Download copy", secure: "Verified & secure",
  };

  return (
    <div className="receipt-print-area rounded-3xl border-2 border-secondary/40 bg-card p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-border pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr.sub}</div>
          <h2 className="mt-1 text-2xl font-black text-primary md:text-3xl">{tr.title}</h2>
        </div>
        <div className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary">
          <ShieldCheck className="me-1 inline h-3.5 w-3.5" /> {tr.secure}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Row k={tr.ref} v={d.ref} mono />
        <Row k={tr.date} v={new Date(d.createdAt).toLocaleString()} />
        <Row k={tr.donor} v={d.donor.name} />
        <Row k={tr.amount} v={`${d.amount.toLocaleString()} EGP`} />
        <Row k={tr.email} v={d.donor.email} />
        <Row k={tr.phone} v={d.donor.phone} />
        <Row k={tr.program} v={d.programLabel} />
        <Row k={tr.method} v={d.method.toUpperCase()} />
        <Row k={tr.status} v={d.status.toUpperCase()} highlight />
      </dl>

      <p className="mt-5 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">{tr.note}</p>

      <div className="no-print mt-5 flex flex-wrap gap-2">
        <Button onClick={print} variant="outline" size="sm" className="gap-1.5">
          <Printer className="h-4 w-4" /> {tr.print}
        </Button>
        <Button onClick={download} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> {tr.download}
        </Button>
      </div>
    </div>
  );
};

const Row = ({ k, v, mono, highlight }: { k: string; v: string; mono?: boolean; highlight?: boolean }) => (
  <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background/40 p-2.5">
    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
    <dd className={`font-extrabold ${mono ? "font-mono text-xs" : ""} ${highlight ? "text-secondary" : "text-foreground"}`}>{v}</dd>
  </div>
);
