/**
 * What the dashboard home says to each role: its name, one line on how the work goes, the actions
 * it uses most (shown only when the account may open that section), and a short hint per section.
 */
import {
  BookOpen, ClipboardCheck, FolderHeart, HandCoins, ListChecks, Megaphone, PackageCheck, PenLine, UserRoundCheck, type LucideIcon,
} from "lucide-react";

type L = { ar: string; en: string };
export type RoleKey = "admin" | "case_manager" | "editor" | "delegate" | "volunteer";
type RoleAction = { to: string; /** the menu section it belongs to */ section: string; label: L; icon: LucideIcon; primary?: boolean };

export const ROLE_HOME: Record<RoleKey, { label: L; note: L; actions: RoleAction[] }> = {
  admin: {
    label: { ar: "مدير", en: "Admin" },
    note: { ar: "التبرعات والحالات وأيام التوزيع في مكان واحد، والأرقام من السيرفر مباشرة.", en: "Donations, cases and distribution days in one place, straight from the server." },
    actions: [
      { to: "/admin/donations", section: "/admin/donations", label: { ar: "التبرعات", en: "Donations" }, icon: HandCoins, primary: true },
      { to: "/admin/distributions", section: "/admin/distributions", label: { ar: "أيام التوزيع", en: "Distribution days" }, icon: PackageCheck },
      { to: "/admin/review", section: "/admin/review", label: { ar: "مراجعة التعديلات", en: "Approvals" }, icon: ClipboardCheck },
    ],
  },
  case_manager: {
    label: { ar: "مسؤول حالات", en: "Case manager" },
    note: { ar: "تابع الحالات والتبرعات وأيام التوزيع من هنا. سجّل كل خطوة، عشان المتبرع يشوف تبرعه وصل لحد فين.", en: "Follow cases, donations and distribution days here. Record every step so donors see where their gift is." },
    actions: [
      { to: "/admin/cases", section: "/admin/cases", label: { ar: "الحالات", en: "Cases" }, icon: FolderHeart, primary: true },
      { to: "/admin/distributions", section: "/admin/distributions", label: { ar: "أيام التوزيع", en: "Distribution days" }, icon: PackageCheck },
      { to: "/admin/donations", section: "/admin/donations", label: { ar: "التبرعات", en: "Donations" }, icon: HandCoins },
    ],
  },
  editor: {
    label: { ar: "محرر محتوى", en: "Content editor" },
    note: {
      ar: "دي الأقسام اللي تقدر تشتغل فيها. أي حاجة بتضيفها أو بتعدّلها بتروح للإدارة تراجعها وتوافق عليها قبل ما تتنشر على الموقع.",
      en: "These are the sections you work in. What you add or change goes to the admins for approval before it is published.",
    },
    actions: [
      { to: "/admin/blog/new", section: "/admin/blog", label: { ar: "مقال جديد", en: "New article" }, icon: PenLine, primary: true },
      { to: "/admin/blog", section: "/admin/blog", label: { ar: "المقالات", en: "Articles" }, icon: BookOpen },
    ],
  },
  delegate: {
    label: { ar: "مندوب ميداني", en: "Field delegate" },
    note: { ar: "دي الحالات والمهام اللي معاك في الميدان. سجّل الزيارة والصور أول بأول، عشان الإدارة تتابع معاك.", en: "Your cases and field tasks. Record visits and photos as you go so the team can follow." },
    actions: [
      { to: "/admin/my-cases", section: "/admin/my-cases", label: { ar: "حالاتي", en: "My cases" }, icon: UserRoundCheck, primary: true },
      { to: "/admin/my-tasks", section: "/admin/my-tasks", label: { ar: "مهامي", en: "My tasks" }, icon: ListChecks },
    ],
  },
  volunteer: {
    label: { ar: "متطوع", en: "Volunteer" },
    note: { ar: "دي المهام والحملات اللي انت مشارك فيها. لو عندك سؤال، كلّم مسؤول الحملة.", en: "The tasks and campaigns you take part in. Questions? Ask the campaign lead." },
    actions: [
      { to: "/admin/my-tasks", section: "/admin/my-tasks", label: { ar: "مهامي", en: "My tasks" }, icon: ListChecks, primary: true },
      { to: "/admin/campaigns", section: "/admin/campaigns", label: { ar: "حملات التطوع", en: "Volunteer campaigns" }, icon: Megaphone },
    ],
  },
};

/** One line under each section on the home grid (sections without one show only their name). */
export const SECTION_HINTS: Record<string, L> = {
  "/admin/blog": { ar: "اكتب المقالات وعدّلها", en: "Write and edit articles" },
  "/admin/notifications": { ar: "كل اللي محتاج تعرفه أول بأول", en: "Everything you need to know" },
  "/admin/profile": { ar: "بياناتك وصورتك وكلمة المرور", en: "Your details, photo and password" },
  "/admin/media": { ar: "كل الصور المتخزنة وهي مستخدمة فين", en: "Every stored image and where it is used" },
  "/admin/my-tasks": { ar: "المهام المطلوبة منك", en: "Tasks assigned to you" },
  "/admin/my-cases": { ar: "الحالات اللي بتتابعها", en: "Cases you follow" },
  "/admin/campaigns": { ar: "حملات التطوع الميدانية", en: "Field volunteer campaigns" },
  "/admin/cases": { ar: "ملفات الحالات والتبرعات ليها", en: "Case files and their donations" },
  "/admin/donations": { ar: "كل التبرعات وحالتها", en: "Every donation and its status" },
  "/admin/distributions": { ar: "أيام التوزيع بالصور", en: "Distribution days with photos" },
  "/admin/content": { ar: "نصوص صفحات الموقع", en: "Website page texts" },
  "/admin/stories": { ar: "قصص الأثر على الموقع", en: "Impact stories on the site" },
  "/admin/review": { ar: "التعديلات اللي مستنية موافقة", en: "Changes waiting for approval" },
  "/admin/gallery": { ar: "الصور اللي بتظهر للزوار", en: "Photos shown to visitors" },
  "/admin/faqs": { ar: "أسئلة الزوار وإجاباتها", en: "Visitors' questions and answers" },
  "/admin/volunteers": { ar: "طلبات التطوع والفريق", en: "Volunteer applications and team" },
};

export const pickRoleHome = (roleKey: string) => ROLE_HOME[(roleKey in ROLE_HOME ? roleKey : "volunteer") as RoleKey];
