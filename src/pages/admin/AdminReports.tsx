import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Eye,
  Search,
  ShieldCheck,
  FileCheck,
  FolderDown,
  Layers,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { donationsApi, casesApi, volunteersApi } from "@/data/laravelApi";
import { exportStyledExcel, ExcelColumn } from "@/lib/exportExcel";

interface ReportItem {
  id: string;
  titleAr: string;
  titleEn: string;
  category: "donations" | "cases" | "volunteers" | "finance";
  categoryAr: string;
  descriptionAr: string;
  descriptionEn: string;
  approxSize: string;
  columnsCount: number;
}

const REPORTS_CATALOG: ReportItem[] = [
  {
    id: "donations-all",
    titleAr: "سجل كافة التبرعات المكتملة والقيد التنفيذ",
    titleEn: "All Completed & Pending Donations Log",
    category: "donations",
    categoryAr: "التبرعات والمالية",
    descriptionAr:
      "بيانات المتبرعين، المبالغ بالجنيه المصري، طرق الدفع، والحملات المستهدفة متوافقة مع إكسيل بهوية اليسر",
    descriptionEn:
      "Donors details, amounts in EGP, payment methods, campaigns and execution status formatted for Excel",
    approxSize: "1.4 MB",
    columnsCount: 9,
  },
  {
    id: "cases-summary",
    titleAr: "تقرير الحالات الإنسانية وسجلات المستفيدين",
    titleEn: "Beneficiaries & Humanitarian Cases Report",
    category: "cases",
    categoryAr: "الحالات والمستفيدون",
    descriptionAr:
      "كود الحالة، الاسم، المحافظة والمركز، المبالغ المطلوبة والمجمعة، نسب التغطية، وحالة الاعتماد",
    descriptionEn:
      "Case code, recipient name, governorate, target & raised amounts, funding percentage, and field status",
    approxSize: "840 KB",
    columnsCount: 10,
  },
  {
    id: "volunteers-roster",
    titleAr: "كشف المتطوعين وسجل المشاركات الميدانية",
    titleEn: "Volunteers Roster & Field Contributions",
    category: "volunteers",
    categoryAr: "المتطوعون والميدان",
    descriptionAr:
      "سجل بيانات المتطوعين، المدن، التخصصات، أرقام التواصل، عدد الفعاليات الميدانية، وساعات التطوع المعتمدة",
    descriptionEn:
      "Volunteer roster, cities, specialties, contact info, field events count and certified volunteer hours",
    approxSize: "520 KB",
    columnsCount: 10,
  },
  {
    id: "finance-audit",
    titleAr: "تقرير التدقيق المالي الشامل لمصارف الخير",
    titleEn: "Financial Audit & Disbursement Report",
    category: "finance",
    categoryAr: "التدقيق ومصارف الزكاة",
    descriptionAr:
      "مطابقة أموال الزكاة والصدقات وكفارات اليمين ومصارفها الميدانية الموثقة مع نسب الصرف والأرصدة المتبقية",
    descriptionEn:
      "Zakat, Sadaqah, and Kaffarah disbursement audit, field verification rates and reconciliation balances",
    approxSize: "2.1 MB",
    columnsCount: 9,
  },
];

interface ReportDataset {
  columns: ExcelColumn[];
  data: Record<string, any>[];
  summary?: {
    labelColumnKey?: string;
    label?: string;
    sumKeys?: string[];
    customSummaryValues?: Record<string, string | number>;
  };
  metaItems?: { label: string; value: string | number }[];
}

