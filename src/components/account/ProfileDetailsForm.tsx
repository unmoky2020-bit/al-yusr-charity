import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Briefcase, Mail, MapPin, Save, User as UserIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/common/PhoneInput";
import { EGYPT_GOVERNORATES } from "@/data/egyptGovernorates";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/lib/notify";

const BIO_MAX = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  /** Team accounts show their job title on their profile. */
  showJobTitle?: boolean;
};

/** Name, contact and place of the signed-in person (PUT /profile). */
export function ProfileDetailsForm({ showJobTitle = false }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, updateProfile } = useAuth();

  const initial = useMemo(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      governorate: user?.governorate ?? "",
      city: user?.city ?? "",
      bio: user?.bio ?? "",
      jobTitle: user?.jobTitle ?? "",
    }),
    [user?.name, user?.email, user?.phone, user?.governorate, user?.city, user?.bio, user?.jobTitle],
  );
  const [form, setForm] = useState(initial);
  const [phoneOk, setPhoneOk] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  if (!user) return null;
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = (Object.keys(form) as Array<keyof typeof form>).some((k) => form[k].trim() !== initial[k].trim());
  const emailChanged = form.email.trim().toLowerCase() !== initial.email.trim().toLowerCase();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) return void toast.error(ar ? "اكتب اسمك (حرفين على الأقل)" : "Enter your name");
    if (!EMAIL_RE.test(email)) return void toast.error(ar ? "البريد الإلكتروني مش مظبوط" : "Check the email address");
    if (form.phone && !phoneOk) return void toast.error(ar ? "رقم الموبايل مش مظبوط" : "Check the phone number");
    setSaving(true);
    try {
      await updateProfile(user.id, {
        name,
        email,
        phone: form.phone.trim(),
        governorate: form.governorate,
        city: form.city.trim(),
        bio: form.bio.trim(),
        ...(showJobTitle ? { jobTitle: form.jobTitle.trim() } : {}),
      });
      toast.success(ar ? "اتحفظت بياناتك" : "Profile saved", emailChanged ? { description: ar ? "أكّد بريدك الجديد بالكود اللي هيوصلك." : "Confirm the new address with the code we send." } : undefined);
    } catch {
      /* AuthContext already showed the server's reason */
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pf-name">{ar ? "الاسم بالكامل" : "Full name"}</Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="pf-name" className="h-12 ps-9" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="pf-email" type="email" dir="ltr" className="h-12 ps-9 text-start" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={190} required />
        </div>
        {emailChanged && (
          <p className="text-[11px] font-bold text-amber-700">{ar ? "بعد الحفظ هتحتاج تأكد البريد الجديد بكود." : "You'll confirm the new address with a code."}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-phone">{ar ? "رقم الموبايل / واتساب" : "Mobile / WhatsApp"}</Label>
        <PhoneInput id="pf-phone" value={form.phone} onChange={(v) => set("phone", v)} onValidityChange={setPhoneOk} className="h-12" />
      </div>

      <div className="space-y-1.5">
        <Label>{ar ? "المحافظة" : "Governorate"}</Label>
        <Select value={form.governorate || undefined} onValueChange={(v) => set("governorate", v)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder={ar ? "اختار المحافظة" : "Choose"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {EGYPT_GOVERNORATES.map((g) => (
              <SelectItem key={g.ar} value={g.ar}>{ar ? g.ar : g.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-city">{ar ? "المدينة / المركز" : "City / district"}</Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="pf-city" className="h-12 ps-9" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={120} placeholder={ar ? "مثلًا: المنصورة" : "e.g. Mansoura"} />
        </div>
      </div>

      {showJobTitle && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pf-job">{ar ? "المسمى الوظيفي" : "Job title"}</Label>
          <div className="relative">
            <Briefcase className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="pf-job" className="h-12 ps-9" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} maxLength={120} placeholder={ar ? "مثلًا: مسؤول المحتوى" : "e.g. Content lead"} />
          </div>
        </div>
      )}

      <div className="space-y-1.5 sm:col-span-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pf-bio">{ar ? "نبذة عنك" : "About you"}</Label>
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground" dir="ltr">{form.bio.length}/{BIO_MAX}</span>
        </div>
        <Textarea id="pf-bio" rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value.slice(0, BIO_MAX))} placeholder={ar ? "سطرين عنك (اختياري)" : "A line or two (optional)"} />
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={saving || !dirty} className="h-11 min-w-40 bg-orange-grad font-extrabold text-accent-foreground shadow-cta">
          <Save className="h-4 w-4" /> {saving ? (ar ? "بنحفظ…" : "Saving…") : ar ? "حفظ التغييرات" : "Save changes"}
        </Button>
        {dirty && !saving && (
          <button type="button" onClick={() => setForm(initial)} className="text-sm font-bold text-muted-foreground hover:text-primary">
            {ar ? "تراجع" : "Undo"}
          </button>
        )}
      </div>
    </form>
  );
}
