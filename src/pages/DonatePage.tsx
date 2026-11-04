import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Heart, ShieldCheck, Lock,
  CheckCircle2, ArrowLeft, ArrowRight, Copy, Loader2, Receipt as ReceiptIcon,
  Upload, CreditCard, Landmark, Smartphone, QrCode, AlertCircle, Truck, ChevronDown, X,
  Search, Check, UserCheck, LogIn, Plus, Trash2, Sparkles, Layers, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DonationReceipt } from "@/components/common/DonationReceipt";
import { useLang } from "@/i18n/LangContext";
import { SimpleDonateHero } from "@/components/sections/SimpleDonateHero";
import { donationsStore, type DonationRecord } from "@/data/donationsStore";
import { toast } from "@/hooks/use-toast";
import { createDonation, getCaseByRef, listPublicCases, verifyDonationPayment, type CaseRow } from "@/data/casesApi";
import { attachCases, linkedCaseId, ownerOfCase } from "@/data/donationCases";
import { caseFunding } from "@/lib/caseFunding";
import { fromLaravelRow } from "@/data/donationRecordMapper";
import { useAuth } from "@/auth/AuthContext";

import { trackAdEvent } from "@/lib/adCampaignTracker";
import { trackDonationStarted } from "@/lib/track";
import { PaymentBrandIcon } from "@/components/donate/PaymentBrandLogos";
import {
  DonationEntity,
  DonationShare,
  LinkedCase,
  EntityType,
} from "@/data/donationEntities";
import { findEntityForLink, useDonationEntities } from "@/data/sources/donationEntities";
import { targetOfBasket } from "@/data/donationTarget";
import {
  DonationEntityItem,
  DonationItemState,
} from "@/components/donate/DonationEntityItem";
import { PaymobCheckoutModal } from "@/components/donate/PaymobCheckoutModal";
import { KashierCheckoutModal } from "@/components/donate/KashierCheckoutModal";
import { getGatewaySettings } from "@/data/kashierGateway";
import { usePaymentOptions, type PaymentOption, type PayoutDestination } from "@/data/paymentOptions";

type StaticMethod = {
  id: string;
  ar: string;
  en: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: any;
  badge?: { ar: string; en: string; color: string };
  /** Where the donor sends money (wallet numbers, IPA addresses, bank accounts) — from the dashboard. */
  destinations?: PayoutDestination[];
  instructions_ar?: string;
  instructions_en?: string;
  isManual: boolean;
  isGateway?: boolean;
  isDelegate?: boolean;
};

/**
 * How each payment option looks in the form. WHAT is offered (which methods, which numbers and
 * accounts) comes only from the dashboard («طرق الدفع», GET /payment-methods/active).
 */
const METHOD_LOOK: Record<string, Omit<StaticMethod, "id" | "ar" | "en" | "isManual" | "destinations">> = {
  vodafone_cash: { subtitleAr: "تحويل فوري للمحفظة", subtitleEn: "Instant Wallet Transfer", icon: Smartphone, badge: { ar: "محفظة إلكترونية", en: "Mobile Wallet", color: "emerald" },
    instructions_ar: "حوّل المبلغ على الرقم الموضح، ثم أرسل إيصال التحويل أو اكتب رقم محفظتك للتأكيد.", instructions_en: "Transfer to the number shown, then share the receipt or your wallet number." },
  orange_cash: { subtitleAr: "تحويل فوري للمحفظة", subtitleEn: "Instant Wallet Transfer", icon: Smartphone, badge: { ar: "محفظة إلكترونية", en: "Mobile Wallet", color: "emerald" },
    instructions_ar: "حوّل المبلغ على الرقم الموضح، ثم أرسل إيصال التحويل للتأكيد.", instructions_en: "Transfer to the number shown, then share the receipt." },
  instapay: { subtitleAr: "تحويل لحظي (IPA)", subtitleEn: "Instant IPA Transfer", icon: QrCode, badge: { ar: "تحويل فوري", en: "Instant Transfer", color: "indigo" },
    instructions_ar: "افتح تطبيق InstaPay وأدخل العنوان الموضح لإتمام التحويل في ثوانٍ.", instructions_en: "Open InstaPay and enter the address shown." },
  bank_transfer: { subtitleAr: "تحويل بنكي مباشر", subtitleEn: "Direct Bank Transfer", icon: Landmark, badge: { ar: "تحويل بنكي", en: "Bank Transfer", color: "slate" },
    instructions_ar: "حوّل إلى حساب المؤسسة الموضح، وأرسل صورة إشعار التحويل للتأكيد.", instructions_en: "Transfer to the account shown and send the receipt." },
  card_kashier: { subtitleAr: "كاشير (فيزا / ماستركارد / ميزة)", subtitleEn: "Kashier (Visa / Mastercard / Meeza)", icon: CreditCard, isGateway: true,
    instructions_ar: "ستفتح نافذة الدفع المشفرة المعتمدة عبر بوابة كاشير (3D-Secure) لإتمام التبرع بأمان.", instructions_en: "Secure encrypted online payment via the Kashier gateway." },
  delegate_pickup: { subtitleAr: "استلام منزلي مجاني", subtitleEn: "Free Doorstep Pickup", icon: Truck, badge: { ar: "استلام منزلي مجاني", en: "Free Home Pickup", color: "emerald" }, isDelegate: true,
    instructions_ar: "سيتواصل معك مندوبنا هاتفياً لتحديد الميعاد الأنسب واستلام التبرع بإيصال معتمد.", instructions_en: "Our delegate will call you to arrange a time and collect the donation with an official receipt." },
};

/** A dashboard payment option as the form shows it (its own description wins over the default text). */
function toFormMethod(o: PaymentOption): StaticMethod {
  const look = METHOD_LOOK[o.id] ?? { subtitleAr: "", subtitleEn: "", icon: Landmark };
  return {
    id: o.id,
    ar: o.nameAr,
    en: o.nameEn,
    ...look,
    instructions_ar: o.descriptionAr || look.instructions_ar,
    instructions_en: o.descriptionEn || look.instructions_en,
    isManual: o.kind === "wallet" || o.kind === "instant" || o.kind === "bank",
    destinations: o.destinations,
  };
}

const badgeClasses: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  indigo:  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  teal:    "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  slate:   "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export type { DonationItemState };

