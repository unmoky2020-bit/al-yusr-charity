export type DonationStatus = "completed" | "pending" | "failed";
export type CaseStatus = "active" | "pending" | "closed";

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  program: string;
  method: "paymob" | "vodafone" | "instapay" | "bank";
  status: DonationStatus;
  date: string;
}

export interface CaseRow {
  id: string;
  name: string;
  program: string;
  location: string;
  support: number;
  caseworker: string;
  date: string;
  status: CaseStatus;
  statusLabel: { ar: string; en: string };
  urgency: "high" | "medium" | "low";
}

export interface ProjectRow {
  id: string;
  name: { ar: string; en: string };
  program: string;
  region: string;
  target: number;
  raised: number;
  beneficiaries: number;
  status: "active" | "completed" | "planned";
  startDate: string;
}

export interface ContentItem {
  id: string;
  type: "program" | "article" | "faq";
  title: { ar: string; en: string };
  status: "published" | "draft";
  author: string;
  updatedAt: string;
}

export interface ReportItem {
  id: string;
  title: { ar: string; en: string };
  period: string;
  size: string;
  date: string;
}

const donors = [
  "أحمد محمد", "نورا حسن", "Sara Ali", "محمود سامي", "Layla Hassan",
  "كريم عبدالله", "هدى إبراهيم", "Mohamed Tarek", "فاطمة الزهراء", "Yasmin K.",
  "عمر صلاح", "مريم حسن",
];
const programs = ["odhya", "zakat", "water", "box", "education", "bride", "orphan", "health"];
const methods: Donation["method"][] = ["paymob", "vodafone", "instapay", "bank"];
const statuses: DonationStatus[] = ["completed", "completed", "completed", "pending", "failed"];

