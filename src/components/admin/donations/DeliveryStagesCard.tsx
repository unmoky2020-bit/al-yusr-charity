import { useRef, useState } from "react";
import { BellRing, ClipboardCheck, Loader2, PackageOpen, PauseCircle, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { askConfirm } from "@/components/common/confirm";
import { DeliveryJourney } from "@/components/donations/DeliveryJourney";
import { EvidencePhotos } from "@/components/impact/EvidencePhotos";
import { deliveryApi } from "@/data/api/impactApi";
import { DELIVERY_STAGES, JOURNEY_LABEL, type DeliveryInfo, type DeliveryLineStage, type DeliveryStage } from "@/lib/deliveryJourney";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const ICON: Record<DeliveryStage, typeof Truck> = { family_identified: ClipboardCheck, preparing: PackageOpen, delivered: Truck };

type Props = {
  donationId: string;
  status: string;
  delivery: DeliveryInfo | null;
  createdAt?: string;
  isAr: boolean;
  onSaved: (delivery: DeliveryInfo | null) => void;
};

/**
 * «مراحل التسليم» on a donation's dashboard page: after payment the team records each step
 * (family identified → prepared → delivered) with an optional note and photos (faces blurred),
 * or pauses it with the reason. Each line notifies the donor; a mistaken line can be undone.
 */
export function DeliveryStagesCard({ donationId, status, delivery, createdAt, isAr, onSaved }: Props) {
  const lang = isAr ? "ar" : "en";
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState<DeliveryLineStage | "undo" | null>(null);
  const [noteError, setNoteError] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const paid = status === "paid" || status === "completed";
  const current = delivery?.stage ? DELIVERY_STAGES.indexOf(delivery.stage) : -1;
  const lines = delivery?.history.length ?? 0;

  const save = async (stage: DeliveryLineStage) => {
    if (stage === "on_hold" && !note.trim()) {
      setNoteError(true);
      noteRef.current?.focus();
      return;
    }
    setBusy(stage);
    try {
      const saved = await deliveryApi.add(donationId, stage, { note, photos, notify });
      onSaved(saved);
      setNote("");
      setPhotos([]);
      setNoteError(false);
      const label = stage === "on_hold" ? (isAr ? "تأجيل مؤقت" : "Paused") : JOURNEY_LABEL[stage][lang];
      toast.success(isAr ? `اتسجلت الخطوة: ${label}` : `Saved: ${label}`, {
        description: notify ? (isAr ? "المتبرع وصله إشعار على حسابه." : "The donor was notified.") : undefined,
      });
    } catch (err) {
      notifyError(err, isAr ? "الخطوة ما اتسجلتش" : "Step not saved");
    } finally {
      setBusy(null);
    }
  };

  const undo = async () => {
    const last = delivery?.history[delivery.history.length - 1];
    if (!last) return;
    const label = last.stage === "on_hold" ? (isAr ? "تأجيل مؤقت" : "Paused") : JOURNEY_LABEL[last.stage][lang];
    const ok = await askConfirm(
      isAr ? `نلغي آخر خطوة («${label}»)؟\nبتتشال من سجل المتبرع، والإشعار اللي اتبعت مش بيرجع.` : `Undo the last step («${label}»)?\nIt leaves the donor's log; a sent notification stays sent.`,
    );
    if (!ok) return;
    setBusy("undo");
    try {
      onSaved(await deliveryApi.undoLast(donationId));
      toast.success(isAr ? "اتلغت آخر خطوة" : "Last step undone");
    } catch (err) {
      notifyError(err, isAr ? "ما قدرناش نلغي الخطوة" : "Could not undo");
    } finally {
      setBusy(null);
    }
  };

  const locked = busy !== null || photosBusy;

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-sm font-black text-primary">{isAr ? "مراحل التسليم للمتبرع" : "Delivery steps for the donor"}</h2>
          <p className="text-[11px] text-muted-foreground">
            {isAr ? "بتظهر للمتبرع في لوحته وصفحة التتبع بالصور والملاحظة، وبيوصله إشعار مع كل خطوة." : "Shown on the donor's dashboard and tracking page with photos and notes; each step notifies the donor."}
          </p>
        </div>
        {paid && lines > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => void undo()} disabled={locked} className="h-8 gap-1 rounded-lg text-[11px] font-bold">
            {busy === "undo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
            {isAr ? "إلغاء آخر خطوة" : "Undo last step"}
          </Button>
        )}
      </div>

      <DeliveryJourney status={status} delivery={delivery} createdAt={createdAt} lang={lang} />

      {!paid ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {isAr ? "علّم التبرع «مدفوع» الأول، وبعدها سجّل مراحل التسليم." : "Mark the donation paid first, then record the delivery steps."}
        </p>
      ) : (
        <div className="space-y-3 rounded-xl bg-muted/30 p-3">
          <p className="text-[11px] font-black text-foreground">{isAr ? "خطوة جديدة" : "New step"}</p>
          <Textarea
            ref={noteRef}
            rows={2}
            value={note}
            maxLength={500}
            onChange={(e) => {
              setNote(e.target.value);
              if (e.target.value.trim()) setNoteError(false);
            }}
            aria-invalid={noteError}
            placeholder={isAr ? "ملاحظة للمتبرع (اختياري — ولازمة مع التأجيل): مثلاً «أسرة من 5 أفراد في قرية ميت غمر»" : "Note for the donor (optional; required to pause)"}
            className={cn("rounded-xl bg-background text-sm", noteError && "border-destructive ring-1 ring-destructive")}
          />
          {noteError && <p className="text-[11px] font-bold text-destructive">{isAr ? "اكتب سبب التأجيل علشان المتبرع يعرف." : "Write why it's paused so the donor knows."}</p>}
          <EvidencePhotos value={photos} onChange={setPhotos} lang={lang} onBusyChange={setPhotosBusy} addLabel={isAr ? "صور التسليم" : "Photos"} />
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
            <BellRing className="h-3.5 w-3.5" /> {isAr ? "ابعت إشعار للمتبرع" : "Notify the donor"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DELIVERY_STAGES.map((stage, i) => {
              const Icon = ICON[stage];
              const done = i <= current;
              const next = i === current + 1;
              return (
                <Button
                  key={stage}
                  type="button"
                  variant={next ? "default" : "outline"}
                  disabled={locked}
                  onClick={() => void save(stage)}
                  className={cn("h-auto justify-start gap-2 whitespace-normal py-2.5 text-start text-xs font-extrabold", next && "bg-orange-grad text-accent-foreground shadow-cta", done && "border-secondary bg-secondary/10 text-primary")}
                >
                  {busy === stage ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Icon className="h-4 w-4 shrink-0" />}
                  <span className="flex-1">{JOURNEY_LABEL[stage][lang]}</span>
                </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              disabled={locked || current === DELIVERY_STAGES.length - 1}
              onClick={() => void save("on_hold")}
              className="h-auto justify-start gap-2 whitespace-normal border-amber-300 py-2.5 text-start text-xs font-extrabold text-amber-800 hover:bg-amber-50"
            >
              {busy === "on_hold" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <PauseCircle className="h-4 w-4 shrink-0" />}
              <span className="flex-1">{isAr ? "تأجيل مؤقت" : "Pause"}</span>
            </Button>
          </div>
          {photosBusy && <p className="text-[11px] font-bold text-muted-foreground">{isAr ? "استنى الصور تخلص رفع…" : "Wait for the photos to finish uploading…"}</p>}
        </div>
      )}
    </section>
  );
}
