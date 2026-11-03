import { UiSelect } from "@/components/common/UiSelect";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { programs } from "@/data/programs";
import { toast } from "@/hooks/use-toast";

const RegisterDonor = () => {
  const { lang } = useLang();
  const { registerDonor } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", preferredProgram: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: lang === "ar" ? "كلمة المرور قصيرة" : "Password too short", variant: "destructive" });
      return;
    }
    const res = await registerDonor(form);
    if (!res.ok) {
      toast({ title: lang === "ar" ? "البريد مسجل بالفعل" : "Email already exists", variant: "destructive" });
      return;
    }
    toast({ title: lang === "ar" ? " أهلاً بك في عائلة اليسر" : " Welcome to the Al-Yusr family" });
    nav("/profile");
  };

  return (
    <PageLayout>
      <SEOHelmet noindex
        title={lang === "ar" ? "إنشاء حساب متبرع | مؤسسة اليسر" : "Donor account | Al-Yusr"}
        description={lang === "ar" ? "أنشئ حساب متبرع لتتبع تبرعاتك وأثرك في مؤسسة اليسر الخيرية." : "Create a donor account to track your donations and impact with Al-Yusr."}
        path="/register/donor"
      />
      <section className="bg-muted/30 py-10 md:py-16">
        <div className="container mx-auto max-w-md px-4">
          <Breadcrumbs items={[{ name: lang === "ar" ? "الرئيسية" : "Home", href: "/" }, { name: lang === "ar" ? "حساب متبرع" : "Donor account" }]} />
          <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-grad text-accent-foreground">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">
                {lang === "ar" ? "حساب متبرع جديد" : "New donor account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "ar" ? "تابع تبرعاتك وأثرك في مكان واحد" : "Track your donations and impact in one place"}
              </p>
            </div>
            <form method="post" onSubmit={submit} className="mt-6 space-y-3">
              <Input required placeholder={lang === "ar" ? "الاسم بالكامل" : "Full name"} className="h-12" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input required type="email" placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} className="h-12" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input required type="tel" placeholder={lang === "ar" ? "رقم الهاتف" : "Phone"} className="h-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input required type="password" placeholder={lang === "ar" ? "كلمة المرور (٦ أحرف+)" : "Password (6+ chars)"} className="h-12" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <UiSelect value={form.preferredProgram} onChange={(e) => setForm({ ...form, preferredProgram: e.target.value })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm font-bold">
                <option value="">{lang === "ar" ? "البرنامج المفضل (اختياري)" : "Preferred program (optional)"}</option>
                {programs.filter((p) => p.priceFrom > 0).map((p) => (
                  <option key={p.slug} value={p.slug}>{p[lang].name}</option>
                ))}
              </UiSelect>
              <Button type="submit" className="h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
                {lang === "ar" ? "أنشئ حسابي" : "Create my account"}
              </Button>
            </form>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              {lang === "ar" ? "لديك حساب؟" : "Have an account?"} <Link to="/login" className="font-extrabold text-accent">{lang === "ar" ? "ادخل من هنا" : "Sign in"}</Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default RegisterDonor;