const DonatePage = () => {
  // Backend programs / projects / campaigns (static list only while loading or when the API is unreachable).
  const { entities: baseEntities, fromApi: entitiesFromApi } = useDonationEntities();
  // Open backend cases, each under its program / project / campaign (or the general donation),
  // plus the case opened from a case page (?case=…), listed first.
  const [openCases, setOpenCases] = useState<CaseRow[]>([]);
  const [pageCase, setPageCase] = useState<CaseRow | null>(null);
  useEffect(() => {
    let alive = true;
    void listPublicCases().then((rows) => alive && setOpenCases(rows));
    return () => { alive = false; };
  }, []);
  const DONATION_ENTITIES = useMemo(() => attachCases(baseEntities, openCases, pageCase), [baseEntities, openCases, pageCase]);
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Gateway return (top-window redirect, or the home quick-donate card): the reference in the URL
  // is only a hint of WHICH transaction to look at. The effect below asks the backend, and shows
  // the thank-you step only when the backend confirms the payment.
  const returnRef = (
    params.get("ref") ||
    params.get("paymob_ref") ||
    params.get("merchantOrderId") ||
    params.get("orderReference") ||
    params.get("orderId") ||
    ""
  ).trim();
  const [verifyingReturn, setVerifyingReturn] = useState<boolean>(!!returnRef);


  const entityParam     = params.get("entity");
  const programSlug     = params.get("program");
  const campaignSlug    = params.get("campaign");
  const projectSlug     = params.get("project");
  const caseRef         = params.get("case");
  const sectorSlugParam = params.get("sector");

  /** The entity a donate link points at (?entity= id, or ?program= / ?project= / ?campaign= slug). */
  const linkedEntity = findEntityForLink(DONATION_ENTITIES, {
    entity: entityParam,
    program: programSlug,
    project: projectSlug,
    campaign: campaignSlug,
  });
  const hasLinkTarget = !!(entityParam || programSlug || campaignSlug || projectSlug);

  const initialEntity = linkedEntity || DONATION_ENTITIES[0];
  const initialMode = initialEntity.isMarkoun ? "in_kind" : "general";
  const initialAmount = Number(params.get("amount")) || (initialMode === "in_kind" ? 0 : initialEntity.priceFrom || 100);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<DonationItemState[]>([
    {
      id: "item-init",
      entityId: initialEntity.id,
      donationMode: initialMode,
      amount: initialAmount,
      selectedShares: {},
      selectedCaseId: null,
    },
  ]);
  const [sectorFilter, setSectorFilter] = useState<string>(sectorSlugParam || "all");
  const [paymobClientSecret, setPaymobClientSecret] = useState<string>("");
  const [isPaymobModalOpen, setIsPaymobModalOpen] = useState(false);
  const [isKashierModalOpen, setIsKashierModalOpen] = useState(false);
  const [kashierOrderId, setKashierOrderId] = useState<string>("");
  const [kashierSessionUrl, setKashierSessionUrl] = useState<string>("");

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.donationMode === "in_kind" ? 0 : (Number(it.amount) || 0)), 0);
  }, [items]);

  /** Set once the donor changes the basket; link params then stop overriding it. */
  const basketEditedRef = useRef(false);

  useEffect(() => {
    setSectorFilter(sectorSlugParam || "all");
    if (!hasLinkTarget || basketEditedRef.current || !linkedEntity) return;
    // ?package=<backend package id | share id>: open the form on that share.
    const pkgParam = params.get("package");
    const share = pkgParam ? linkedEntity.shares.find((s) => String(s.apiId) === pkgParam || s.id === pkgParam) : undefined;
    const defMode = linkedEntity.isMarkoun ? "in_kind" : share ? "shares" : "general";
    const paramAmt = Number(params.get("amount"));
    // ?qty=<n> (with ?package=): open the form with n of that share (1–99).
    const qty = share ? Math.min(99, Math.max(1, Math.floor(Number(params.get("qty")) || 1))) : 1;
    const defAmount = share ? share.price * qty : paramAmt > 0 ? paramAmt : (defMode === "in_kind" ? 0 : linkedEntity.priceFrom || 100);
    setItems([
      {
        id: "item-init",
        entityId: linkedEntity.id,
        donationMode: defMode,
        amount: defAmount,
        selectedShares: share ? { [share.id]: qty } : {},
        selectedCaseId: null,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorSlugParam, entityParam, programSlug, campaignSlug, projectSlug, linkedEntity?.id, entitiesFromApi]);

  const MAX_BASKET_ITEMS = 3;

  const addItem = () => {
    if (items.length >= MAX_BASKET_ITEMS) {
      toast({
        title: lang === "ar" ? "الحد الأقصى للسلة 3 بنود" : "Basket limit reached",
        description: lang === "ar"
          ? "يمكنك إضافة حتى 3 بنود في العملية الواحدة لضمان الدقة وتوزيع أثر التبرع."
          : "Max 3 items per transaction. Complete this donation then start a new one.",
        variant: "destructive",
      });
      return;
    }
    basketEditedRef.current = true;
    const existing = new Set(items.map((i) => i.entityId));
    const nextEnt = DONATION_ENTITIES.find((p) => !existing.has(p.id) && !p.isMarkoun) || DONATION_ENTITIES[0];
    const defaultAmt = nextEnt.priceFrom && nextEnt.priceFrom > 0 ? nextEnt.priceFrom : 100;
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        entityId: nextEnt.id,
        donationMode: "general",
        amount: defaultAmt,
        selectedShares: {},
        selectedCaseId: null,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    basketEditedRef.current = true;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (updated: DonationItemState) => {
    basketEditedRef.current = true;
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    if (fieldErrors[`amount_${updated.id}`]) {
      setFieldErrors((p) => ({ ...p, [`amount_${updated.id}`]: "" }));
    }
    if (fieldErrors.amount) {
      setFieldErrors((p) => ({ ...p, amount: "" }));
    }
  };

  // Honour ?method= from the home quick-donate so the visitor doesn't pick twice
  const [method, setMethod] = useState<string>(() => params.get("method") || "");

  // Donor details arrive via router state (never the URL, so they stay out of history and analytics).
  const prefill = (useLocation().state as { donor?: { name?: string; phone?: string; email?: string } } | null)?.donor;
  const [donor, setDonor] = useState({
    name:  prefill?.name  || "",
    email: prefill?.email || "",
    phone: prefill?.phone || "",
  });

  useEffect(() => {
    if (!user) return;
    setDonor((d) => ({
      name:  d.name  || user.name  || "",
      email: d.email || user.email || "",
      phone: d.phone || user.phone || "",
    }));
    setMethodFields((f) => ({ ...f, pickupCity: f.pickupCity || (user as any).city || "" }));
  }, [user]);

  useEffect(() => {
    if (params.get("autostart") === "1" && donor.name && donor.phone && totalAmount > 0) setStep(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 3) {
      // Delay confetti so checkmark renders first
      const t0 = setTimeout(() => {
        try {
          // Initial burst
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#cbfb43", "#15803d", "#f97316", "#eab308", "#10b981"],
          });
          // Side bursts
          setTimeout(() => {
            confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors: ["#cbfb43", "#15803d", "#f97316"] });
            confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors: ["#cbfb43", "#15803d", "#f97316"] });
          }, 300);
          // Lingering gentle trickle
          setTimeout(() => {
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.4 }, colors: ["#cbfb43", "#22c55e", "#eab308"] });
          }, 800);
          setTimeout(() => {
            confetti({ particleCount: 20, spread: 40, origin: { y: 0.5 }, colors: ["#cbfb43", "#10b981"] });
          }, 1400);
          setTimeout(() => {
            confetti({ particleCount: 15, spread: 35, origin: { y: 0.6 }, colors: ["#cbfb43", "#22c55e"] });
          }, 2000);
        } catch {
          // ignore if canvas-confetti fails
        }
      }, 450);
      return () => clearTimeout(t0);
    }
  }, [step]);

  const [processing, setProcessing]           = useState(false);
  const [record, setRecord]                   = useState<DonationRecord | null>(null);

  // Returning from the payment gateway: confirmed paid -> thank-you step (animation, ref, receipt);
  // anything else -> the status page, which keeps checking and never shows "paid" on its own.
  useEffect(() => {
    if (!returnRef) return;
    let cancelled = false;
    void (async () => {
      const { status, data } = await verifyDonationPayment(returnRef);
      if (cancelled) return;
      if (status === "paid" && data) {
        const confirmed = fromLaravelRow(data);
        setRecord({ ...confirmed, ref: confirmed.ref || returnRef, status: "completed" });
        setStep(3);
        window.history.replaceState({}, "", window.location.pathname); // drop the reference from the URL
        window.scrollTo({ top: 0, behavior: "smooth" });
        setVerifyingReturn(false);
      } else {
        navigate(`/donate/status/${encodeURIComponent(returnRef)}`, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnRef]);

  const [receiptDataUrl, setReceiptDataUrl]   = useState<string>("");
  const [receiptFilename, setReceiptFilename] = useState<string>("");

  const idemKey = useRef<string>(
    (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    if (!caseRef) return;
    let alive = true;
    void getCaseByRef(caseRef).then((c) => alive && setPageCase(c));
    return () => { alive = false; };
  }, [caseRef]);

  // Put the page case in the basket once; keep its item under the case's owner when the
  // backend entity list arrives after the case.
  const pageCaseAppliedRef = useRef(false);
  useEffect(() => {
    if (!pageCase) return;
    const { remaining, done } = caseFunding(pageCase);
    if (done) return; // funded: the banner says so; the form stays on its default item
    const ownerId = (ownerOfCase(baseEntities, pageCase) ?? baseEntities[0]).id;
    const lcId = linkedCaseId(pageCase.id);
    if (pageCaseAppliedRef.current) {
      setItems((prev) => prev.map((it) => (it.selectedCaseId === lcId && it.entityId !== ownerId ? { ...it, entityId: ownerId } : it)));
      return;
    }
    pageCaseAppliedRef.current = true;
    // The amount picked on the case page (?amount=) wins over the suggestion.
    const linked = Number(params.get("amount"));
    const suggested = linked >= 10 ? Math.round(linked) : Math.min(500, Math.max(50, Math.ceil(remaining / 10)));
    basketEditedRef.current = true;
    setItems([
      {
        id: "item-case",
        entityId: ownerId,
        donationMode: "case",
        amount: Math.min(suggested, remaining),
        selectedShares: {},
        selectedCaseId: lcId,
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCase, baseEntities]);

  /** The page case, while it is still in the basket (the donor may switch to something else). */
  const activeCase = pageCase && items.some((it) => it.donationMode === "case" && it.selectedCaseId === linkedCaseId(pageCase.id)) ? pageCase : null;
  const caseId = activeCase ? activeCase.id : null;
  const caseTitle = activeCase?.title ?? "";

  const Arrow   = lang === "ar" ? ArrowLeft  : ArrowRight;
  const Back    = lang === "ar" ? ArrowRight : ArrowLeft;
  const baseUrl = "https://elyusr.org";

  const gatewaySettings = useMemo(() => getGatewaySettings(), []);
  const { options: paymentOptions } = usePaymentOptions();
  const availableMethods = useMemo(() => paymentOptions.map(toFormMethod), [paymentOptions]);
  // A method that is hidden in the dashboard (or unknown) falls back to the first offered one.
  useEffect(() => {
    if (!availableMethods.some((m) => m.id === method)) setMethod(availableMethods[0]?.id ?? "");
  }, [availableMethods, method]);

  const selectedMethod   = useMemo(() => availableMethods.find((m) => m.id === method) ?? availableMethods[0], [method, availableMethods]);
  const isVodafoneWallet = method.includes("vodafone");
  const isInstapay       = method.includes("instapay");
  const isDelegatePickup = selectedMethod.isDelegate ?? false;
  const isGateway        = selectedMethod.isGateway  ?? false;
  const isGatewayPaymob  = isGateway && method.includes("paymob");
  const isGatewayKashier = isGateway && (method.includes("kashier") || (!method.includes("paymob") && gatewaySettings.activeGateway === "kashier"));
  const isManualMethod   = selectedMethod.isManual;
  const isBank           = method.includes("bank");

  const [methodFields, setMethodFields] = useState({
    vodafonePhone: "", instapayHandle: "", bankRef: "",
    pickupAddress: "", pickupCity: "", pickupTime: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const primaryItem = items[0] || { entityId: "general", amount: 100, donationMode: "general" };

  /** Backend record the payment is booked on (null → general program, breakdown in the notes). */
  const donationTarget = useMemo(
    // One payment = one backend donation: a case is the target only when it is the whole basket
    // (a mixed basket is booked once, with the per-item split in the notes).
    () => targetOfBasket(items, (id) => DONATION_ENTITIES.find((e) => e.id === id)),
    [items, DONATION_ENTITIES],
  );
  const selectedEntity = useMemo(() => {
    return DONATION_ENTITIES.find((x) => x.id === primaryItem.entityId) || DONATION_ENTITIES[0];
  }, [primaryItem.entityId, DONATION_ENTITIES]);
  const selectedProgram = selectedEntity;

  // Is any item in the basket an in-kind (مركون) donation?
  const isMarkounInKind = useMemo(() =>
    items.some((it) => it.donationMode === "in_kind"),
  [items]);

  const itemsBreakdownText = useMemo(() => {
    return items
      .map((it) => {
        const ent = DONATION_ENTITIES.find((x) => x.id === it.entityId) || DONATION_ENTITIES[0];
        const name = lang === "ar" ? ent.ar : ent.en;
        if (it.donationMode === "in_kind") {
          return `${name} (${lang === "ar" ? "تبرع عيني" : "In-Kind"})`;
        }
        if (it.donationMode === "shares") {
          const sharesList = Object.entries(it.selectedShares)
            .map(([sId, count]) => {
              const s = ent.shares.find((x) => x.id === sId);
              return `${lang === "ar" ? s?.nameAr || sId : s?.nameEn || sId} × ${count}`;
            })
            .join("، ");
          return `${name} [${sharesList || "أسهم"}] (${(Number(it.amount) || 0).toLocaleString()} ج.م)`;
        }
        if (it.donationMode === "case" && it.selectedCaseId) {
          const cs = ent.cases.find((c) => c.id === it.selectedCaseId);
          return `${name} [${lang === "ar" ? `حالة: ${cs?.titleAr || it.selectedCaseId}` : `Case: ${cs?.titleEn || it.selectedCaseId}`}] (${(Number(it.amount) || 0).toLocaleString()} ج.م)`;
        }
        return `${name} (${(Number(it.amount) || 0).toLocaleString()} ج.م)`;
      })
      .join(" + ");
  }, [items, lang, DONATION_ENTITIES]);

  /** The case an item donates to (a case item), with the entity it belongs to. */
  const caseOfItem = useCallback((it: DonationItemState) => {
    if (it.donationMode !== "case" || !it.selectedCaseId) return null;
    const ent = DONATION_ENTITIES.find((x) => x.id === it.entityId);
    const cs = ent?.cases.find((c) => c.id === it.selectedCaseId);
    return cs ? { cs, ent } : null;
  }, [DONATION_ENTITIES]);

  /** Receipt line of one item: a case item is shown as the case (and what it belongs to), not as its program. */
  const receiptLine = useCallback((it: DonationItemState) => {
    const ar = lang === "ar";
    const ent = DONATION_ENTITIES.find((e) => e.id === it.entityId);
    const sharesCount = Object.values(it.selectedShares || {}).reduce((a, b) => a + b, 0);
    const kind = (e?: DonationEntity) =>
      !e ? (ar ? "برنامج خيري" : "Program")
        : e.entityType === "project" ? (ar ? "مشروع تنموي" : "Project")
        : e.entityType === "campaign" ? (ar ? "حملة إغاثية" : "Campaign")
        : (ar ? "برنامج خيري" : "Program");
    const c = caseOfItem(it);
    if (c) {
      const owner = c.ent && c.ent.id !== "general" ? (ar ? c.ent.ar : c.ent.en) : "";
      return {
        title: `${ar ? c.cs.titleAr : c.cs.titleEn || c.cs.titleAr} (#${c.cs.refCode})`,
        category: owner ? (ar ? `حالة إنسانية — ضمن ${owner}` : `Case — part of ${owner}`) : (ar ? "حالة إنسانية" : "Case"),
        quantity: 1,
        amount: it.amount || 0,
      };
    }
    return {
      title: ent ? (ar ? ent.ar : ent.en) : (ar ? "تبرع عام" : "General donation"),
      category: kind(ent),
      quantity: sharesCount > 0 ? sharesCount : 1,
      amount: it.amount || 0,
    };
  }, [DONATION_ENTITIES, caseOfItem, lang]);

  const programLabel = useMemo(() => {
    if (items.length === 1) {
      const c = caseOfItem(items[0]);
      if (c) return lang === "ar" ? c.cs.titleAr : c.cs.titleEn || c.cs.titleAr;
      const ent = DONATION_ENTITIES.find((x) => x.id === items[0].entityId) || DONATION_ENTITIES[0];
      return lang === "ar" ? ent.ar : ent.en;
    }
    return lang === "ar" ? `سلة تبرعات (${items.length} بنود)` : `Donation Basket (${items.length} items)`;
  }, [items, lang, DONATION_ENTITIES, caseOfItem]);

  const validateStep1 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const phoneRe = /^01[0-9]{9}$/;

    if (!isMarkounInKind) {
      if (totalAmount < 10) {
        errs.amount = lang === "ar" ? "إجمالي التبرع يجب أن يكون 10 جنيه كحد أدنى" : "Total donation must be at least 10 EGP";
      }

      items.forEach((it, idx) => {
        if (it.donationMode !== "in_kind" && (!it.amount || it.amount < 10)) {
          errs[`amount_${it.id}`] =
            lang === "ar"
              ? `حدد مبلغ لا يقل عن 10 ج.م للبند رقم (${idx + 1})`
              : `Enter at least 10 EGP for item #${idx + 1}`;
          return;
        }
        // A case can't take more than what is left on it (the backend refuses it).
        if (it.donationMode === "case" && it.selectedCaseId) {
          const cs = DONATION_ENTITIES.find((e) => e.id === it.entityId)?.cases.find((c) => c.id === it.selectedCaseId);
          const left = cs ? Math.max(0, cs.neededAmount - cs.raisedAmount) : 0;
          if (cs && cs.neededAmount > 0 && it.amount > left) {
            errs[`amount_${it.id}`] =
              lang === "ar"
                ? `الحالة فاضلها ${left.toLocaleString("en-US")} ج بس — قلّل مبلغ البند رقم (${idx + 1})`
                : `Only ${left.toLocaleString("en-US")} EGP is left on this case (item #${idx + 1})`;
          }
        }
      });
    }

    // Name is optional (empty = «فاعل خير»); the phone is always required to confirm the donation.
    if (donor.name.trim().length === 1) {
      errs.name = lang === "ar" ? "اكتب الاسم بالكامل أو سيبه فاضي للتبرع كفاعل خير" : "Enter your full name or leave it empty to give anonymously";
    }
    if (!phoneRe.test(donor.phone.trim())) {
      errs.phone = lang === "ar" ? "رقم الهاتف غير صحيح (01 + 9 أرقام، مثال: 01012345678)" : "Phone must be 01 + 9 digits";
    }
    if (donor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email.trim())) {
      errs.email = lang === "ar" ? "بريد إلكتروني غير صالح" : "Invalid email";
    }
    return errs;
  };

  const validateStep2 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const phoneRe = /^01[0-9]{9}$/;
    if (isVodafoneWallet && methodFields.vodafonePhone.trim() && !phoneRe.test(methodFields.vodafonePhone.trim())) {
      errs.vodafonePhone = lang === "ar" ? "رقم محفظة فودافون غير صالح" : "Invalid Vodafone wallet number";
    }
    if (isInstapay && methodFields.instapayHandle.trim() && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(methodFields.instapayHandle.trim())) {
      errs.instapayHandle = lang === "ar" ? "صيغة InstaPay غير صحيحة (name@bank)" : "Invalid InstaPay handle";
    }
    if (isDelegatePickup) {
      if (methodFields.pickupAddress.trim().length < 5) {
        errs.pickupAddress = lang === "ar" ? "اكتب عنوان تفصيلي واضح" : "Enter a clear address";
      }
      if (methodFields.pickupCity.trim().length < 2) {
        errs.pickupCity = lang === "ar" ? "اكتب المدينة / المحافظة" : "Enter your city";
      }
    }
    return errs;
  };

  const formTopRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!formTopRef.current) return;
    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formTopRef.current?.querySelector<HTMLElement>("h2")?.focus?.({ preventScroll: true });
    });
  }, [step]);

  useEffect(() => {
    if (!Object.values(fieldErrors).some(Boolean)) return;
    requestAnimationFrame(() => errorSummaryRef.current?.focus({ preventScroll: false }));
  }, [fieldErrors]);

  useEffect(() => {
    if (step === 3 && !record) {
      setProcessing(true);
      const tm = setTimeout(() => {
        void (async () => {
          try {
            const saved: any = await createDonation({
              target: donationTarget,
              amount: totalAmount,
              donor_name: donor.name,
              donor_email: donor.email,
              donor_phone: donor.phone,
              payment_method: method,
              payment_status: "pending",
              message: [
                caseTitle ? `Case: ${caseTitle}` : "",
                `Programs: ${itemsBreakdownText}`,
                isDelegatePickup ? `Pickup: ${methodFields.pickupCity} - ${methodFields.pickupAddress}` : "",
              ].filter(Boolean).join(" | ") || undefined,
              idempotency_key: idemKey.current,
            });
            const refGenerated = saved?.ref_code || `YSR-${Date.now().toString(36).toUpperCase()}`;
            const receiptItems = items.map(receiptLine);
            const singleCase = items.length === 1 ? caseOfItem(items[0]) : null;
            const firstEnt = items.length === 1 ? DONATION_ENTITIES.find((e) => e.id === items[0].entityId) : null;
            const targetType = singleCase
              ? (lang === "ar" ? "حالة إنسانية" : "Case")
              : firstEnt
              ? (firstEnt.entityType === "project" ? (lang === "ar" ? "مشروع تنموي" : "Project") : firstEnt.entityType === "campaign" ? (lang === "ar" ? "حملة إغاثية" : "Campaign") : (lang === "ar" ? "برنامج خيري" : "Program"))
              : (items.length > 1 ? (lang === "ar" ? "برامج ومشاريع متعددة" : "Multiple Programs") : (lang === "ar" ? "برنامج خيري" : "Program"));

            const created: DonationRecord = {
              ref: refGenerated,
              donor,
              amount: totalAmount,
              program: items.length === 1 ? items[0].entityId : "multiple",
              programLabel,
              method,
              // Bank / wallet / manual methods: money has not been confirmed yet. Staff confirm it in the backend.
              status: "pending",
              createdAt: saved?.created_at || new Date().toISOString(),
              updatedAt: saved?.created_at || new Date().toISOString(),
              items: receiptItems,
              notes: itemsBreakdownText || undefined,
              targetType,
              ...(receiptDataUrl ? { receiptDataUrl, receiptFilename } : {}),
            };
            donationsStore.create(created);
            setRecord(created);
            toast({ title: lang === "ar" ? "تم تسجيل التبرع" : "Donation recorded", description: lang === "ar" ? `رقم: ${created.ref}` : `Ref: ${created.ref}` });
            trackDonationStarted({ amount: totalAmount, program: items[0]?.entityId || "general", method, source: "donate-success" });
            (window as any).dataLayer?.push?.({ event: "donation_submitted", transaction_id: created.ref, value: totalAmount, currency: "EGP", method, program: items[0]?.entityId });
          } catch (e: any) {
            toast({ title: lang === "ar" ? "تعذر تسجيل الطلب" : "Could not record", description: e?.message || "", variant: "destructive" });
            setStep(2);
          } finally { setProcessing(false); }
        })();
      }, 1200);
      return () => clearTimeout(tm);
    }
  }, [step, record, lang, donor, totalAmount, items, programLabel, itemsBreakdownText, method, receiptDataUrl, receiptFilename, caseId, caseTitle, isDelegatePickup, methodFields.pickupCity, methodFields.pickupAddress]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: lang === "ar" ? "تم النسخ" : "Copied", description: text });
  };

  const onReceiptUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast({ title: "Max 4MB" }); return; }
    const reader = new FileReader();
    reader.onload = () => { setReceiptDataUrl(String(reader.result || "")); setReceiptFilename(file.name); };
    reader.readAsDataURL(file);
  };

  return (
    <PageLayout>
      {verifyingReturn && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-background/90 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-black text-primary">{lang === "ar" ? "بنأكد عملية الدفع…" : "Confirming your payment…"}</p>
          </div>
        </div>
      )}
      <SEOHelmet
        title={lang === "ar" ? "تبرع الآن — مؤسسة اليسر الخيرية" : "Donate Now — Al-Yusr Charity"}
        description={lang === "ar" ? "تبرع بأمان عبر بوابة كاشير أو فودافون كاش أو إنستاباي." : "Donate safely via Kashier, Vodafone Cash, or InstaPay."}
        path="/donate"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[{ name: t.nav.home, url: `${baseUrl}/` }, { name: t.nav.donate, url: `${baseUrl}/donate` }]} />

      {/* Unified Hero & Stepper Section with Seamless Continuous Pattern */}
      <section className="relative overflow-hidden pattern-hero-luxe text-primary-foreground">
        <SimpleDonateHero
          selected={primaryItem.entityId}
          onSelect={(slug) => {
            const ent = DONATION_ENTITIES.find((x) => x.id === slug) || DONATION_ENTITIES[0];
            const defMode = ent.isMarkoun ? "in_kind" : "general";
            setItems([
              {
                id: `item-${Date.now()}`,
                entityId: ent.id,
                donationMode: defMode,
                amount: defMode === "in_kind" ? 0 : (items[0]?.amount && items[0].amount >= 50 ? items[0].amount : ent.priceFrom || 100),
                selectedShares: {},
                selectedCaseId: null,
              },
            ]);
            setTimeout(() => {
              const el = document.getElementById("donate-form");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
          }}
          sectorFilter={sectorFilter}
          onSectorFilterChange={setSectorFilter}
        />

        <div id="donate-form" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-1 pb-44 sm:pb-52 md:pb-60 scroll-mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-black md:text-3xl lg:text-4xl">{t.donate.title}</h2>
            <p className="mt-2.5 text-sm text-primary-foreground/90 md:text-base leading-relaxed font-medium">
              {lang === "ar" ? (
                <>
                  <span>اختر البرنامج وطريقة الدفع الأنسب لك في خطوات يسيرة،</span>
                  <br className="hidden sm:inline" />
                  <span>ودعنا نوصل صدقتك وأثر تبرعك لمن يستحق بأمان وشفافية تامة.</span>
                </>
              ) : (
                <>
                  <span>Choose your preferred program and convenient payment method,</span>
                  <br className="hidden sm:inline" />
                  <span>and let us deliver your charitable impact with full trust and transparency.</span>
                </>
              )}
            </p>
          </div>

          <div className="mx-auto mt-5 sm:mt-6 flex w-full max-w-md items-center justify-center gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
            {[
              { num: 1, labelAr: "البرنامج والبيانات", labelEn: "Program & Info" },
              { num: 2, labelAr: "طريقة الدفع", labelEn: "Payment Method" },
              { num: 3, labelAr: "التأكيد والإيصال", labelEn: "Receipt" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <div className={`h-0.5 w-6 sm:w-16 md:w-24 lg:w-32 transition-all ${step >= s.num ? "bg-secondary" : "bg-primary-foreground/15"}`} />}
                <div className="flex items-center gap-1.5">
                  <div className={`grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                    step >= s.num ? "bg-secondary text-slate-950 font-black shadow-cta" : "bg-primary-foreground/15 text-primary-foreground/60"
                  }`}>
                    {s.num}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-bold hidden sm:inline ${step >= s.num ? "text-primary-foreground font-black" : "text-primary-foreground/60"}`}>
                    {lang === "ar" ? s.labelAr : s.labelEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Donation Form Section — Elevated & Overlapping into Green Hero (Half on Green, Half on White, Matching Header Width) */}
      <section className="relative pb-20 sm:pb-28 md:pb-36">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            ref={formTopRef}
            className="-mt-36 sm:-mt-44 md:-mt-52 relative z-20 rounded-3xl bg-card p-4 sm:p-7 md:p-9 lg:p-12 scroll-mt-24 shadow-2xl"
            style={{
              boxShadow: "0 12px 48px -6px rgba(0,0,0,0.28), 0 0 0 1px rgba(203,251,67,0.22)",
              border: "1.5px solid rgba(203,251,67,0.25)",
            }}
          >

            {/* STEP 1: Program Selection, Custom Amounts, Multi-Program Basket, and Donor Information */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <div className="text-center sm:text-start border-b border-border/40 pb-3 sm:pb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-0.5 text-xs font-black text-slate-950 shadow-2xs mb-1">
                    {lang === "ar" ? "الخطوة الأولى" : "Step 1"}
                  </span>
                  <h2 tabIndex={-1} className="text-lg sm:text-xl font-black text-primary md:text-2xl outline-none">
                    {lang === "ar" ? "1. اختيار البرنامج ومبلغ التبرع" : "1. Choose Program & Donation Amount"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lang === "ar"
                      ? "اختر البرنامج وحدد المبلغ الذي يناسبك، أو أضف أكثر من برنامج لتوزيع تبرعك"
                      : "Choose a program, set your amount, or add multiple programs to distribute your donation"}
                  </p>
                </div>

                {pageCase && (() => {
                  const f = caseFunding(pageCase);
                  const loc = "en-US"; // the site writes amounts in Latin digits
                  const inBasket = !!activeCase;
                  return (
                    <div className="rounded-2xl border border-accent/30 bg-gradient-to-l from-accent/[0.07] to-transparent p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {pageCase.cover_image_url && (
                          <img src={pageCase.cover_image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" loading="lazy" decoding="async" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-extrabold text-accent">
                            <Heart className="h-3.5 w-3.5" />
                            {lang === "ar" ? "تبرعك لحالة محددة" : "Donating to a specific case"}
                            <span className="font-mono text-[10.5px] font-bold text-muted-foreground" dir="ltr">#{pageCase.ref_code}</span>
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm font-black leading-6 text-primary sm:text-base">{pageCase.title}</p>
                          {(pageCase.program_name || pageCase.project_name || pageCase.donation_campaign_name) && (
                            <p className="text-[11px] font-bold text-muted-foreground">
                              {lang === "ar" ? "ضمن: " : "Part of: "}{pageCase.program_name || pageCase.project_name || pageCase.donation_campaign_name}
                            </p>
                          )}
                        </div>
                        <Link to={`/cases/${pageCase.ref_code}`} className="hidden shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-primary transition hover:border-secondary sm:inline-flex">
                          {lang === "ar" ? "تفاصيل الحالة" : "Case details"}
                        </Link>
                      </div>
                      {f.need > 0 && (
                        <div className="mt-3">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-secondary" style={{ width: `${f.pct}%` }} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-bold text-muted-foreground">
                            <span>
                              {lang === "ar"
                                ? `اتجمع ${f.raised.toLocaleString(loc)} من ${f.need.toLocaleString(loc)} ج (${f.pct}%)`
                                : `${f.raised.toLocaleString(loc)} of ${f.need.toLocaleString(loc)} EGP (${f.pct}%)`}
                            </span>
                            {f.done ? (
                              <span className="font-black text-secondary">{lang === "ar" ? "الحالة اكتملت، الحمد لله — تقدر تتبرع لحالة تانية" : "Fully funded — pick another case"}</span>
                            ) : (
                              <span className="font-black text-accent">
                                {lang === "ar" ? `فاضل ${f.remaining.toLocaleString(loc)} ج` : `${f.remaining.toLocaleString(loc)} EGP left`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {!f.done && !inBasket && (
                        <p className="mt-2 text-[11px] font-bold text-muted-foreground">
                          {lang === "ar" ? "غيّرت بند التبرع، فالتبرع مش هيروح للحالة دي." : "You changed the item, so this case won't receive this donation."}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Programs, Projects, Campaigns, Shares & Cases Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black text-primary block">
                      {lang === "ar" ? "بنود التبرع والأسهم المحددة *" : "Donation Entities & Shares *"}
                    </label>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {lang === "ar" ? `(${items.length} من ${MAX_BASKET_ITEMS} بنود كحد أقصى)` : `(${items.length} of ${MAX_BASKET_ITEMS} items max)`}
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {items.map((it, idx) => (
                      <DonationEntityItem
                        key={it.id}
                        item={it}
                        index={idx}
                        totalItems={items.length}
                        error={fieldErrors[`amount_${it.id}`]}
                        lang={lang}
                        entities={DONATION_ENTITIES}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>

                  {/* Add Entity Button & Live Total Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      disabled={items.length >= MAX_BASKET_ITEMS}
                      className="h-10 px-4 rounded-xl border-2 border-dashed border-primary/25 hover:border-secondary hover:bg-secondary/10 text-primary font-black text-xs cursor-pointer shadow-xs transition-all w-full sm:w-auto flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-slate-950 font-black text-xs">
                        +
                      </div>
                      <span>
                        {items.length >= MAX_BASKET_ITEMS
                          ? (lang === "ar" ? `اكتملت السلة (${MAX_BASKET_ITEMS} بنود كحد أقصى)` : `Basket full (${MAX_BASKET_ITEMS} items max)`)
                          : (lang === "ar" ? "إضافة برنامج أو مشروع آخر للتبرع" : "Add Another Entity")}
                      </span>
                    </Button>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 px-3.5 py-2 rounded-xl bg-muted/40 border border-border/70 shadow-xs">
                      <span className="text-xs font-bold text-muted-foreground">
                        {lang === "ar" ? "إجمالي التبرع:" : "Total Amount:"}
                      </span>
                      <span className="inline-block bg-secondary text-slate-950 px-2.5 py-0.5 rounded-lg text-sm sm:text-base font-black shadow-xs">
                        {totalAmount.toLocaleString()} {lang === "ar" ? "ج.م" : "EGP"}
                      </span>
                      {items.length > 1 && (
                        <span className="text-[11px] font-bold text-muted-foreground">
                          ({items.length} {lang === "ar" ? "بنود" : "items"})
                        </span>
                      )}
                    </div>
                  </div>

                  {items.length > 1 && !donationTarget && (
                    <div className="flex items-start gap-2 rounded-xl border border-secondary/40 bg-secondary/[0.07] p-3 text-[11.5px] font-bold leading-6 text-primary">
                      <Layers className="mt-1 h-3.5 w-3.5 shrink-0 text-secondary" />
                      <p>
                        {lang === "ar"
                          ? "سلتك فيها أكتر من بند: هتدفع مرة واحدة، والتوزيع اللي اخترته بيتسجل مع التبرع بالظبط وبيتوزع عليه."
                          : "Several items: you pay once, and your exact split is recorded with the donation."}
                        {items.some((it) => it.donationMode === "case") && (
                          <span className="block text-muted-foreground">
                            {lang === "ar"
                              ? "مبلغ الحالة بيتضاف لعدّادها بعد مراجعة الفريق. لو عاوزه يتحسب عليها فورًا، اتبرع للحالة لوحدها."
                              : "The case's share is added to its counter after review. Donate to the case alone for an instant update."}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {fieldErrors.amount && (
                    <p role="alert" className="text-xs font-bold text-destructive text-start">
                      {fieldErrors.amount}
                    </p>
                  )}
                </div>


                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4.5 text-start space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-xs sm:text-sm font-black text-primary truncate">
                        {lang === "ar" ? "بيانات المتبرع" : "Donor Information"}
                      </h3>
                      <span className="text-[10.5px] text-muted-foreground hidden sm:inline">
                        {lang === "ar" ? "(لاستخراج الإيصال والتواصل)" : "(For receipt & confirmation)"}
                      </span>
                    </div>
                    {user ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black bg-secondary text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                        {lang === "ar" ? "مسجل الدخول ✓" : "Logged In ✓"}
                      </span>
                    ) : (
                      <Link to="/auth/login" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline shrink-0">
                        <LogIn className="h-3 w-3" />
                        {lang === "ar" ? "تسجيل دخول لتتبع تبرعاتك" : "Login to track"}
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                        {lang === "ar" ? "الاسم (اختياري)" : "Name (optional)"}
                      </label>
                      <Input
                        type="text"
                        value={donor.name}
                        aria-invalid={!!fieldErrors.name}
                        onChange={(e) => {
                          setDonor((d) => ({ ...d, name: e.target.value }));
                          if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                        }}
                        placeholder={lang === "ar" ? "سيبه فاضي للتبرع كفاعل خير" : "Leave empty to give anonymously"}
                        className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                        {lang === "ar" ? "رقم الهاتف للتواصل وإشعار التبرع *" : "Phone Number *"}
                      </label>
                      <Input
                        type="tel"
                        dir="ltr"
                        value={donor.phone}
                        aria-invalid={!!fieldErrors.phone}
                        onChange={(e) => {
                          setDonor((d) => ({ ...d, phone: e.target.value }));
                          if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                        }}
                        placeholder="01XXXXXXXXX"
                        className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.phone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                        {lang === "ar" ? "البريد الإلكتروني (اختياري لاستلام الإيصال)" : "Email (Optional for receipt)"}
                      </label>
                      <Input
                        type="email"
                        dir="ltr"
                        value={donor.email}
                        aria-invalid={!!fieldErrors.email}
                        onChange={(e) => {
                          setDonor((d) => ({ ...d, email: e.target.value }));
                          if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                        }}
                        placeholder="name@example.com"
                        className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Card & Next Button - Clean, Balanced Layout */}
                <div className="pt-4 space-y-3 border-t border-border/40">
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden border border-border/80 shrink-0 bg-muted shadow-2xs">
                        {selectedProgram.image ? (
                          <img
                            src={selectedProgram.image}
                            alt={programLabel}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full grid place-items-center bg-secondary text-slate-950 font-black text-xs">
                            {selectedProgram.ar.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 text-start">
                        <p className="text-[11px] font-bold text-muted-foreground truncate">
                          {lang === "ar" ? "البرنامج المختار" : "Selected Program"}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-primary truncate">
                          {programLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-[10.5px] block font-bold text-muted-foreground">
                        {lang === "ar" ? "المبلغ الكلي" : "Total"}
                      </span>
                      <span className="inline-block bg-secondary text-slate-950 px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black shadow-xs">
                        {(totalAmount || 0).toLocaleString()} {lang === "ar" ? "ج.م" : "EGP"}
                      </span>
                    </div>
                  </div>

                {isMarkounInKind ? (
                  /* In-kind: no payment gateway path! Free doorstep delegate pickup */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.05]">
                    <div className="flex items-center gap-2.5 text-start">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/25 grid place-items-center">
                        <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-primary">
                          {lang === "ar" ? "تبرع عيني (حملة مركون) — مسار مستقل بدون بوابة دفع" : "In-Kind (Markoun) — No Payment Gateway"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {lang === "ar" ? "مندوبنا يصل لباب بيتك مجاناً لاستلام الأثاث والأجهزة، وتصدر لك إيصال استلام رسمي." : "Free delegate pickup from your doorstep with official receipt."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={`https://wa.me/201097000137?text=${encodeURIComponent(
                          lang === "ar"
                            ? `السلام عليكم، أريد التبرع عينيًا في حملة مركون.\nالاسم: ${donor.name || "..."}\nالهاتف: ${donor.phone || "..."}`
                            : `Hello, I want to donate in-kind to Markoun.\nName: ${donor.name || "..."}\nPhone: ${donor.phone || "..."}`
                        )}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm h-11 px-4 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>{lang === "ar" ? "تنسيق عبر واتساب" : "WhatsApp"}</span>
                      </a>
                      <Button
                        type="button"
                        onClick={() => {
                          const errs = validateStep1();
                          setFieldErrors(errs);
                          if (Object.values(errs).some(Boolean)) return;
                          setStep(3);
                        }}
                        className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm hover:opacity-90 cursor-pointer"
                      >
                        {lang === "ar" ? "تأكيد طلب المندوب بالموقع" : "Confirm Online"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      const errs = validateStep1();
                      setFieldErrors(errs);
                      if (Object.values(errs).some(Boolean)) return;
                      setStep(2);
                    }}
                    className="w-full bg-orange-grad px-6 sm:px-9 h-11 sm:h-12 text-accent-foreground shadow-cta hover:opacity-95 rounded-xl font-black text-sm sm:text-base cursor-pointer flex items-center justify-center shrink-0"
                  >
                    {lang === "ar" ? "المتابعة لاختيار طريقة الدفع" : "Continue to Payment"} <Arrow className="h-4 w-4 sm:h-5 sm:w-5 ms-2" />
                  </Button>
                )}

                </div>
              </div>
            )}

            {/* STEP 2: Payment Method Selection & Execution */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-5">
                {/* Header & Mini Summary of Step 1 */}
                <div className="text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-border/40 pb-3 sm:pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-black text-secondary border border-secondary/25 mb-1">
                      {lang === "ar" ? "الخطوة الثانية" : "Step 2"}
                    </span>
                    <h2 tabIndex={-1} className="text-lg sm:text-xl font-black text-primary md:text-2xl outline-none">
                      {lang === "ar" ? "2. طريقة الدفع وإتمام التبرع" : "2. Payment Method & Complete Donation"}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {lang === "ar" ? "اختر وسيلة الدفع الأنسب لك لتأكيد تبرعك" : "Choose your preferred payment method to complete donation"}
                    </p>
                  </div>

                  {/* Step 1 recap pill with Edit button on same row */}
                  <div className="flex items-center justify-between gap-2.5 rounded-xl border border-secondary/25 bg-secondary/[0.07] px-3 py-1.5 text-xs font-bold text-primary w-full sm:w-auto shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg overflow-hidden border border-border/70 shrink-0 bg-muted">
                        {selectedProgram.image ? (
                          <img
                            src={selectedProgram.image}
                            alt={programLabel}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 text-start truncate">
                        <span className="font-black text-primary text-xs truncate">{programLabel}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-secondary font-black text-xs whitespace-nowrap">
                          {totalAmount.toLocaleString()} {lang === "ar" ? "ج.م" : "EGP"}
                        </span>
                        {donor.name && (
                          <>
                            <span className="hidden sm:inline text-muted-foreground/40">•</span>
                            <span className="hidden sm:inline text-[11px] text-muted-foreground truncate font-normal">
                              ({donor.name})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-black text-xs cursor-pointer shrink-0 ms-2 px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/25 transition-all shadow-2xs"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>{lang === "ar" ? "تعديل" : "Edit"}</span>
                    </button>
                  </div>
                </div>

                {/* Payment Methods - Modern Gateway Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs sm:text-sm font-black text-primary">
                      {lang === "ar" ? "طريقة الدفع" : "Payment Method"}
                    </h3>
                    <span className="text-[10.5px] sm:text-[11px] font-bold text-muted-foreground">
                      {lang === "ar" ? "اختر الطريقة الأنسب لك" : "Choose preferred method"}
                    </span>
                  </div>

                  {/* Payment Methods — responsive grid matching header width */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
                    {availableMethods.map((m, idx) => {
                      const isSelected = method === m.id;
                      // Last item in odd-total list gets full width on 2-col layout only
                      const isLast = idx === availableMethods.length - 1;
                      const oddTotal = availableMethods.length % 2 !== 0;
                      const fullWidth = isLast && oddTotal;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`group relative flex items-center gap-2 rounded-2xl border-2 p-2.5 text-start transition-all duration-200 cursor-pointer outline-none select-none ${
                            fullWidth ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
                          } ${
                            isSelected
                              ? "border-secondary bg-secondary/[0.08] shadow-xs ring-2 ring-secondary/20"
                              : "border-border/70 bg-card hover:border-secondary/40 hover:bg-muted/30"
                          }`}
                        >
                          {/* Radio Checkmark Circle */}
                          <div
                            className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border-2 transition-all ${
                              isSelected
                                ? "border-secondary bg-secondary text-slate-950 shadow-xs"
                                : "border-muted-foreground/35 bg-card group-hover:border-secondary/60"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3] text-slate-950" />}
                          </div>

                          {/* Standardized Logo Box */}
                          <div className="flex h-8 min-w-[48px] px-1.5 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-card border border-border/80 shadow-2xs overflow-hidden">
                            <PaymentBrandIcon methodKey={m.destinations?.[0]?.bankCode ? `bank_${m.destinations[0].bankCode}` : m.id} className="h-5 w-auto max-w-full object-contain" />
                          </div>

                          {/* Title & Concise Subtitle */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] sm:text-xs font-black text-primary truncate block leading-tight">
                              {lang === "ar" ? m.ar : m.en}
                            </span>
                            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground truncate mt-0.5 font-medium">
                              {lang === "ar" ? m.subtitleAr : m.subtitleEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Method Details Panel */}
                <div className="rounded-2xl border border-secondary/25 bg-secondary/[0.04] p-3 sm:p-4.5 animate-fade-in text-start space-y-3">
                  {/* Panel Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="flex h-10 sm:h-11 min-w-[60px] sm:min-w-[70px] px-2 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-card border border-border/80 shadow-2xs overflow-hidden">
                        <PaymentBrandIcon methodKey={selectedMethod.destinations?.[0]?.bankCode ? `bank_${selectedMethod.destinations[0].bankCode}` : selectedMethod.id} className="h-6 sm:h-7 w-auto max-w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-primary truncate">
                            {lang === "ar" ? selectedMethod.ar : selectedMethod.en}
                          </h4>
                          {selectedMethod.badge && (
                            <span className={`hidden sm:inline-block rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold ${
                              badgeClasses[selectedMethod.badge.color] || "bg-muted text-muted-foreground"
                            }`}>
                              {lang === "ar" ? selectedMethod.badge.ar : selectedMethod.badge.en}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {lang === "ar" ? selectedMethod.instructions_ar : selectedMethod.instructions_en}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] sm:text-[11px] font-black text-slate-950 px-2.5 py-0.5 rounded-full bg-secondary shadow-2xs">
                      {lang === "ar" ? "طريقة الدفع المختارة" : "Selected"}
                    </span>
                  </div>

                  {/* Where to send the money — every destination set in the dashboard, each with Copy */}
                  {(selectedMethod.destinations?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      {selectedMethod.destinations!.map((d) => (
                        <div key={d.value} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-card border border-border/80 p-2.5 sm:p-3 shadow-2xs">
                          <div className="min-w-0 flex items-center gap-2.5">
                            {d.bankCode && <PaymentBrandIcon methodKey={`bank_${d.bankCode}`} className="h-6 w-auto shrink-0" />}
                            <div className="min-w-0">
                              {d.bankName && <div className="text-xs font-black text-primary">{d.bankName}{d.accountName ? ` — ${d.accountName}` : ""}</div>}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{lang === "ar" ? d.labelAr : d.labelEn}:</span>
                                <span className="font-mono text-base sm:text-lg font-black text-primary select-all tracking-wider" dir="ltr">{d.value}</span>
                              </div>
                              {(d.iban || d.swift) && (
                                <div className="mt-0.5 text-[11px] font-mono text-muted-foreground" dir="ltr">
                                  {d.iban && <>IBAN: {d.iban} </>}{d.swift && <>· SWIFT: {d.swift}</>}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => copy(d.value)}
                            className="h-7.5 sm:h-8 px-3 text-xs font-black text-slate-950 bg-secondary hover:bg-secondary/80 transition-all rounded-lg shrink-0 w-fit self-end sm:self-auto cursor-pointer shadow-2xs"
                          >
                            <Copy className="h-3.5 w-3.5 me-1.5 text-slate-950" />
                            {lang === "ar" ? "نسخ" : "Copy"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inputs & Receipt Upload */}
                  {(isBank || isVodafoneWallet || isInstapay) && (
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-start">
                        {/* Column 1: Method-specific reference or phone input */}
                        <div>
                          {isBank && (
                            <>
                              <label className="block text-xs font-bold text-muted-foreground mb-1">
                                {lang === "ar" ? "رقم مرجع الحوالة البنكية (إن وجد)" : "Bank transfer reference number (if available)"}
                              </label>
                              <Input
                                type="text"
                                dir="ltr"
                                value={methodFields.bankRef}
                                onChange={(e) => setMethodFields((f) => ({ ...f, bankRef: e.target.value }))}
                                placeholder="Ref / Transaction #"
                                className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold w-full focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                              />
                            </>
                          )}

                          {isVodafoneWallet && (
                            <>
                              <label className="block text-xs font-bold text-muted-foreground mb-1">
                                {lang === "ar" ? "رقم محفظتك المحول منها (اختياري - لتأكيد أسرع)" : "Your sending wallet number (optional)"}
                              </label>
                              <Input
                                type="tel"
                                dir="ltr"
                                value={methodFields.vodafonePhone}
                                aria-invalid={!!fieldErrors.vodafonePhone}
                                onChange={(e) => {
                                  setMethodFields((f) => ({ ...f, vodafonePhone: e.target.value }));
                                  if (fieldErrors.vodafonePhone) setFieldErrors((p) => ({ ...p, vodafonePhone: "" }));
                                }}
                                placeholder="01XXXXXXXXX"
                                className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold w-full focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                              />
                              {fieldErrors.vodafonePhone && (
                                <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.vodafonePhone}</p>
                              )}
                            </>
                          )}

                          {isInstapay && (
                            <>
                              <label className="block text-xs font-bold text-muted-foreground mb-1">
                                {lang === "ar" ? "معرّف InstaPay الخاص بك (اختياري)" : "Your InstaPay IPA (optional)"}
                              </label>
                              <Input
                                type="text"
                                dir="ltr"
                                value={methodFields.instapayHandle}
                                aria-invalid={!!fieldErrors.instapayHandle}
                                onChange={(e) => {
                                  setMethodFields((f) => ({ ...f, instapayHandle: e.target.value }));
                                  if (fieldErrors.instapayHandle) setFieldErrors((p) => ({ ...p, instapayHandle: "" }));
                                }}
                                placeholder="yourname@bank"
                                className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold w-full focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                              />
                              {fieldErrors.instapayHandle && (
                                <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.instapayHandle}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Column 2: Receipt Upload Box matching the input height */}
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">
                            {lang === "ar" ? "إرفاق إيصال التحويل (اختياري، يسرع التوثيق)" : "Attach transfer receipt (optional)"}
                          </label>
                          <label className={`flex h-10 sm:h-10.5 cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed px-3 text-xs font-bold transition ${
                            receiptFilename
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-border/90 bg-card text-muted-foreground hover:border-secondary hover:text-primary"
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 truncate">
                              {receiptFilename ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                              ) : (
                                <Upload className="h-4 w-4 shrink-0 text-secondary" />
                              )}
                              <span className="truncate">
                                {receiptFilename || (lang === "ar" ? "اختر صورة الإيصال" : "Choose receipt image")}
                              </span>
                            </div>
                            <span className="shrink-0 text-[10.5px] font-black px-2 py-0.5 rounded-md bg-secondary text-slate-950 shadow-2xs">
                              {receiptFilename ? (lang === "ar" ? "تغيير" : "Change") : (lang === "ar" ? "رفع" : "Upload")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onReceiptUpload(e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Reassurance note filling the bottom cohesively */}
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-medium text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
                        <span>
                          {lang === "ar"
                            ? "يتم مراجعة إشعار التحويل وتأكيد التبرع وإرسال إيصال رسمي معتمد فور التحقق."
                            : "Transfer notification is verified and an official receipt is issued upon verification."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Gateway details (Kashier or Paymob) */}
                  {isGateway && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border/70 p-2.5 sm:p-3">
                          <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
                          <div>
                            <p className="text-xs font-black text-primary">{lang === "ar" ? "حماية ثلاثية الأبعاد" : "3D Secure"}</p>
                            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground">{lang === "ar" ? "دفع بنكي مشفّر 100%" : "Encrypted payment"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border/70 p-2.5 sm:p-3">
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
                          <div>
                            <p className="text-xs font-black text-primary">
                              {lang === "ar" ? "كاشير (Kashier)" : "Kashier Egypt"}
                            </p>
                            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground">{lang === "ar" ? "فيزا / ماستركارد / ميزة" : "Cards Accepted"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border/70 p-2.5 sm:p-3">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
                          <div>
                            <p className="text-xs font-black text-primary">{lang === "ar" ? "إيصال فوري معتمد" : "Instant Receipt"}</p>
                            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground">{lang === "ar" ? "يصدر فور نجاح العملية" : "Upon success"}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {lang === "ar"
                          ? "عند الضغط على «المتابعة للدفع»، ستفتح نافذة الدفع المشفرة المعتمدة لبوابة كاشير (Kashier 3D-Secure) لإتمام التبرع بأمان تام بواسطة بطاقتك البنكية أو المحافظ الإلكترونية."
                          : "Clicking «Pay» will open Kashier 3D-Secure encrypted modal to complete your donation safely."}
                      </p>
                    </div>
                  )}

                  {/* Delegate Pickup details */}
                  {isDelegatePickup && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">
                            {lang === "ar" ? "المدينة / المحافظة *" : "City / Governorate *"}
                          </label>
                          <Input
                            type="text"
                            value={methodFields.pickupCity}
                            aria-invalid={!!fieldErrors.pickupCity}
                            onChange={(e) => {
                              setMethodFields((f) => ({ ...f, pickupCity: e.target.value }));
                              if (fieldErrors.pickupCity) setFieldErrors((p) => ({ ...p, pickupCity: "" }));
                            }}
                            placeholder={lang === "ar" ? "مثال: القاهرة - المعادي" : "e.g. Cairo - Maadi"}
                            className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                          />
                          {fieldErrors.pickupCity && (
                            <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.pickupCity}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-1">
                            {lang === "ar" ? "الوقت المفضل للاستلام" : "Preferred Pickup Time"}
                          </label>
                          <Input
                            type="text"
                            value={methodFields.pickupTime}
                            onChange={(e) => setMethodFields((f) => ({ ...f, pickupTime: e.target.value }))}
                            placeholder={lang === "ar" ? "صباحاً / مساءً" : "Morning / Evening"}
                            className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">
                          {lang === "ar" ? "العنوان التفصيلي *" : "Detailed Address *"}
                        </label>
                        <Input
                          type="text"
                          value={methodFields.pickupAddress}
                          aria-invalid={!!fieldErrors.pickupAddress}
                          onChange={(e) => {
                            setMethodFields((f) => ({ ...f, pickupAddress: e.target.value }));
                            if (fieldErrors.pickupAddress) setFieldErrors((p) => ({ ...p, pickupAddress: "" }));
                          }}
                          placeholder={lang === "ar" ? "الشارع، رقم العمارة، الشقة، علامة مميزة" : "Street, building number, apartment, landmark"}
                          className="h-10 sm:h-10.5 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-bold focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        />
                        {fieldErrors.pickupAddress && (
                          <p className="mt-1 text-xs font-bold text-destructive">{fieldErrors.pickupAddress}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-medium text-muted-foreground">
                        <Truck className="h-4 w-4 text-secondary shrink-0" />
                        <span>
                          {lang === "ar"
                            ? "خدمة الاستلام المنزلي مجانية بالكامل، وسيقوم مندوبنا بتسليمك إيصال رسمي معتمد عند الاستلام."
                            : "Home pickup is completely free, and our delegate will provide an official receipt."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Summary if any */}
                {Object.values(fieldErrors).some(Boolean) && (
                  <div
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 sm:p-4 text-xs font-bold text-destructive outline-none"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{lang === "ar" ? "يرجى تصحيح الأخطاء التالية للمتابعة:" : "Please correct the following errors to continue:"}</p>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {Object.entries(fieldErrors).filter(([, v]) => !!v).map(([k, v]) => (
                          <li key={k}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons: 2 in a row on mobile */}
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-between pt-3.5 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-11 sm:h-12 w-full sm:w-auto rounded-xl font-bold border-border/80 text-muted-foreground hover:text-primary hover:bg-muted/40 order-1 cursor-pointer"
                  >
                    <Back className="h-4 w-4 me-1.5" />
                    {lang === "ar" ? "رجوع" : "Back"}
                  </Button>

                  <Button
                    type="button"
                    disabled={processing}
                    onClick={async () => {
                      const errs = validateStep2();
                      setFieldErrors(errs);
                      if (Object.values(errs).some(Boolean)) return;

                      if (isGateway) {
                        setProcessing(true);
                        try {
                          const orderId = `YSR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                          // Throws the server's message (e.g. a target that no longer accepts donations).
                          const res: any = await createDonation({
                              target: donationTarget,
                              amount: Number(totalAmount),
                              donor_name: donor.name,
                              donor_email: donor.email || undefined,
                              donor_phone: donor.phone,
                              payment_method: "kashier",
                              payment_status: "pending",
                              message: [
                                caseTitle ? `Case: ${caseTitle}` : "",
                                `Entities: ${itemsBreakdownText}`,
                              ].filter(Boolean).join(" | "),
                              idempotency_key: idemKey.current,
                            });
                          const sessionUrl: string | undefined = res?.payment?.session_url;
                          const realOrderId = res?.donation?.transaction_reference || res?.ref_code || orderId;
                          // No session = no checkout: opening one here would create a second, untargeted donation.
                          if (!sessionUrl) throw new Error(lang === "ar" ? "تعذر فتح بوابة الدفع، حاول مرة أخرى." : "Could not open the payment page, please try again.");

                          void trackAdEvent("donation_started", { donationAmount: Number(totalAmount) });
                          setKashierOrderId(realOrderId);
                          setKashierSessionUrl(sessionUrl);
                          setIsKashierModalOpen(true);
                          setProcessing(false);
                          return;
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: lang === "ar" ? "تعذر فتح بوابة الدفع" : "Payment gateway error",
                            description: err?.message || (lang === "ar" ? "يرجى تجربة وسيلة دفع أخرى أو المحاولة لاحقاً" : "Please try another method"),
                          });
                        } finally {
                          setProcessing(false);
                        }
                        return;
                      }

                      setStep(3);
                    }}
                    className="h-11 sm:h-12 w-full sm:w-auto bg-orange-grad px-3 sm:px-8 text-accent-foreground shadow-cta hover:opacity-95 rounded-xl font-black text-xs sm:text-sm cursor-pointer order-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                        {lang === "ar" ? "جاري المعالجة..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        {isGateway
                          ? (lang === "ar" ? "المتابعة للدفع بالبطاقة" : "Pay with Card")
                          : isDelegatePickup
                          ? (lang === "ar" ? "تأكيد طلب استلام المندوب" : "Confirm Pickup")
                          : (lang === "ar" ? "تأكيد إرسال التبرع" : "Confirm Donation")}
                        <Heart className="h-4 w-4 ms-1.5" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                  {lang === "ar" ? "بإتمام التبرع أنت توافق على " : "By donating you agree to our "}
                  <Link to="/terms#donations" target="_blank" className="font-bold text-primary underline underline-offset-2 hover:text-accent">
                    {lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
                  </Link>
                  {lang === "ar" ? " و" : " and "}
                  <Link to="/privacy" target="_blank" className="font-bold text-primary underline underline-offset-2 hover:text-accent">
                    {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="text-center py-4">
                {processing ? (
                  <div className="py-12">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-secondary" />
                    <p className="mt-4 text-base sm:text-lg font-bold text-primary">
                      {lang === "ar" ? "جاري تسجيل التبرع..." : "Recording donation..."}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Central Phosphor Checkmark Circle */}
                    <div className="relative mx-auto my-6 w-fit">
                      <div className="relative mx-auto grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full bg-secondary text-slate-950 shadow-cta ring-4 ring-secondary/30">
                        <CheckCircle2 className="h-11 w-11 sm:h-12 sm:w-12 text-slate-950 stroke-[2.5]" />
                      </div>
                    </div>

                    <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-black text-primary md:text-3xl">
                      {lang === "ar" ? "جزاك الله خيراً!" : "May God reward you!"}
                    </h2>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto font-medium">
                      {lang === "ar"
                        ? "تم تسجيل طلب تبرعك بنجاح. سنقوم بتأكيد الاستلام والتواصل معك عبر الواتساب."
                        : "Your donation has been recorded. We will confirm receipt and reach out via WhatsApp."}
                    </p>

                    {/* Dua Message */}
                    <div className="mt-3.5 inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary/15 border border-secondary/35 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-900 dark:text-secondary shadow-xs">
                      <span>
                        {lang === "ar"
                          ? "تقبل الله تبرعاتكم.. صدقة مباركة وأجرٌ دائم بإذن الله 💚 🤲"
                          : "May Allah accept your donations.. A blessed continuous charity 💚 🤲"}
                      </span>
                    </div>

                    {record && (
                      <div className="mx-auto mt-5 sm:mt-6 w-full max-w-md rounded-2xl border-2 border-secondary/40 bg-secondary/[0.05] p-3.5 sm:p-4 shadow-2xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {lang === "ar" ? "رقم مرجع التبرع" : "Transaction Reference"}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-2">
                          <span dir="ltr" className="text-lg sm:text-xl font-black text-primary md:text-2xl font-mono">
                            {record.ref}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(record.ref)}
                            className="bg-secondary text-slate-950 hover:bg-secondary/80 p-1.5 rounded-lg shadow-2xs cursor-pointer transition-all"
                            title={lang === "ar" ? "نسخ" : "Copy"}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 text-xs font-extrabold text-muted-foreground flex items-center justify-center gap-1.5">
                          <span>{lang === "ar" ? "الحالة:" : "Status:"}</span>
                          <span className="rounded-full px-2.5 py-0.5 bg-secondary text-slate-950 font-black text-xs shadow-2xs">
                            {record.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {record && (
                      <div className="mt-5 sm:mt-6 text-start">
                        <DonationReceipt d={record} />
                      </div>
                    )}

                    <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
                      {/* الصف الأول: تتبع التبرع + تأكيد عبر واتساب معاً في نفس الصف حتى في الهواتف */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
                        {record && (
                          <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 rounded-xl h-11 sm:h-12 px-2 sm:px-4 text-[11px] sm:text-sm font-bold w-full justify-center">
                            <Link to={`/donate/track/${record.ref}`} className="truncate flex items-center justify-center">
                              <ReceiptIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1 shrink-0" />
                              <span className="truncate">{lang === "ar" ? "تتبع التبرع" : "Track Donation"}</span>
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="lg" variant="outline" className="rounded-xl h-11 sm:h-12 px-2 sm:px-4 text-[11px] sm:text-sm font-bold w-full justify-center border-border/80 bg-card hover:bg-muted">
                          <a
                            href={`https://wa.me/201097000137?text=${encodeURIComponent(
                              lang === "ar"
                                ? `السلام عليكم، قمت بتسجيل تبرع لدى مؤسسة اليسر.\nرقم التبرع: ${record?.ref ?? ""}\nالمبلغ: ${totalAmount} ج.م\nالبرامج: ${itemsBreakdownText}\nطريقة الدفع: ${selectedMethod.ar}\nبرجاء التأكيد.`
                                : `Hello, I submitted a donation to Al-Yusr.\nRef: ${record?.ref ?? ""}\nAmount: ${totalAmount} EGP\nPrograms: ${itemsBreakdownText}\nMethod: ${selectedMethod.en}\nPlease confirm.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate flex items-center justify-center"
                          >
                            <span className="truncate">{lang === "ar" ? "تأكيد عبر واتساب" : "Confirm via WhatsApp"}</span>
                          </a>
                        </Button>
                      </div>

                      {/* الصف الثاني: زر العودة للرئيسية منفرد تحت الزرين */}
                      <Button asChild size="lg" variant="ghost" className="rounded-xl h-10 sm:h-11 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground w-full sm:w-auto px-8">
                        <Link to="/">{lang === "ar" ? "العودة للرئيسية" : "Back to Home"}</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact, Sleek Micro Trust Badges */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur-xs border border-border/70 shadow-2xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
              <span>{t.donate.secure}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur-xs border border-border/70 shadow-2xs text-slate-700 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5 text-secondary shrink-0" />
              <span>{t.donate.paymentSecure}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Paymob Unified Checkout Modal */}
      <PaymobCheckoutModal
        isOpen={isPaymobModalOpen}
        clientSecret={paymobClientSecret}
        amount={totalAmount}
        onClose={() => {
          setIsPaymobModalOpen(false);
          setStep(3);
        }}
      />

      {/* Kashier Unified Checkout Modal */}
      <KashierCheckoutModal
        isOpen={isKashierModalOpen}
        amount={Number(totalAmount)}
        orderId={kashierOrderId}
        sessionUrl={kashierSessionUrl}
        donorName={donor.name}
        donorEmail={donor.email}
        donorPhone={donor.phone}
        caseId={donationTarget?.kind === "case" ? String(donationTarget.id) : null}
        message={[
          caseTitle ? `Case: ${caseTitle}` : "",
          `Entities: ${itemsBreakdownText}`,
        ].filter(Boolean).join(" | ")}
        onClose={() => {
          setIsKashierModalOpen(false);
        }}
        onSuccess={(verifiedRef) => {
          // Reached only after the backend confirmed the payment as paid.
          setIsKashierModalOpen(false);
          const finalRef = verifiedRef || kashierOrderId;
          const receiptItems = items.map(receiptLine);
          const singleCase = items.length === 1 ? caseOfItem(items[0]) : null;
          const firstEnt = items.length === 1 ? DONATION_ENTITIES.find((e) => e.id === items[0].entityId) : null;
          const targetType = singleCase
            ? (lang === "ar" ? "حالة إنسانية" : "Case")
            : firstEnt
            ? (firstEnt.entityType === "project" ? (lang === "ar" ? "مشروع تنموي" : "Project") : firstEnt.entityType === "campaign" ? (lang === "ar" ? "حملة إغاثية" : "Campaign") : (lang === "ar" ? "برنامج خيري" : "Program"))
            : (items.length > 1 ? (lang === "ar" ? "برامج ومشاريع متعددة" : "Multiple Programs") : (lang === "ar" ? "برنامج خيري" : "Program"));

          const created: DonationRecord = {
            ref: finalRef,
            donor: { ...donor, name: donor.name.trim() || (lang === "ar" ? "فاعل خير" : "Anonymous donor") },
            amount: totalAmount,
            program: items.length === 1 ? items[0].entityId : "multiple",
            programLabel,
            method: "kashier",
            status: "completed",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: receiptItems,
            notes: itemsBreakdownText || undefined,
            targetType,
          };
          donationsStore.create(created);
          setRecord(created);
          setStep(3);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </PageLayout>
  );
};

export default DonatePage;