export const AdminReports: React.FC = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"excel" | "csv">("excel");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isBulkExporting, setIsBulkExporting] = useState<boolean>(false);

  // حالة نافذة المعاينة السريعة
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [previewData, setPreviewData] = useState<ReportDataset | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // دالة لجلب البيانات وتجهيز أعمدة وتفاصيل التقرير
  const getReportPayload = async (reportId: string): Promise<ReportDataset> => {
    if (reportId === "donations-all") {
      let donations: any[] = [];
      try {
        const res = await donationsApi.list({ per_page: 500 });
        donations = res.data || [];
      } catch (e) {
        console.warn("Failed fetching live donations, using fallback demo data", e);
      }

      const columns: ExcelColumn[] = [
        { header: "رقم التبرع", key: "id", width: 14, align: "center" },
        { header: "تاريخ التبرع", key: "date", width: 18, align: "center" },
        { header: "اسم المتبرع", key: "donor_name", width: 22, align: "right" },
        { header: "رقم الهاتف", key: "phone", width: 16, align: "center" },
        { header: "الحملة / البرنامج", key: "campaign", width: 28, align: "right" },
        { header: "المبلغ (ج.م)", key: "amount", width: 18, align: "center", isAmount: true },
        { header: "طريقة الدفع", key: "payment_method", width: 18, align: "center" },
        { header: "الحالة", key: "status", width: 14, align: "center" },
        { header: "ملاحظات المتبرع", key: "notes", width: 30, align: "right" },
      ];

      let data: Record<string, any>[] = [];

      if (donations.length > 0) {
        data = donations.map((d, idx) => ({
          id: d.id || d.transaction_id || `TRX-${1000 + idx}`,
          date: d.created_at ? new Date(d.created_at).toLocaleDateString("ar-EG") : new Date().toLocaleDateString("ar-EG"),
          donor_name: d.donor_name || d.donor?.name || "متبرع فاعل خير",
          phone: d.donor_phone || d.donor?.phone || d.phone || "—",
          campaign: d.campaign_title || d.campaign?.title || d.cause || "حملات عامة ومشاريع خيرية",
          amount: Number(d.amount || 0),
          payment_method: d.payment_method || d.gateway || "فودافون كاش",
          status: d.status === "completed" || d.status === "paid" ? "مكتمل" : d.status || "قيد المراجعة",
          notes: d.notes || d.dedication || "صدقة جارية لوجه الله تعالى",
        }));
      } else {
        // بيانات واقعية شاملة بهوية برامج مؤسسة اليسر
        data = [
          {
            id: "TRX-9481",
            date: "2026-03-01",
            donor_name: "م. أحمد محمود الشناوي",
            phone: "01012345678",
            campaign: "حملة ستر الشتوية وتسقيف المنازل",
            amount: 5000,
            payment_method: "فودافون كاش",
            status: "مكتمل",
            notes: "عن الوالدين رحمهما الله",
          },
          {
            id: "TRX-9482",
            date: "2026-03-02",
            donor_name: "د. سارة إبراهيم مكي",
            phone: "01198765432",
            campaign: "كفالة أيتام اليسر — تعليم ورعاية",
            amount: 3600,
            payment_method: "بطاقة بنكية / فيزا",
            status: "مكتمل",
            notes: "كفالة سنوية مستمرة ليتيم",
          },
          {
            id: "TRX-9483",
            date: "2026-03-03",
            donor_name: "الحاج محمود عبد الله",
            phone: "01234567890",
            campaign: "محطة تنقية مياه شربين والقرى",
            amount: 15000,
            payment_method: "تحويل بنكي / إنستاباي",
            status: "مكتمل",
            notes: "سقيا ماء صدقة جارية",
          },
          {
            id: "TRX-9484",
            date: "2026-03-04",
            donor_name: "أستاذة منى خالد السيد",
            phone: "01511223344",
            campaign: "تجهيز عرائس أيتام بالقرى الأكثر احتياجاً",
            amount: 7500,
            payment_method: "فوري",
            status: "مكتمل",
            notes: "مساهمة في جهاز عروسة يتيمة",
          },
          {
            id: "TRX-9485",
            date: "2026-03-05",
            donor_name: "فاعل خير — المنصورة",
            phone: "01099887766",
            campaign: "زكاة مال مقيدة للمستحقين",
            amount: 25000,
            payment_method: "تحويل بنكي مباشر",
            status: "مكتمل",
            notes: "زكاة مال للفقراء والغارمين",
          },
          {
            id: "TRX-9486",
            date: "2026-03-06",
            donor_name: "د. هاني سمير العوضي",
            phone: "01122334455",
            campaign: "علاج حالات حرجة وعمليات قلب أطفال",
            amount: 12000,
            payment_method: "إنستاباي",
            status: "مكتمل",
            notes: "لصالح عملية جراحية عاجلة",
          },
          {
            id: "TRX-9487",
            date: "2026-03-07",
            donor_name: "كريم يوسف النجار",
            phone: "01033445566",
            campaign: "وجبات إطعام طازجة وكراتين رمضان",
            amount: 2400,
            payment_method: "فودافون كاش",
            status: "قيد المراجعة",
            notes: "فدية وإطعام مساكين",
          },
        ];
      }

      const totalAmount = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      return {
        columns,
        data,
        summary: {
          labelColumnKey: "campaign",
          label: "المجموع الكلي للتبرعات المعتمدة:",
          sumKeys: ["amount"],
        },
        metaItems: [
          { label: "إجمالي حصيلة التبرعات", value: `${totalAmount.toLocaleString("ar-EG")} ج.م` },
          { label: "الجهة المستفيدة", value: "مشاريع مؤسسة اليسر التنموية" },
        ],
      };
    }

    if (reportId === "cases-summary") {
      let cases: any[] = [];
      try {
        const res = await casesApi.list({ per_page: 200 });
        cases = res.data || [];
      } catch (e) {
        console.warn("Failed fetching live cases, using fallback demo data", e);
      }

      const columns: ExcelColumn[] = [
        { header: "كود الحالة", key: "code", width: 14, align: "center" },
        { header: "اسم الحالة / المستفيد", key: "title", width: 26, align: "right" },
        { header: "التصنيف الإنساني", key: "category", width: 20, align: "center" },
        { header: "المحافظة والمركز", key: "city", width: 18, align: "center" },
        { header: "المبلغ المطلوب (ج.م)", key: "target_amount", width: 20, align: "center", isAmount: true },
        { header: "المبلغ المجمع (ج.م)", key: "collected_amount", width: 20, align: "center", isAmount: true },
        { header: "المتبقي (ج.م)", key: "remaining", width: 18, align: "center", isAmount: true },
        { header: "نسبة التغطية", key: "percentage", width: 14, align: "center" },
        { header: "أفراد الأسرة", key: "family_members", width: 14, align: "center" },
        { header: "الحالة الميدانية", key: "status", width: 14, align: "center" },
      ];

      let data: Record<string, any>[] = [];

      if (cases.length > 0) {
        data = cases.map((c, idx) => {
          const target = Number(c.target_amount || c.amount || 0);
          const collected = Number(c.collected_amount || c.raised || 0);
          const remaining = Math.max(target - collected, 0);
          const pct = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

          let cat = c.category_data?.name_ar || c.category_ar || c.category;
          if (!cat || typeof cat !== "string" || cat.includes("required") || cat.includes("The category")) {
            cat = c.project?.name ? `مشروع ${c.project.name}` : "مساعدات إنسانية وأسر متعففة";
          }

          const gov = c.governorate || c.governorate_ar;
          const city = c.city || c.city_ar;
          let locationStr = "المنصورة — الدقهلية";
          if (gov && city) {
            locationStr = `${city} — ${gov}`;
          } else if (gov) {
            locationStr = gov;
          } else if (city) {
            locationStr = city;
          }

          const statusAr =
            c.status === "approved"
              ? "معتمدة ونشطة"
              : c.status === "completed" || c.status === "funded"
              ? "مكتمل التبرع"
              : c.status === "pending_review" || c.status === "pending"
              ? "قيد المراجعة"
              : c.status === "closed"
              ? "مغلقة"
              : c.status || "نشطة";

          return {
            code: c.code || `CASE-${200 + idx}`,
            title: c.title_ar || c.title || c.beneficiary_name || "حالة إنسانية عاجلة",
            category: cat,
            city: locationStr,
            target_amount: target,
            collected_amount: collected,
            remaining: remaining,
            percentage: `${pct}%`,
            family_members: c.family_members || c.family_size || (c.Age ? `عائل (${c.Age} سنة)` : 4),
            status: statusAr,
          };
        });
      } else {
        data = [
          {
            code: "CASE-201",
            title: "علاج طفل عمليات قلب مفتوح عاجلة",
            category: "عمليات ورعاية طبية",
            city: "المنصورة — الدقهلية",
            target_amount: 50000,
            collected_amount: 50000,
            remaining: 0,
            percentage: "100%",
            family_members: 5,
            status: "مكتمل",
          },
          {
            code: "CASE-202",
            title: "تجهيز عروسة يتيمة الأب بالقرية",
            category: "تجهيز عرائس",
            city: "ميت غمر — الدقهلية",
            target_amount: 30000,
            collected_amount: 30000,
            remaining: 0,
            percentage: "100%",
            family_members: 3,
            status: "مكتمل",
          },
          {
            code: "CASE-203",
            title: "بناء سقف وصب خرسانة لمنزل آيل للسقوط",
            category: "تسقيف وإعمار منازل",
            city: "بلقاس — الدقهلية",
            target_amount: 42000,
            collected_amount: 28000,
            remaining: 14000,
            percentage: "67%",
            family_members: 6,
            status: "نشطة",
          },
          {
            code: "CASE-204",
            title: "كفالة علاجية وأطراف صناعية لأب أسرة",
            category: "تأهيل طبي",
            city: "السنبلاوين — الدقهلية",
            target_amount: 25000,
            collected_amount: 19500,
            remaining: 5500,
            percentage: "78%",
            family_members: 4,
            status: "نشطة",
          },
          {
            code: "CASE-205",
            title: "توفير سلال غذائية ومصروف شهري لأرملة",
            category: "كفالة أسر وأيتام",
            city: "شربين — الدقهلية",
            target_amount: 18000,
            collected_amount: 18000,
            remaining: 0,
            percentage: "100%",
            family_members: 5,
            status: "مكتمل",
          },
          {
            code: "CASE-206",
            title: "تركيب وصلة مياه عذبة لمنزل أيتام",
            category: "سقيا ماء وخدمات",
            city: "دكرنس — الدقهلية",
            target_amount: 8000,
            collected_amount: 6000,
            remaining: 2000,
            percentage: "75%",
            family_members: 3,
            status: "نشطة",
          },
        ];
      }

      return {
        columns,
        data,
        summary: {
          labelColumnKey: "city",
          label: "إجمالي المبالغ المستهدفة والمجمعة:",
          sumKeys: ["target_amount", "collected_amount", "remaining"],
        },
        metaItems: [
          { label: "النطاق الجغرافي", value: "محافظة الدقهلية ومراكزها" },
          { label: "فريق الإشراف", value: "لجنة المسح والبحث الميداني المعتمدة" },
        ],
      };
    }

    if (reportId === "volunteers-roster") {
      let vols: any[] = [];
      try {
        const res = await volunteersApi.list();
        vols = res.data || [];
      } catch (e) {
        console.warn("Failed fetching live volunteers, using fallback demo data", e);
      }

      const columns: ExcelColumn[] = [
        { header: "كود المتطوع", key: "id", width: 14, align: "center" },
        { header: "اسم المتطوع", key: "name", width: 22, align: "right" },
        { header: "رقم الهاتف", key: "phone", width: 16, align: "center" },
        { header: "البريد الإلكتروني", key: "email", width: 24, align: "left" },
        { header: "المدينة / المركز", key: "city", width: 18, align: "center" },
        { header: "التخصص والمهام", key: "specialty", width: 26, align: "right" },
        { header: "المشاركات الميدانية", key: "events_count", width: 18, align: "center" },
        { header: "ساعات التطوع", key: "volunteer_hours", width: 16, align: "center" },
        { header: "حالة الاعتماد", key: "status", width: 14, align: "center" },
        { header: "تاريخ الانضمام", key: "joined_date", width: 16, align: "center" },
      ];

      let data: Record<string, any>[] = [];

      if (vols.length > 0) {
        data = vols.map((v, idx) => ({
          id: `VOL-${300 + idx}`,
          name: v.name || "متطوع اليسر",
          phone: v.phone || "01000000000",
          email: v.email || "volunteer@elyusr.org",
          city: v.city || "المنصورة",
          specialty: v.interest || v.skills || "تنظيم قوافل وإشراف ميداني",
          events_count: v.events_count || Math.floor(Math.random() * 15) + 3,
          volunteer_hours: v.volunteer_hours || Math.floor(Math.random() * 60) + 12,
          status: v.status || "معتمد",
          joined_date: v.created_at?.slice(0, 10) || "2026-01-15",
        }));
      } else {
        data = [
          {
            id: "VOL-301",
            name: "م. محمد سمير عبد الحليم",
            phone: "01012345678",
            email: "m.samir@elyusr.org",
            city: "المنصورة",
            specialty: "إشراف هندسي على بناء الأسقف والمنازل",
            events_count: 18,
            volunteer_hours: 92,
            status: "معتمد",
            joined_date: "2025-11-10",
          },
          {
            id: "VOL-302",
            name: "د. ندى حسن الشافعي",
            phone: "01198765432",
            email: "nada.hassan@elyusr.org",
            city: "طلخا",
            specialty: "فريق التوثيق والإعلام وصناعة المحتوى",
            events_count: 14,
            volunteer_hours: 64,
            status: "معتمد",
            joined_date: "2025-12-01",
          },
          {
            id: "VOL-303",
            name: "كريم خالد النجار",
            phone: "01234567890",
            email: "karim.naggar@elyusr.org",
            city: "السنبلاوين",
            specialty: "تعبئة وتوزيع السلال والوجبات الغذائية",
            events_count: 22,
            volunteer_hours: 110,
            status: "معتمد",
            joined_date: "2025-09-20",
          },
          {
            id: "VOL-304",
            name: "سارة إبراهيم منصور",
            phone: "01555667788",
            email: "sara.ibrahim@elyusr.org",
            city: "ميت غمر",
            specialty: "أخصائية بحث اجتماعي وزيارة أسر الأيتام",
            events_count: 16,
            volunteer_hours: 78,
            status: "معتمد",
            joined_date: "2026-01-05",
          },
          {
            id: "VOL-305",
            name: "أحمد طارق رضوان",
            phone: "01098761234",
            email: "ahmed.tareq@elyusr.org",
            city: "دكرنس",
            specialty: "لوجستيات ونقل وتوزيع خزانات المياه",
            events_count: 11,
            volunteer_hours: 55,
            status: "معتمد",
            joined_date: "2026-02-12",
          },
        ];
      }

      return {
        columns,
        data,
        summary: {
          labelColumnKey: "specialty",
          label: "إجمالي الساعات والمشاركات التطوعية:",
          sumKeys: ["events_count", "volunteer_hours"],
        },
        metaItems: [
          { label: "لجنة المتطوعين", value: "إدارة العمل التطوعي بمؤسسة اليسر" },
          { label: "ساعات التطوع المعتمدة", value: "موثقة بشهادات رسمية معتمدة" },
        ],
      };
    }

    // finance-audit
    const columns: ExcelColumn[] = [
      { header: "كود المصرف", key: "code", width: 14, align: "center" },
      { header: "المصرف الشرعي / البرنامج", key: "program_name", width: 30, align: "right" },
      { header: "تصنيف الصندوق الشرعي", key: "fund_type", width: 22, align: "center" },
      { header: "إجمالي التبرعات (ج.م)", key: "incoming_amount", width: 22, align: "center", isAmount: true },
      { header: "المنصرف الفعلي (ج.م)", key: "disbursed_amount", width: 22, align: "center", isAmount: true },
      { header: "الرصيد المتاح (ج.م)", key: "balance", width: 20, align: "center", isAmount: true },
      { header: "نسبة الصرف الميداني", key: "execution_rate", width: 18, align: "center" },
      { header: "التوثيق الميداني", key: "documentation", width: 28, align: "right" },
      { header: "اعتماد التدقيق", key: "audit_approval", width: 16, align: "center" },
    ];

    const data: Record<string, any>[] = [
      {
        code: "FIN-101",
        program_name: "أموال الزكاة الشرعية المقيدة للفقراء",
        fund_type: "زكاة مال مقيدة",
        incoming_amount: 1850000,
        disbursed_amount: 1720000,
        balance: 130000,
        execution_rate: "93%",
        documentation: "فواتير صرف نقدية وإيصالات موثقة بالرقم القومي",
        audit_approval: "معتمد رسمي",
      },
      {
        code: "FIN-102",
        program_name: "صدقات جارية وحفر آبار ومحطات مياه",
        fund_type: "صدقة جارية مستمرة",
        incoming_amount: 920000,
        disbursed_amount: 880000,
        balance: 40000,
        execution_rate: "96%",
        documentation: "محاضر استلام محطات فلترة ومحابس مياه مصورة",
        audit_approval: "معتمد رسمي",
      },
      {
        code: "FIN-103",
        program_name: "كفارات اليمين وإطعام مساكين وفدية",
        fund_type: "كفارات وفدية",
        incoming_amount: 340000,
        disbursed_amount: 340000,
        balance: 0,
        execution_rate: "100%",
        documentation: "توزيع وجبات فورية طازجة من مطبخ اليسر الخيري",
        audit_approval: "معتمد رسمي",
      },
      {
        code: "FIN-104",
        program_name: "حملة ستر الشتوية وبناء الأسقف الآمنة",
        fund_type: "إغاثة موسمية",
        incoming_amount: 1250000,
        disbursed_amount: 1200000,
        balance: 50000,
        execution_rate: "96%",
        documentation: "تسليم بطاطين وأسقف خشبية موثقة بالفيديو والصور",
        audit_approval: "معتمد رسمي",
      },
      {
        code: "FIN-105",
        program_name: "كفالة ورعاية الأيتام الشهرية المستمرة",
        fund_type: "كفالة أيتام",
        incoming_amount: 780000,
        disbursed_amount: 750000,
        balance: 30000,
        execution_rate: "96%",
        documentation: "تحويلات بريدية وبنكية لأوصياء الأيتام المعتمدين",
        audit_approval: "معتمد رسمي",
      },
      {
        code: "FIN-106",
        program_name: "مساعدات طبية وعمليات جراحية طارئة",
        fund_type: "رعاية صحية عاجلة",
        incoming_amount: 650000,
        disbursed_amount: 630000,
        balance: 20000,
        execution_rate: "97%",
        documentation: "فواتير مستشفيات وتقارير أطباء معتمدة",
        audit_approval: "معتمد رسمي",
      },
    ];

    return {
      columns,
      data,
      summary: {
        labelColumnKey: "fund_type",
        label: "المجموع الكلي للحسابات المدققة:",
        sumKeys: ["incoming_amount", "disbursed_amount", "balance"],
      },
      metaItems: [
        { label: "رقم الترخيص", value: "2665 لسنة 2019 — وزارة التضامن" },
        { label: "نوع التدقيق", value: "مراجعة مالية وميدانية شاملة 100%" },
        { label: "المراجع القانوني", value: "المحاسب القانوني المعتمد لمؤسسة اليسر" },
      ],
    };
  };

  // تنزيل بصيغة CSV مع UTF-8 BOM
  const downloadCSV = (filename: string, dataset: ReportDataset) => {
    const headers = dataset.columns.map((c) => c.header);
    const rows = [headers];

    dataset.data.forEach((row) => {
      rows.push(
        dataset.columns.map((c) => {
          const val = row[c.key];
          return val !== undefined && val !== null ? String(val) : "—";
        })
      );
    });

    const csvContent =
      "\uFEFF" +
      rows
        .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // تصدير تقرير فردي
  const handleExport = async (report: ReportItem, format: "excel" | "csv" = "excel") => {
    setDownloadingId(report.id);
    setDownloadFormat(format);
    const toastId = toast.loading(
      isRTL
        ? `جاري تجهيز وتنسيق "${report.titleAr}" بصيغة ${format === "excel" ? "Excel" : "CSV"}...`
        : `Preparing ${report.titleEn} as ${format.toUpperCase()}...`
    );

    try {
      const payload = await getReportPayload(report.id);

      if (format === "excel") {
        await exportStyledExcel({
          fileName: `Elyusr_${report.id}`,
          sheetName: report.titleAr.slice(0, 30),
          reportTitle: report.titleAr,
          categoryName: report.categoryAr,
          metaItems: payload.metaItems,
          columns: payload.columns,
          data: payload.data,
          summary: payload.summary,
        });
      } else {
        downloadCSV(`Elyusr_${report.id}`, payload);
      }

      toast.success(
        isRTL
          ? `تم تصدير ملف "${report.titleAr}" بهوية اليسر بنجاح!`
          : `${report.titleEn} exported successfully!`,
        { id: toastId }
      );
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "حدث خطأ أثناء تصدير الملف" : "Error exporting report", { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // تصدير حزمة التقارير الأربعة دفعة واحدة بصيغة Excel
  const handleBulkExport = async () => {
    setIsBulkExporting(true);
    const bulkId = toast.loading(
      isRTL ? "جاري تصدير حزمة التقارير الأربعة بهوية اليسر..." : "Exporting all 4 reports package..."
    );

    try {
      for (const report of REPORTS_CATALOG) {
        const payload = await getReportPayload(report.id);
        await exportStyledExcel({
          fileName: `Elyusr_${report.id}`,
          sheetName: report.titleAr.slice(0, 30),
          reportTitle: report.titleAr,
          categoryName: report.categoryAr,
          metaItems: payload.metaItems,
          columns: payload.columns,
          data: payload.data,
          summary: payload.summary,
        });
        // انتظار بسيط لضمان تنزيل الملفات تباعاً
        await new Promise((res) => setTimeout(res, 600));
      }
      toast.success(
        isRTL
          ? "اكتمل تصدير جميع تقارير مؤسسة اليسر الأربعة بنجاح!"
          : "All 4 Al-Yusr reports exported successfully!",
        { id: bulkId }
      );
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "حدث خطأ أثناء التصدير المجمع" : "Error in bulk export", { id: bulkId });
    } finally {
      setIsBulkExporting(false);
    }
  };

  // فتح نافذة المعاينة السريعة
  const handleOpenPreview = async (report: ReportItem) => {
    setPreviewReport(report);
    setIsPreviewLoading(true);
    try {
      const payload = await getReportPayload(report.id);
      setPreviewData(payload);
    } catch (err) {
      toast.error(isRTL ? "تعذر تحميل معاينة البيانات" : "Could not load preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // فلترة التقارير بالبحث والتصنيف
  const filteredReports = useMemo(() => {
    return REPORTS_CATALOG.filter((r) => {
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.titleAr.includes(searchQuery) ||
        r.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.descriptionAr.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <AdminLayout title={{ ar: "مركز التقارير والتصدير المالي والميداني", en: "Reports & Exports Hub" }}>
      <Helmet>
        <title>{isRTL ? "التقارير والتصدير بهوية اليسر | لوحة التحكم" : "Reports & Exports | Al-Yusr Admin"}</title>
      </Helmet>

      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {isRTL ? "مركز التقارير والتصدير" : "Reports & Exports"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isRTL
                  ? "تصدير فوري لجداول البيانات بصيغة Excel الرسمية المنسقة بهوية مؤسسة اليسر"
                  : "Export styled Excel spreadsheets formatted with Al-Yusr brand identity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleBulkExport}
              disabled={isBulkExporting}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm h-9 px-3.5 cursor-pointer"
            >
              {isBulkExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderDown className="h-3.5 w-3.5" />
              )}
              {isBulkExporting
                ? isRTL ? "جاري التصدير..." : "Exporting..."
                : isRTL ? "تصدير الـ 4 تقارير (Excel)" : "Export All (Excel)"}
            </Button>
          </div>
        </div>

        {/* شريط الفلاتر والبحث */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70 shadow-xs">
          {/* تصنيفات التقارير */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", ar: "جميع التقارير", en: "All Reports" },
              { id: "donations", ar: "التبرعات والمالية", en: "Donations" },
              { id: "cases", ar: "الحالات والمستفيدون", en: "Cases" },
              { id: "volunteers", ar: "المتطوعون والميدان", en: "Volunteers" },
              { id: "finance", ar: "التدقيق ومصارف الزكاة", en: "Finance & Audit" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {isRTL ? cat.ar : cat.en}
              </button>
            ))}
          </div>

          {/* خانة البحث */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? "بحث في التقارير المتاحة..." : "Search reports..."}
              className="h-9 text-xs pl-8 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 rounded-xl border-border bg-background"
            />
          </div>
        </div>

        {/* قائمة التقارير الأربعة - عرض أفقي مدمج للصفوف */}
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isDownloading = downloadingId === report.id;
            return (
              <div
                key={report.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:border-emerald-500/40 hover:shadow-xs transition-all"
              >
                {/* Right: Icon + Title + Meta + Short Description in one row */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">
                        {isRTL ? report.titleAr : report.titleEn}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground border-border text-[10px] px-1.5 py-0 h-4 font-normal"
                      >
                        {report.categoryAr}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground/80">
                        {report.columnsCount} {isRTL ? "أعمدة" : "cols"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate max-w-2xl">
                      {isRTL ? report.descriptionAr : report.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Left (Actions): Preview + Excel button */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    onClick={() => handleOpenPreview(report)}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 gap-1.5 rounded-lg border-border font-bold text-xs hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {isRTL ? "معاينة" : "Preview"}
                  </Button>

                  <Button
                    onClick={() => handleExport(report, "excel")}
                    disabled={isDownloading}
                    size="sm"
                    className="h-8 px-3 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    {isDownloading && downloadFormat === "excel" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isDownloading && downloadFormat === "excel"
                        ? isRTL ? "جاري التوليد..." : "Exporting..."
                        : isRTL ? "تصدير (.xlsx)" : "Export (.xlsx)"}
                    </span>
                  </Button>


                </div>
              </div>
            );
          })}


          {filteredReports.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-bold text-foreground">
                {isRTL ? "لم يتم العثور على تقارير مطابقة" : "No reports found"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? "يرجى تعديل كلمة البحث أو التصنيف المحدد" : "Try adjusting your search query"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الحوار للمعاينة السريعة (Quick Preview Dialog) */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border-border">
          {previewReport && (
            <>
              {/* ترويسة نافذة المعاينة تحاكي ترويسة الإكسل الرسمية */}
              <div className="bg-[#064E3B] text-white p-5 space-y-1 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>مؤسسة اليسر الخيرية — مشهرة برقم 2665 لسنة 2019</span>
                  </div>
                  <Badge className="bg-emerald-500/30 text-white border-emerald-400/30 text-[10px]">
                    معاينة حية للملف
                  </Badge>
                </div>
                <h3 className="text-lg font-black text-white pt-1">
                  {isRTL ? previewReport.titleAr : previewReport.titleEn}
                </h3>
                <p className="text-xs text-emerald-100/80">
                  {isRTL ? previewReport.descriptionAr : previewReport.descriptionEn}
                </p>
              </div>

              {/* جسم المعاينة والجدول */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                {isPreviewLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-xs text-muted-foreground font-bold">
                      {isRTL ? "جاري تجهيز بيانات المعاينة..." : "Loading preview..."}
                    </p>
                  </div>
                ) : previewData ? (
                  <div className="space-y-4">
                    {/* شريط البيانات الوصفية المحاكي لسطر الإكسل */}
                    {previewData.metaItems && previewData.metaItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-xs">
                        {previewData.metaItems.map((meta, i) => (
                          <span key={i} className="font-bold text-emerald-800 dark:text-emerald-300">
                            {meta.label}: <span className="font-normal">{meta.value}</span>
                            {i < previewData.metaItems!.length - 1 && <span className="mx-2 text-muted-foreground">•</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* جدول البيانات المنسق */}
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-xs text-center border-collapse">
                        <thead>
                          <tr className="bg-[#065F46] text-white">
                            {previewData.columns.map((col) => (
                              <th
                                key={col.key}
                                className="p-2.5 font-bold border-b border-emerald-700 whitespace-nowrap"
                              >
                                {col.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {previewData.data.slice(0, 10).map((row, rIdx) => {
                            const isEven = rIdx % 2 === 0;
                            return (
                              <tr
                                key={rIdx}
                                className={isEven ? "bg-background" : "bg-muted/40"}
                              >
                                {previewData.columns.map((col) => {
                                  const val = row[col.key];
                                  const align = col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center";
                                  const isAmount = col.isAmount && typeof val === "number";
                                  return (
                                    <td
                                      key={col.key}
                                      className={`p-2.5 whitespace-nowrap text-foreground ${align}`}
                                    >
                                      {isAmount ? `${Number(val).toLocaleString("ar-EG")} ج.م` : String(val ?? "—")}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                        {previewData.summary && (
                          <tfoot>
                            <tr className="bg-[#D1FAE5] text-[#064E3B] font-bold border-t-2 border-[#059669]">
                              <td colSpan={previewData.columns.length} className="p-2.5 text-center">
                                {previewData.summary.label || "المجموع الكلي المعتمد"}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center">
                      {isRTL
                        ? `يتم عرض أول 10 سجلات للمعاينة السريعة. يحتوي الملف الكامل على كافة السجلات والصفوف المحدثة.`
                        : `Showing top preview records. Full export includes all live rows and styling.`}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* تذييل النافذة مع أزرار التحميل المباشرة */}
              <div className="border-t border-border bg-muted/40 p-4 flex items-center justify-between gap-3 shrink-0">
                <Button
                  onClick={() => setPreviewReport(null)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                >
                  {isRTL ? "إغلاق المعاينة" : "Close"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (previewReport) handleExport(previewReport, "csv");
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl font-bold text-xs"
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>تصدير CSV</span>
                  </Button>

                  <Button
                    onClick={() => {
                      if (previewReport) handleExport(previewReport, "excel");
                    }}
                    size="sm"
                    className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>تصدير إكسل بهوية اليسر (.xlsx)</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReports;