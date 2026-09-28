import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { Card } from "@/components/ui/card";
import { FileEdit, HeartHandshake, BarChart3, Search, ClipboardCheck, Layers, ArrowLeft } from "lucide-react";

const TILES = [
  { href: "/admin/content",   icon: FileEdit,         ar: "إدارة الصفحات والمحتوى", en: "Pages & Content",   desc: { ar: "تحرير صفحات الموقع والمحتوى التعريفي.", en: "Edit site pages and intro content." } },
  { href: "/admin/blog-seo",  icon: Search,           ar: "المقالات و SEO",          en: "Blog & SEO",        desc: { ar: "إدارة المقالات، الكلمات المفتاحية، الجدولة والنشر.", en: "Manage posts, keywords, scheduling and publishing." } },
  { href: "/admin/stories",   icon: HeartHandshake,   ar: "قصص النجاح",              en: "Success Stories",   desc: { ar: "إضافة وتعديل قصص المستفيدين والشهادات.", en: "Add or edit beneficiary stories and testimonials." } },
  { href: "/admin/site-stats",icon: BarChart3,        ar: "الأرقام والإنجازات",       en: "Stats & Achievements", desc: { ar: "تحديث أرقام الصفحة الرئيسية والإنجازات.", en: "Update homepage stats and achievements." } },
  { href: "/admin/programs",  icon: Layers,           ar: "البرامج والأقسام",        en: "Programs",          desc: { ar: "تنظيم برامج المؤسسة وعرضها للزائرين.", en: "Organize programs displayed on the site." } },
  { href: "/admin/review",    icon: ClipboardCheck,   ar: "مراجعة المحتوى",          en: "Content Review",    desc: { ar: "مراجعة المحتوى المرسل قبل النشر.", en: "Review submitted content before publishing." } },
];

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <AdminLayout title={{ ar: "محرر المحتوى", en: "Content Editor" }}>
      <div dir={isAr ? "rtl" : "ltr"}>
        <div className="mb-5">
          <h2 className="text-xl font-black text-primary">{isAr ? "مركز إدارة المحتوى" : "Content Hub"}</h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? "نقطة بداية واحدة لتحرير كل محتوى الموقع: الصفحات، المقالات، القصص والأرقام." : "One place to edit every piece of site content: pages, blog, stories, and stats."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} to={t.href}>
                <Card className="group flex h-full flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-elegant hover:ring-1 hover:ring-primary/30">
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowLeft className={`h-4 w-4 text-muted-foreground transition group-hover:text-primary ${isAr ? "" : "rotate-180"}`} />
                  </div>
                  <div className="text-base font-extrabold text-primary">{isAr ? t.ar : t.en}</div>
                  <div className="text-xs text-muted-foreground">{t.desc[lang]}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminContentEditor = () => <RequireAuth roles={["admin","editor"]}><Inner /></RequireAuth>;
export default AdminContentEditor;
