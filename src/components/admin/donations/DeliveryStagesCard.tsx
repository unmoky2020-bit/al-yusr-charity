import { useState } from "react";
import { BellRing, ClipboardCheck, PackageOpen, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DeliveryJourney } from "@/components/donations/DeliveryJourney";
import { donationsAdminApi } from "@/data/api/donationsAdminApi";
import { DELIVERY_STAGES, JOURNEY_LABEL, type DeliveryInfo, type DeliveryStage } from "@/lib/deliveryJourney";
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
 * «مراحل التسليم» on a donation's dashboard page: after payment the team marks the family as
 * identified, the gift as being prepared, then delivered. Each step notifies the donor.
 */
export function DeliveryStagesCard({ donationId, status, delivery, createdAt, isAr, onSaved }: Props) {
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState<DeliveryStage | null>(null);
  const paid = status === "paid" || status === "completed";
  const current = delivery ? DELIVERY_STAGES.indexOf(delivery.stage) : -1;

  const save = async (stage: DeliveryStage) => {
    setBusy(stage);
    try {
      const saved = await donationsAdminApi.setDelivery(donationId, stage, { note, notify });
      onSaved(saved);
      setNote("");
      toast.success(isAr ? `اتسجلت المرحلة: ${JOURNEY_LABEL[stage].ar}` : `Saved: ${JOURNEY_LABEL[stage].en}`, {
        description: notify ? (isAr ? "المتبرع وصله إشعار على حسابه." : "The donor was notified.") : undefined,
      });
    } catch (err) {
      notifyError(err, isAr ? "المرحلة ما اتسجلتش" : "Step not saved");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-sm font-black text-primary">{isAr ? "مراحل التسليم للمتبرع" : "Delivery steps for the donor"}</h2>
          <p className="text-[11px] text-muted-foreground">
            {isAr ? "بتظهر للمتبرع في لوحته وصفحة التتبع، وبيوصله إشعار مع كل خطوة." : "Shown on the donor's dashboard and tracking page, with a notification each step."}
          </p>
        </div>
      </div>

      <DeliveryJourney status={status} delivery={delivery} createdAt={createdAt} lang={isAr ? "ar" : "en"} />

      {!paid ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {isAr ? "علّم التبرع «مدفوع» الأول، وبعدها سجّل مراحل التسليم." : "Mark the donation paid first, then record the delivery steps."}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {DELIVERY_STAGES.map((stage, i) => {
              const Icon = ICON[stage];
              const done = i <= current;
              const next = i === current + 1;
              return (
                <Button
                  key={stage}
                  type="button"
                  variant={next ? "default" : "outline"}
                  disabled={busy !== null}
                  onClick={() => void save(stage)}
                  className={cn("h-auto justify-start gap-2 whitespace-normal py-2.5 text-start text-xs font-extrabold", next && "bg-orange-grad text-accent-foreground shadow-cta", done && "border-secondary bg-secondary/10 text-primary")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{isAr ? JOURNEY_LABEL[stage].ar : JOURNEY_LABEL[stage].en}</span>
                  {busy === stage && <span className="text-[10px]">…</span>}
                </Button>
              );
            })}
          </div>
          <Textarea
            rows={2}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isAr ? "ملاحظة للمتبرع مع الخطوة (اختياري): مثلاً «أسرة من 5 أفراد في قرية ميت غمر»" : "Optional note for the donor with this step"}
          />
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
            <BellRing className="h-3.5 w-3.5" /> {isAr ? "ابعت إشعار للمتبرع" : "Notify the donor"}
          </label>
        </div>
      )}
    </section>
  );
}
