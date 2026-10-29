import { useState } from "react";
import { User as UserIcon, Mail, Phone, Lock, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";

const Inner = () => {
  const { lang } = useLang();
  const { user, updateProfile, changePassword } = useAuth();
  const [form, setForm] = useState({ name: user!.name, email: user!.email, phone: user!.phone || "" });
  const [pwd, setPwd] = useState({ old: "", neu: "", confirm: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // PUT /profile — AuthContext shows the destructive toast on failure.
      await updateProfile(user!.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      toast({ title: lang === "ar" ? " تم تحديث البيانات" : " Profile updated" });
    } catch {
      /* error already shown */
    } finally {
      setSavingProfile(false);
    }
  };
  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.neu !== pwd.confirm) { toast({ title: lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Mismatch", variant: "destructive" }); return; }
    const r = await changePassword(user!.id, pwd.old, pwd.neu);
    if (!r.ok) { toast({ title: r.error || "Error", variant: "destructive" }); return; }
    setPwd({ old: "", neu: "", confirm: "" });
    toast({ title: lang === "ar" ? " تم تغيير كلمة المرور" : " Password changed" });
  };

  return (
    <AdminLayout title={{ ar: "حسابي", en: "My Profile" }}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-soft md:p-6">
          <h2 className="text-base font-black text-primary">{lang === "ar" ? "البيانات الشخصية" : "Personal info"}</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-11 ps-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" className="h-11 ps-9" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="tel" className="h-11 ps-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <Button type="submit" disabled={savingProfile} className="h-11 w-full bg-orange-grad font-extrabold text-accent-foreground"><Save className="h-4 w-4" /> {lang === "ar" ? "حفظ" : "Save"}</Button>
          </form>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-soft md:p-6">
          <h2 className="text-base font-black text-primary">{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</h2>
          <form onSubmit={savePwd} className="mt-4 space-y-3">
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" required className="h-11 ps-9" placeholder={lang === "ar" ? "كلمة المرور الحالية" : "Current"} value={pwd.old} onChange={(e) => setPwd({ ...pwd, old: e.target.value })} />
            </div>
            <Input type="password" required className="h-11" placeholder={lang === "ar" ? "الجديدة" : "New"} value={pwd.neu} onChange={(e) => setPwd({ ...pwd, neu: e.target.value })} />
            <Input type="password" required className="h-11" placeholder={lang === "ar" ? "تأكيد" : "Confirm"} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
            <Button type="submit" className="h-11 w-full bg-primary font-extrabold text-primary-foreground">{lang === "ar" ? "تحديث" : "Update"}</Button>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-secondary/10 p-4">
        <h3 className="text-sm font-black text-primary">{lang === "ar" ? "صلاحياتك" : "Your roles"}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {user!.roles.map((r) => <span key={r} className="rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-extrabold">{r}</span>)}
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminProfile = () => (
  <RequireAuth roles={["admin", "editor"]}><Inner /></RequireAuth>
);

export default AdminProfile;