export const MOCK_DONATIONS: Donation[] = Array.from({ length: 48 }, (_, i) => ({
  id: `ALY-${(2000 + i).toString()}`,
  donor: donors[i % donors.length],
  amount: [100, 250, 500, 1000, 1400, 350, 750, 2000][i % 8],
  program: programs[i % programs.length],
  method: methods[i % methods.length],
  status: statuses[i % statuses.length],
  date: `2025-${String((i % 10) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
}));

export const MOCK_CASES: CaseRow[] = [
  { id: "C-1024", name: "أسرة فاطمة محمد", program: "box", location: "المنصورة، الدقهلية", support: 850, caseworker: "منال حمدي", date: "2025-08-12", status: "active", statusLabel: { ar: "نشطة", en: "Active" }, urgency: "high" },
  { id: "C-1025", name: "محمد يتيم - 8 سنوات", program: "orphan", location: "ميت غمر، الدقهلية", support: 500, caseworker: "أحمد سعيد", date: "2025-07-22", status: "active", statusLabel: { ar: "نشطة", en: "Active" }, urgency: "high" },
  { id: "C-1026", name: "أم أحمد - أرملة", program: "box", location: "المنصورة", support: 600, caseworker: "منال حمدي", date: "2025-06-03", status: "closed", statusLabel: { ar: "مغلقة", en: "Closed" }, urgency: "medium" },
  { id: "C-1027", name: "قرية كفر سعد - مياه", program: "water", location: "الدقهلية", support: 12000, caseworker: "كريم محمود", date: "2025-09-01", status: "active", statusLabel: { ar: "نشطة", en: "Active" }, urgency: "high" },
  { id: "C-1028", name: "عروسة من ميت غمر", program: "bride", location: "ميت غمر", support: 5000, caseworker: "هدى علي", date: "2025-05-18", status: "pending", statusLabel: { ar: "قيد المراجعة", en: "Pending" }, urgency: "medium" },
  { id: "C-1029", name: "أسرة محمد علي - 5 أفراد", program: "box", location: "بلقاس، الدقهلية", support: 950, caseworker: "منال حمدي", date: "2025-09-10", status: "active", statusLabel: { ar: "نشطة", en: "Active" }, urgency: "high" },
  { id: "C-1030", name: "مريض كلى - علاج شهري", program: "health", location: "المنصورة", support: 2500, caseworker: "د. سامح", date: "2025-04-15", status: "active", statusLabel: { ar: "نشطة", en: "Active" }, urgency: "high" },
  { id: "C-1031", name: "طالبة جامعية - مصاريف", program: "education", location: "السنبلاوين", support: 1200, caseworker: "أحمد سعيد", date: "2025-09-05", status: "pending", statusLabel: { ar: "قيد المراجعة", en: "Pending" }, urgency: "medium" },
];

export const MOCK_PROJECTS: ProjectRow[] = [
  { id: "P-101", name: { ar: "وصلات مياه نظيفة - كفر سعد", en: "Clean water lines - Kafr Saad" }, program: "water", region: "الدقهلية", target: 50000, raised: 38000, beneficiaries: 240, status: "active", startDate: "2025-09-01" },
  { id: "P-102", name: { ar: "كرتونة رمضان 2025", en: "Ramadan Food Box 2025" }, program: "box", region: "المنصورة + الدقهلية", target: 120000, raised: 120000, beneficiaries: 800, status: "completed", startDate: "2025-02-01" },
  { id: "P-103", name: { ar: "صكوك الأضحية 2025", en: "Qurbani Vouchers 2025" }, program: "odhya", region: "كل مصر", target: 280000, raised: 195000, beneficiaries: 1400, status: "active", startDate: "2025-05-15" },
  { id: "P-104", name: { ar: "كفالة 50 يتيم", en: "Sponsor 50 Orphans" }, program: "orphan", region: "الدقهلية", target: 90000, raised: 62000, beneficiaries: 50, status: "active", startDate: "2025-01-10" },
  { id: "P-105", name: { ar: "علاج مرضى السرطان", en: "Cancer Patients Treatment" }, program: "health", region: "المنصورة", target: 75000, raised: 41000, beneficiaries: 28, status: "active", startDate: "2025-06-20" },
  { id: "P-106", name: { ar: "مصاريف مدرسية للأيتام", en: "School fees for orphans" }, program: "education", region: "الدقهلية", target: 35000, raised: 12000, beneficiaries: 80, status: "planned", startDate: "2025-10-01" },
];

export const MOCK_CONTENT: ContentItem[] = [
  { id: "ART-001", type: "article", title: { ar: "كيف تختار صك أضحية مناسب", en: "How to choose the right Qurbani voucher" }, status: "published", author: "فريق اليسر", updatedAt: "2025-09-12" },
  { id: "ART-002", type: "article", title: { ar: "أهمية كفالة اليتيم في الإسلام", en: "The importance of orphan sponsorship in Islam" }, status: "published", author: "د. أحمد", updatedAt: "2025-08-30" },
  { id: "ART-003", type: "article", title: { ar: "تأثير المياه النظيفة على القرى", en: "The impact of clean water on villages" }, status: "draft", author: "فريق اليسر", updatedAt: "2025-09-25" },
  { id: "PRG-001", type: "program", title: { ar: "كرتونة العزومة", en: "Family Food Box" }, status: "published", author: "—", updatedAt: "2025-07-01" },
  { id: "FAQ-001", type: "faq", title: { ar: "كيف يمكنني تتبع تبرعي؟", en: "How can I track my donation?" }, status: "published", author: "—", updatedAt: "2025-06-15" },
  { id: "FAQ-002", type: "faq", title: { ar: "هل التبرعات معفاة من الضرائب؟", en: "Are donations tax exempt?" }, status: "published", author: "—", updatedAt: "2025-06-15" },
];

export const MOCK_REPORTS: ReportItem[] = [
  { id: "R-2024", title: { ar: "التقرير السنوي 2024", en: "Annual Report 2024" }, period: "2024", size: "3.2 MB", date: "2025-02-01" },
  { id: "R-Q1-25", title: { ar: "تقرير الربع الأول 2025", en: "Q1 2025 Report" }, period: "Q1 2025", size: "1.4 MB", date: "2025-04-10" },
  { id: "R-Q2-25", title: { ar: "تقرير الربع الثاني 2025", en: "Q2 2025 Report" }, period: "Q2 2025", size: "1.6 MB", date: "2025-07-15" },
  { id: "R-RAM-25", title: { ar: "تقرير حملة رمضان 2025", en: "Ramadan 2025 Campaign Report" }, period: "Ramadan 2025", size: "2.1 MB", date: "2025-04-30" },
  { id: "R-ODH-25", title: { ar: "تقرير صكوك الأضحية 2025", en: "Qurbani Vouchers 2025 Report" }, period: "Eid Al-Adha 2025", size: "1.8 MB", date: "2025-06-25" },
];

export const MONTHLY_TREND = [
  { m: "يناير", mEn: "Jan", donations: 24500, donors: 120, cases: 12 },
  { m: "فبراير", mEn: "Feb", donations: 31200, donors: 145, cases: 18 },
  { m: "مارس", mEn: "Mar", donations: 42000, donors: 180, cases: 24 },
  { m: "أبريل", mEn: "Apr", donations: 38500, donors: 165, cases: 20 },
  { m: "مايو", mEn: "May", donations: 56700, donors: 220, cases: 32 },
  { m: "يونيو", mEn: "Jun", donations: 71200, donors: 285, cases: 41 },
  { m: "يوليو", mEn: "Jul", donations: 64500, donors: 260, cases: 38 },
  { m: "أغسطس", mEn: "Aug", donations: 58900, donors: 240, cases: 35 },
  { m: "سبتمبر", mEn: "Sep", donations: 82100, donors: 310, cases: 48 },
];

export const PROGRAM_DISTRIBUTION = [
  { name: { ar: "صكوك الأضحية", en: "Qurbani" }, value: 32, color: "hsl(152 65% 18%)" },
  { name: { ar: "كرتونة العزومة", en: "Food Box" }, value: 24, color: "hsl(75 85% 50%)" },
  { name: { ar: "كفالة الأيتام", en: "Orphans" }, value: 18, color: "hsl(22 88% 58%)" },
  { name: { ar: "المياه", en: "Water" }, value: 12, color: "hsl(200 70% 50%)" },
  { name: { ar: "العلاج", en: "Health" }, value: 9, color: "hsl(280 60% 55%)" },
  { name: { ar: "أخرى", en: "Other" }, value: 5, color: "hsl(150 20% 60%)" },
];

export const PAYMENT_METHODS = [
  { name: { ar: "Paymob (بطاقة)", en: "Paymob (Card)" }, value: 48 },
  { name: { ar: "فودافون كاش", en: "Vodafone Cash" }, value: 28 },
  { name: { ar: "InstaPay", en: "InstaPay" }, value: 18 },
  { name: { ar: "تحويل بنكي", en: "Bank transfer" }, value: 6 },
];