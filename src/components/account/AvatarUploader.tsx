import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { profileApi } from "@/data/api/profileApi";
import { useLang } from "@/i18n/LangContext";
import { compressImage } from "@/lib/image-compress";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

/** First letters of the first two words ("محمد حسام" → "مح"), for the photo-less avatar. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "؟";
  if (words.length === 1) return words[0].slice(0, 2);
  return `${words[0][0]}${words[1][0]}`;
}

type Props = { size?: "md" | "lg" | "xl"; className?: string };

const BOX: Record<NonNullable<Props["size"]>, string> = {
  md: "h-20 w-20 text-2xl",
  lg: "h-28 w-28 text-3xl",
  xl: "h-32 w-32 text-4xl md:h-36 md:w-36",
};

/**
 * The account photo with "change" and "remove" actions. The photo is shrunk in the browser (640px,
 * WebP) before it is sent, so a phone picture uploads in a second and the header stays light.
 */
export function AvatarUploader({ size = "lg", className }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, applyServerUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [broken, setBroken] = useState(false);
  if (!user) return null;

  const box = BOX[size];
  const photo = user.avatar && !broken ? user.avatar : "";

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(ar ? "الصورة لازم تكون JPG أو PNG أو WebP" : "Use a JPG, PNG or WebP photo");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(ar ? "الصورة كبيرة قوي (أكتر من 12 ميجا)" : "That photo is larger than 12 MB");
      return;
    }
    setBusy("upload");
    try {
      const small = await compressImage(file, { maxEdge: 640, quality: 0.85, maxSizeBytes: 900 * 1024 });
      const saved = await profileApi.uploadAvatar(small, file.name);
      if (saved) applyServerUser(saved);
      setBroken(false);
      toast.success(ar ? "اتحدثت صورتك" : "Photo updated");
    } catch (err) {
      notifyError(err, ar ? "الصورة ما اترفعتش" : "Photo not uploaded");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("remove");
    try {
      const saved = await profileApi.removeAvatar();
      if (saved) applyServerUser(saved);
      toast.success(ar ? "اتشالت الصورة" : "Photo removed");
    } catch (err) {
      notifyError(err, ar ? "الصورة ما اتشالتش" : "Photo not removed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-glow font-black text-secondary ring-4 ring-background shadow-card",
            box,
            busy === "upload" && "animate-pulse",
          )}
        >
          {photo ? (
            <img src={photo} alt={user.name} className="h-full w-full object-cover" onError={() => setBroken(true)} />
          ) : (
            <span aria-hidden>{initialsOf(user.name)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy !== null}
          className="absolute bottom-0 end-0 grid h-9 w-9 place-items-center rounded-full bg-orange-grad text-accent-foreground shadow-cta ring-4 ring-background transition hover:scale-105 disabled:opacity-60"
          aria-label={ar ? "غيّر الصورة" : "Change photo"}
          title={ar ? "غيّر الصورة" : "Change photo"}
        >
          <Camera className="h-4 w-4" />
        </button>
        <input ref={input} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onFile} />
      </div>
      <div className="flex items-center gap-3 text-xs font-bold">
        <button type="button" onClick={() => input.current?.click()} disabled={busy !== null} className="text-primary hover:underline disabled:opacity-60">
          {busy === "upload" ? (ar ? "بنرفع الصورة…" : "Uploading…") : photo ? (ar ? "غيّر الصورة" : "Change photo") : (ar ? "ضيف صورة" : "Add a photo")}
        </button>
        {photo && (
          <button type="button" onClick={() => void remove()} disabled={busy !== null} className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-60">
            <Trash2 className="h-3.5 w-3.5" /> {ar ? "شيلها" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}
