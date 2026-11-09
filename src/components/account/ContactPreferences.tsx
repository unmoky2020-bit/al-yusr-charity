import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { ProfilePreferences } from "@/data/laravelApi";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/lib/notify";

const DEFAULTS: Required<ProfilePreferences> = {
  whatsapp_updates: true,
  email_updates: true,
  preferred_contact: "whatsapp",
  anonymous_by_default: false,
};

type PrefRowProps = { id: string; title: string; hint: string; checked: boolean; onChange: (v: boolean) => void };

/** One on/off preference with its explanation. */
function PrefRow({ id, title, hint, checked, onChange }: PrefRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div>
        <Label htmlFor={id} className="text-sm font-extrabold text-primary">{title}</Label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** How the foundation reaches this person, and whether their name shows on donations. */
export function ContactPreferences({ showDonorOptions = true }: { showDonorOptions?: boolean }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, updateProfile } = useAuth();
  const saved = { ...DEFAULTS, ...(user?.preferences ?? {}) };
  const [prefs, setPrefs] = useState(saved);
  const [saving, setSaving] = useState(false);
  const savedKey = JSON.stringify(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPrefs(saved), [savedKey]);
  if (!user) return null;

  const dirty = JSON.stringify(prefs) !== savedKey;
  const set = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(user.id, { preferences: prefs });
      toast.success(ar ? "اتحفظت تفضيلاتك" : "Preferences saved");
    } catch {
      /* reason already shown */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <PrefRow
        id="pref-wa"
        title={ar ? "تحديثات على واتساب" : "WhatsApp updates"}
        hint={ar ? "صور التسليم وحالة تبرعك أول بأول." : "Delivery photos and your donation status."}
        checked={prefs.whatsapp_updates}
        onChange={(v) => set("whatsapp_updates", v)}
      />
      <PrefRow
        id="pref-mail"
        title={ar ? "تقارير على البريد" : "Email reports"}
        hint={ar ? "الإيصالات والتقارير الشهرية والحملات الجديدة." : "Receipts, monthly reports and new campaigns."}
        checked={prefs.email_updates}
        onChange={(v) => set("email_updates", v)}
      />
      {showDonorOptions && (
        <PrefRow
          id="pref-anon"
          title={ar ? "تبرعاتي باسم «فاعل خير»" : "Give as “anonymous”"}
          hint={ar ? "اسمك ما يظهرش في قوائم المتبرعين (المؤسسة بس اللي تعرفه)." : "Your name stays off public donor lists."}
          checked={prefs.anonymous_by_default}
          onChange={(v) => set("anonymous_by_default", v)}
        />
      )}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <p className="text-sm font-extrabold text-primary">{ar ? "أنسب طريقة نتواصل بيها معاك" : "Best way to reach you"}</p>
        <RadioGroup
          value={prefs.preferred_contact}
          onValueChange={(v) => set("preferred_contact", v as typeof prefs.preferred_contact)}
          className="mt-3 grid grid-cols-3 gap-2"
        >
          {([
            ["whatsapp", ar ? "واتساب" : "WhatsApp"],
            ["phone", ar ? "مكالمة" : "Call"],
            ["email", ar ? "بريد" : "Email"],
          ] as const).map(([v, label]) => (
            <Label
              key={v}
              htmlFor={`pref-c-${v}`}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-extrabold has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:text-primary"
            >
              <RadioGroupItem id={`pref-c-${v}`} value={v} /> {label}
            </Label>
          ))}
        </RadioGroup>
      </div>
      <Button type="button" onClick={() => void save()} disabled={!dirty || saving} variant="outline" className="h-11 w-full font-extrabold">
        <Save className="h-4 w-4" /> {saving ? (ar ? "بنحفظ…" : "Saving…") : ar ? "حفظ التفضيلات" : "Save preferences"}
      </Button>
    </div>
  );
}
