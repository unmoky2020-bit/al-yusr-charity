import { apiFetch } from "@/data/laravelApi";
import { exportStyledExcel, type ExcelColumn } from "@/lib/exportExcel";

/** One donor (customer) with contact details and giving totals — GET /reports/donors. */
export interface DonorReportRow {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  governorate: string | null;
  has_account: boolean;
  donations_count: number;
  paid_count: number;
  paid_total: number;
  pending_count: number;
  first_donation_at: string | null;
  last_donation_at: string | null;
  last_payment_method: string | null;
  last_target: string | null;
  donor_since: string | null;
}

export interface DonorsReportFilters {
  from?: string;
  to?: string;
  paidOnly?: boolean;
}

export async function fetchDonorsReport(f: DonorsReportFilters = {}): Promise<{ rows: DonorReportRow[]; paidTotal: number }> {
  const res = await apiFetch<{ data?: DonorReportRow[]; meta?: { paid_total?: number } }>("/reports/donors", {
    method: "GET",
    params: { from: f.from || undefined, to: f.to || undefined, paid_only: f.paidOnly ? 1 : undefined },
    useCache: false,
  });
  const rows = Array.isArray(res?.data) ? res.data : [];
  return { rows, paidTotal: Number(res?.meta?.paid_total ?? rows.reduce((s, r) => s + Number(r.paid_total || 0), 0)) };
}

const METHOD_AR: Record<string, string> = { visa: "بطاقة / أونلاين", bank: "تحويل / محفظة", cash: "مندوب (كاش)" };
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" }) : "");

/** Columns, rows and header lines of the customers sheet (shared by the donors page and the reports hub). */
export function buildDonorsSheet(rows: DonorReportRow[], paidTotal: number, rangeLabel = "كل الفترات") {
  const columns: ExcelColumn[] = [
    { header: "#", key: "n", width: 6, align: "center" },
    { header: "اسم المتبرع", key: "name", width: 26 },
    { header: "الموبايل", key: "phone", width: 16, align: "center" },
    { header: "البريد الإلكتروني", key: "email", width: 28 },
    { header: "المحافظة", key: "governorate", width: 14 },
    { header: "المدينة", key: "city", width: 16 },
    { header: "العنوان", key: "address", width: 30 },
    { header: "له حساب على الموقع", key: "account", width: 12, align: "center" },
    { header: "عدد التبرعات", key: "donations_count", width: 11, align: "center" },
    { header: "المدفوعة", key: "paid_count", width: 10, align: "center" },
    { header: "إجمالي المدفوع (ج.م)", key: "paid_total", width: 16, isAmount: true },
    { header: "بانتظار التأكيد", key: "pending_count", width: 12, align: "center" },
    { header: "أول تبرع", key: "first", width: 13, align: "center" },
    { header: "آخر تبرع", key: "last", width: 13, align: "center" },
    { header: "آخر طريقة دفع", key: "method", width: 16 },
    { header: "آخر جهة تبرّع لها", key: "target", width: 26 },
  ];
  const data = rows.map((r, i) => ({
    n: i + 1,
    name: r.name || "فاعل خير",
    phone: r.phone || "",
    email: r.email || "",
    governorate: r.governorate || "",
    city: r.city || "",
    address: r.address || "",
    account: r.has_account ? "نعم" : "لا",
    donations_count: r.donations_count,
    paid_count: r.paid_count,
    paid_total: Number(r.paid_total || 0),
    pending_count: r.pending_count,
    first: day(r.first_donation_at),
    last: day(r.last_donation_at),
    method: r.last_payment_method ? METHOD_AR[r.last_payment_method] ?? r.last_payment_method : "",
    target: r.last_target || "",
  }));
  const metaItems = [
    { label: "الفترة", value: rangeLabel },
    { label: "عدد المتبرعين", value: rows.length },
    { label: "إجمالي المدفوع", value: `${paidTotal.toLocaleString("ar-EG")} ج.م` },
    { label: "سري", value: "بيانات شخصية — للاستخدام الداخلي فقط" },
  ];
  const summary = { labelColumnKey: "name", label: "الإجمالي", sumKeys: ["donations_count", "paid_count", "paid_total", "pending_count"] };
  return { columns, data, metaItems, summary };
}

/** The customers sheet as a branded Excel file: one row per donor, contact data first. */
export async function exportDonorsSheet(f: DonorsReportFilters = {}): Promise<number> {
  const { rows, paidTotal } = await fetchDonorsReport(f);
  const range = f.from || f.to ? `${f.from || "البداية"} ← ${f.to || "النهارده"}` : "كل الفترات";
  const sheet = buildDonorsSheet(rows, paidTotal, range);
  await exportStyledExcel({
    fileName: `كشف-المتبرعين-${new Date().toISOString().slice(0, 10)}`,
    sheetName: "المتبرعين",
    reportTitle: "كشف المتبرعين وبيانات التواصل",
    categoryName: "بيانات العملاء",
    ...sheet,
  });
  return rows.length;
}
