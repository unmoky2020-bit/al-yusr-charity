import { useState } from "react";
import { Download, ShieldCheck, CheckCircle2, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import type { DonationRecord } from "@/data/donationsStore";
import { downloadReceiptPdf, tafqeetEGP } from "@/lib/generateReceiptPdf";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo-circle.png";

export const DonationReceipt = ({ d }: { d: DonationRecord }) => {
  const { lang } = useLang();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      await downloadReceiptPdf({
        ref: d.ref,
        amount: d.amount,
        donorName: d.donor?.name || "متبرع كريم",
        donorEmail: d.donor?.email || "",
        donorPhone: d.donor?.phone || "",
        programTitle: d.programLabel || (d as any).program || "صدقة جارية عامة",
        paymentMethod: d.method || "دفع إلكتروني",
        status: d.status || "completed",
        createdAt: d.createdAt,
        targetType: d.targetType,
        items: d.items,
        notes: d.notes || d.note,
      });
      toast({
        title: lang === "ar" ? "تم تحميل إيصال PDF الرسمي بنجاح" : "Official PDF Receipt downloaded",
        description: lang === "ar" ? "المستند معتمد إلكترونياً بهوية مؤسسة اليسر" : "Receipt is electronically certified",
      });
    } catch (err: any) {
      toast({
        title: lang === "ar" ? "خطأ في إنشاء ملف PDF" : "PDF generation failed",
        description: err?.message || "",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isAr = lang === "ar";
  const tr = isAr
    ? {
        title: "إيصال التبرع الإلكتروني المعتمد",
        subTitleEn: "Electronic Proof of Donation — Verified Document",
        foundationName: "مؤسسة اليسر الخيرية",
        foundationNameEn: "Al-Yusr Charity Foundation",
        regText: "مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي",
        officialBadge: "إيصال رسمي معتمد",
        receiptNo: "رقم الإيصال / Receipt No:",
        amountPaid: "المبلغ الإجمالي المتبرع به",
        amountPaidEn: "(Amount Paid)",
        currency: "جنيه مصري",
        statusLabel: "حالة العملية",
        completed: "معتمد ومكتمل",
        donorName: "اسم المتبرع الكريم",
        donorNameEn: "(Donor Name)",
        phone: "رقم هاتف المتبرع",
        phoneEn: "(Phone)",
        program: "البرنامج / المبادرة المستهدفة",
        programEn: "(Program)",
        method: "وسيلة الدفع المعتمدة",
        methodEn: "(Payment Method)",
        email: "البريد الإلكتروني",
        emailEn: "(Email)",
        issueDate: "تاريخ ووقت الإصدار",
        issueDateEn: "(Issue Date & Time)",
        legalTitle: "توثيق رسمي وقانوني",
        legalNote: "هذا الإيصال مُعتمد إلكترونياً من قبل مؤسسة اليسر الخيرية ولا يحتاج إلى توقيع خطي، ومسجل رسمياً بالسجلات المالية للمؤسسة بموجب ترخيص وزارة التضامن الاجتماعي رقم 2665 لسنة 2019.",
        footerMoto: "مؤسسة اليسر الخيرية — معاً نصل بصدقتك لمن يستحق",
        footerContact: "المقر الرئيسي: المنصورة، الدقهلية، جمهورية مصر العربية | هاتف: 01097000137 | https://elyusr.org",
        download: "تحميل إيصال PDF",
        downloading: "جارٍ إنشاء ملف PDF...",
      }
    : {
        title: "Certified Electronic Donation Receipt",
        subTitleEn: "Electronic Proof of Donation — Verified Document",
        foundationName: "Al-Yusr Charity Foundation",
        foundationNameEn: "مؤسسة اليسر الخيرية",
        regText: "Registered NGO #2665 (2019) — Ministry of Social Solidarity",
        officialBadge: "OFFICIAL RECEIPT",
        receiptNo: "Receipt No:",
        amountPaid: "Total Amount Paid",
        amountPaidEn: "(Amount Paid)",
        currency: "EGP",
        statusLabel: "Status",
        completed: "COMPLETED",
        donorName: "Donor Name",
        donorNameEn: "(Name)",
        phone: "Phone Number",
        phoneEn: "(Phone)",
        program: "Target Program / Initiative",
        programEn: "(Program)",
        method: "Payment Method",
        methodEn: "(Method)",
        email: "Email Address",
        emailEn: "(Email)",
        issueDate: "Issue Date & Time",
        issueDateEn: "(Date & Time)",
        legalTitle: "Official Legal Certification",
        legalNote: "This official electronic receipt is issued and verified by Al-Yusr Charity Foundation under license #2665/2019, and requires no manual signature.",
        footerMoto: "Al-Yusr Charity Foundation — Reaching Those in Need Together",
        footerContact: "HQ: Mansoura, Dakahlia, Egypt | Tel: +201097000137 | https://elyusr.org",
        download: "Download PDF Receipt",
        downloading: "Generating PDF...",
      };

  const isCompleted = d.status?.toLowerCase() === "completed" || d.status?.toLowerCase() === "paid";
  const amountWords = tafqeetEGP(d.amount);

  const dateObj = new Date(d.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const displayItems =
    d.items && d.items.length > 0
      ? d.items
      : [
          {
            title: d.programLabel || (d as any).program || (isAr ? "مساهمة في البرامج الخيرية العامة" : "General Charity Contribution"),
            category: d.targetType || (isAr ? "تبرع عام" : "General Donation"),
            quantity: 1,
            amount: d.amount,
          },
        ];

  return (
    <div className="receipt-print-area rounded-2xl border-2 border-emerald-600/90 bg-card p-2 md:p-3 shadow-md">
      {/* الإطار الداخلي الناعم */}
      <div className="rounded-xl border border-emerald-300/80 bg-background/95 p-5 md:p-7 dark:border-emerald-800 dark:bg-card">
        
        {/* Header الرسمي */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-border/80 pb-4 sm:pb-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-white p-1 shadow-sm dark:border-emerald-700 dark:bg-card">
              <img
                src={logoImg}
                alt="Al-Yusr Logo"
                className="h-full w-full rounded-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-100">
                {tr.foundationName}
              </h2>
              <div className="text-[10.5px] sm:text-[11px] font-semibold text-muted-foreground mt-0.5">
                {tr.regText}
              </div>
            </div>
          </div>

          <div className="flex items-center sm:items-end justify-between sm:justify-start sm:flex-col gap-1.5 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-500/25 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr.officialBadge}</span>
            </span>
            <div className="text-end sm:text-end">
              <div className="text-[10px] font-bold text-muted-foreground">{tr.receiptNo}</div>
              <div className="font-mono text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200">
                {d.ref}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="my-5 border-y border-border/60 py-2.5 text-center">
          <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-100 md:text-xl">
            {tr.title}
          </h3>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5" dir="ltr">
            {tr.subTitleEn}
          </p>
        </div>

        {/* بطاقة المبلغ الرئيسية الزمردية الفاخرة — في صف واحد متناسق دائماً */}
        <div
          className="rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)" }}
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* تفاصيل المبلغ على اليمين */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] sm:text-xs font-bold text-emerald-200 mb-0.5">
                <span>{tr.amountPaid}</span>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-sans text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  {d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-200">
                  {isAr ? "جنيه مصري" : "EGP"}
                </span>
              </div>
              <div className="mt-1 text-[10.5px] sm:text-xs font-bold text-emerald-100 leading-snug">
                {amountWords}
              </div>
            </div>

            {/* حالة العملية في الجهة اليسرى في نفس الصف تماماً */}
            <div className="shrink-0 rounded-xl border border-white/25 bg-white/12 px-3 sm:px-4 py-2.5 sm:py-3 text-center backdrop-blur-sm min-w-[120px] sm:min-w-[155px]">
              <div className="text-[10px] sm:text-[11px] font-bold text-emerald-200">{tr.statusLabel}</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-300 shrink-0" />
                <span>{isCompleted ? tr.completed : "قيد المراجعة"}</span>
              </div>
              <div className="text-[9px] sm:text-[9.5px] font-bold text-white/80 font-mono tracking-wider uppercase mt-0.5">
                {isCompleted ? "COMPLETED" : "PENDING"}
              </div>
            </div>
          </div>
        </div>

        {/* شبكة البطاقات الستة المنظمة 2x3 */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* 1. اسم المتبرع */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.donorName}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Donor Name</span>
            </div>
            <div className="mt-1 font-black text-foreground text-sm">
              {d.donor.name || (isAr ? "متبرع كريم" : "Kind Donor")}
            </div>
          </div>

          {/* 2. رقم الهاتف */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.phone}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Phone</span>
            </div>
            <div className="mt-1 font-black text-foreground text-sm" dir="ltr" style={{ textAlign: isAr ? "right" : "left" }}>
              {d.donor.phone || "—"}
            </div>
          </div>

          {/* 3. البرنامج / المبادرة */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.program}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Program</span>
            </div>
            <div className="mt-1 font-black text-emerald-700 dark:text-emerald-400 text-sm">
              {d.programLabel || (isAr ? "كفالة طالب علم" : "General Cause")}
            </div>
          </div>

          {/* 4. وسيلة الدفع */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.method}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Payment Method</span>
            </div>
            <div className="mt-1 font-black text-foreground uppercase text-sm">
              {d.method || "VISA"}
            </div>
          </div>

          {/* 5. البريد الإلكتروني */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.email}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Email</span>
            </div>
            <div className="mt-1 font-bold text-foreground text-xs" dir="ltr" style={{ textAlign: isAr ? "right" : "left" }}>
              {d.donor.email || "—"}
            </div>
          </div>

          {/* 6. تاريخ ووقت الإصدار */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>{tr.issueDate}</span>
              <span dir="ltr" className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Issue Date</span>
            </div>
            <div className="mt-1 font-bold text-foreground text-xs">
              {formattedDate} — {formattedTime}
            </div>
          </div>
        </div>

        {/* جدول بنود وتفاصيل التبرع التفصيلية */}
        <div className="mt-5 rounded-xl border border-border/80 overflow-hidden bg-card">
          <div className="bg-emerald-950/5 dark:bg-emerald-500/10 px-4 py-2.5 border-b border-border/70 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">
              {isAr ? "تفاصيل وبنود التبرع المعتمدة" : "Itemized Donation Breakdown"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              {isAr ? `${displayItems.length} بند` : `${displayItems.length} Item(s)`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 text-[10.5px] font-bold text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2 px-3 text-center w-10">#</th>
                  <th className="py-2 px-3">{isAr ? "البند / البرنامج المستهدف" : "Item / Target Program"}</th>
                  <th className="py-2 px-3 text-center">{isAr ? "التصنيف" : "Category"}</th>
                  <th className="py-2 px-3 text-center">{isAr ? "العدد" : "Qty"}</th>
                  <th className="py-2 px-3 text-left">{isAr ? "المبلغ" : "Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {displayItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-black text-foreground text-xs">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        {item.category || d.targetType || (isAr ? "مساهمة" : "Donation")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs font-bold">
                      {item.quantity || 1}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                      {Number(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {isAr ? "ج.م" : "EGP"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-950/5 dark:bg-emerald-500/10 border-t border-border font-black text-xs">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right text-emerald-950 dark:text-emerald-100">
                    {isAr ? "الإجمالي الكلي المعتمد:" : "Total Verified Donation:"}
                  </td>
                  <td className="py-2.5 px-3 text-left font-mono font-black text-sm text-emerald-800 dark:text-emerald-300">
                    {d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {isAr ? "ج.م" : "EGP"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ملاحظات المتبرع / التوجيهات إن وجدت */}
        {(d.notes || d.note) && (
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
            <span className="font-black text-emerald-900 dark:text-emerald-200 block mb-1">
              {isAr ? "ملاحظات وتوجيهات المتبرع:" : "Donor Notes & Instructions:"}
            </span>
            <p className="text-muted-foreground font-medium text-[11px] leading-relaxed" dir="auto">
              <bdi>{d.notes || d.note}</bdi>
            </p>
          </div>
        )}

        {/* قسم التوثيق الرسمي والختم المعتمد — الختم في الجهة المقابلة (اليسار في RTL) بدون التفاف مشوه في الهواتف */}
        <div className="mt-5 rounded-xl border border-emerald-300/70 bg-emerald-500/5 p-3.5 sm:p-4 dark:border-emerald-800/70">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* النص القانوني */}
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100">
                {tr.legalTitle}
              </div>
              <p className="text-[10.5px] sm:text-[11.5px] leading-relaxed text-muted-foreground font-medium mt-0.5">
                {tr.legalNote}
              </p>
            </div>

            {/* الختم الإلكتروني الرسمي المعتمد لمؤسسة اليسر — مثبت في اليسار (في RTL) وواضح وأنيق */}
            <div className="shrink-0 flex items-center justify-center ps-1 sm:ps-2">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-emerald-600 bg-white p-1 text-emerald-800 shadow-xs dark:bg-emerald-950 dark:text-emerald-300">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-emerald-500 text-center p-0.5">
                  <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase text-emerald-700 dark:text-emerald-400">مؤسسة اليسر</span>
                  <span className="text-[9px] sm:text-[11px] font-black leading-tight text-emerald-900 dark:text-emerald-200">مُعْتَمَدْ</span>
                  <span className="text-[6.5px] sm:text-[7.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400">2019 / 2665</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الفوتر */}
        <div className="mt-5 border-t border-border/80 pt-4 text-center text-xs text-muted-foreground">
          <div className="font-black text-emerald-900 dark:text-emerald-200 text-xs">
            {tr.footerMoto}
          </div>
          <div className="text-[10.5px] mt-0.5 flex flex-wrap items-center justify-center gap-1.5">
            <span>{isAr ? "المقر الرئيسي: المنصورة، الدقهلية، جمهورية مصر العربية" : "HQ: Mansoura, Dakahlia, Egypt"}</span>
            <span>|</span>
            <span>{isAr ? "هاتف: 01097000137" : "Tel: +201097000137"}</span>
            <span>|</span>
            <a
              href="https://elyusr.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
            >
              https://elyusr.org
            </a>
          </div>
          <div className="font-mono text-[9px] text-muted-foreground/70 mt-1" dir="ltr">
            Transaction ID: {d.ref} • Generated via Al-Yusr Financial Core System
          </div>
        </div>

        {/* أزرار العمليات: تحميل إيصال PDF فقط بدون طباعة متصفح */}
        <div className="no-print mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            size="sm"
            className="gap-2 h-10 px-6 font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-all active:scale-95 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Download className="h-4 w-4 text-white" />
            )}
            <span>{isGenerating ? tr.downloading : tr.download}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
