import { useEffect } from "react";
import { PENDING_APPROVAL_EVENT } from "@/data/api/approval";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/lib/notify";

/**
 * One notice when the server holds a change for an admin's approval (an editor saving an article,
 * a case…): it is not live yet, it waits under «مراجعة واعتماد التعديلات». Several held writes from
 * one save show a single notice.
 */
export function PendingApprovalNotice() {
  const { lang } = useLang();

  useEffect(() => {
    let last = 0;
    const onHeld = () => {
      const now = Date.now();
      if (now - last < 4000) return;
      last = now;
      toast.info(lang === "ar" ? "اتبعت للمراجعة" : "Sent for review", {
        description:
          lang === "ar"
            ? "التعديل هيظهر على الموقع بعد ما المدير يوافق عليه."
            : "It goes live once an admin approves it.",
        duration: 7000,
      });
    };
    window.addEventListener(PENDING_APPROVAL_EVENT, onHeld);
    return () => window.removeEventListener(PENDING_APPROVAL_EVENT, onHeld);
  }, [lang]);

  return null;
}
