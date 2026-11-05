import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HandHeart, ArrowLeft, ArrowRight, Sparkles, User, Mail, Phone, MapPin, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";

const SKILLS_AR = ["ميدان", "توزيع", "تصوير", "محتوى", "تصميم", "ترجمة", "لوجستيات", "تعليم", "صحة"];
const SKILLS_EN = ["Field", "Distribution", "Photo", "Content", "Design", "Translation", "Logistics", "Education", "Health"];

const RegisterVolunteer = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const { registerVolunteer } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "", bio: "" });
  const [skills, setSkills] = useState<string[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: isAR ? "كلمة المرور قصيرة (٦ أحرف على الأقل)" : "Password too short (6+ chars)", variant: "destructive" });
      return;
    }
    const res = await registerVolunteer({ ...form, skills });
    if (!res.ok) {
      toast({ title: isAR ? "البريد مسجل بالفعل" : "Email already exists", variant: "destructive" });
      return;
    }
    toast({ title: isAR ? " تم استلام طلبك" : " Application received", description: isAR ? "سيراجع فريق اليسر طلبك خلال 48 ساعة." : "Our team will review within 48 hours.", });
    nav("/login");
  };

  const skillsList = isAR ? SKILLS_AR : SKILLS_EN;

  return (
    <PageLayout>
      <SEOHelmet noindex
        title={isAR ? "انضم لفريق المتطوعين | مؤسسة اليسر الخيرية" : "Join our volunteer team | Al-Yusr Charity"}
        description={isAR ? "انضم لفريق متطوعي مؤسسة اليسر في الدقهلية. ساعة من وقتك تُدخل الفرحة على بيت كامل." : "Join Al-Yusr volunteers in Dakahlia. One hour of yours brings joy to a whole home."}
        path="/register/volunteer"
      />
      <section className="bg-muted/30 pt-8 sm:pt-12 pb-36 sm:pb-44 md:pt-16 md:pb-52">
        <div className="container mx-auto max-w-2xl px-4">
          <Breadcrumbs
            items={[
              { name: isAR ? "الرئيسية" : "Home", href: "/" },
              { name: isAR ? "صفحة التطوع" : "Volunteer Page", href: "/volunteer" },
              { name: isAR ? "تسجيل متطوع" : "Volunteer Register" },
            ]}
          />

          {/* Banner link to full Volunteer Page */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-secondary/40 bg-secondary/10 p-4 sm:flex-row sm:items-center sm:justify-between shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
              <p className="text-xs sm:text-sm font-black text-primary">
                {isAR
                  ? "هل تودّ أن تتعرّف أولًا على مسارات التطوع وقصصه ووعوده؟"
                  : "Want to explore volunteer tracks & stories first?"}
              </p>
            </div>
            <Link
              to="/volunteer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-black text-secondary-foreground shadow-sm transition hover:opacity-90 hover:scale-105"
            >
              {isAR ? "صفحة التطوع الكاملة" : "Full Volunteer Page"}
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/20 text-primary">
                <HandHeart className="h-6 w-6" />
              </div>
              <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">
                {isAR ? "انضم لفريق المتطوعين" : "Join our volunteer team"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAR ? "املأ بياناتك، وسيتواصل معك فريق اليسر خلال 48 ساعة" : "Fill in your details and our team will reach out within 48h"}
              </p>
            </div>

            <form method="post" onSubmit={submit} className="mt-6 grid gap-3.5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="relative sm:col-span-2">
                <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  dir={isAR ? "rtl" : "ltr"}
                  placeholder={isAR ? "الاسم بالكامل" : "Full name"}
                  className="h-12 ps-10 text-start rounded-xl"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  placeholder={isAR ? "البريد الإلكتروني" : "Email"}
                  className="h-12 ps-10 text-start rounded-xl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Phone — Clean RTL start alignment */}
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  type="tel"
                  dir={isAR ? "rtl" : "ltr"}
                  placeholder={isAR ? "رقم الهاتف (01XXXXXXXXX)" : "Phone number"}
                  className="h-12 ps-10 text-start rounded-xl"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* City */}
              <div className="relative">
                <MapPin className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  dir={isAR ? "rtl" : "ltr"}
                  placeholder={isAR ? "المدينة / المركز (مثال: المنصورة)" : "City"}
                  className="h-12 ps-10 text-start rounded-xl"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  type="password"
                  dir={isAR ? "rtl" : "ltr"}
                  placeholder={isAR ? "كلمة مرور (٦ أحرف+)" : "Password (6+ chars)"}
                  className="h-12 ps-10 text-start rounded-xl"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {/* Bio */}
              <div className="relative sm:col-span-2">
                <textarea
                  dir={isAR ? "rtl" : "ltr"}
                  placeholder={isAR ? "نبذة قصيرة عنك ولماذا تريد التطوع مع اليسر..." : "Short bio and why you want to volunteer"}
                  className="min-h-[105px] w-full rounded-xl border border-input bg-background p-3 text-sm text-start"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              {/* Skills */}
              <div className="sm:col-span-2">
                <div className="mb-2 text-xs sm:text-sm font-extrabold text-primary">
                  {isAR ? "اختر المجالات والمهارات التي تناسبك:" : "Select your skills & interests:"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((s) => {
                    const active = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSkills(active ? skills.filter((x) => x !== s) : [...skills, s])}
                        className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                          active
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-secondary/30"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="h-12 bg-orange-grad text-base font-black text-accent-foreground shadow-cta hover:opacity-95 sm:col-span-2 rounded-xl"
              >
                {isAR ? "أرسل طلب التطوع" : "Submit application"}
              </Button>
            </form>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
              <Link to="/volunteer" className="font-extrabold text-primary hover:text-secondary inline-flex items-center gap-1">
                <Arrow className="h-3 w-3" />
                {isAR ? "العودة لصفحة التطوع الرئيسية" : "Back to Volunteer page"}
              </Link>
              <p>
                {isAR ? "لديك حساب بالفعل؟" : "Have an account?"}{" "}
                <Link to="/login" className="font-black text-accent hover:underline">
                  {isAR ? "ادخل من هنا" : "Sign in"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default RegisterVolunteer;