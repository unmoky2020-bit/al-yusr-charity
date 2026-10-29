import { useEffect, useRef, useState } from "react";
import {
  listDonationNodeChildren, getDonationNodeBySlug, getDonationNodeById, hasActiveChildren,
} from "@/data/api/publicDonationNodesApi";
import { useLang } from "@/i18n/LangContext";
import { ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatNumberEN } from "@/lib/utils";

export type DonationNode = {
  id: string;
  parent_id: string | null;
  type: "program" | "project" | "campaign" | "option" | "sector";
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  amount: number | null;
  target_amount: number | null;
  collected_amount: number;
  active: boolean;
  direct_checkout: boolean;
  sort_order: number;
};

/**
 * Static root sectors shown when the donation tree is not available from the API
 * (content source "static", API error or empty response) — same list as before.
 */
const STATIC_ROOT_NODES: DonationNode[] = [
  { id: "sec-food", parent_id: null, type: "sector", slug: "sector-food", title_ar: "الإطعام والكراتين الغذائية", title_en: "Food & Meals", description_ar: "كرتونة عزومة ووجبات مطبخ اليسر الساخنة", description_en: "Food boxes and hot meals", image_url: null, amount: 250, target_amount: 100000, collected_amount: 45000, active: true, direct_checkout: false, sort_order: 1 },
  { id: "sec-water", parent_id: null, type: "sector", slug: "sector-water", title_ar: "سقيا الماء والوصلات", title_en: "Clean Water", description_ar: "توصيل خطوط مياه نقية للبيوت المحرومة", description_en: "Clean water connections", image_url: null, amount: 3500, target_amount: 50000, collected_amount: 25000, active: true, direct_checkout: false, sort_order: 2 },
  { id: "sec-health", parent_id: null, type: "sector", slug: "sector-health", title_ar: "العلاج والعمليات الجراحية", title_en: "Health & Medicine", description_ar: "علاج شهري وجراحات عاجلة للمرضى", description_en: "Medical treatments and surgeries", image_url: null, amount: 500, target_amount: 75000, collected_amount: 30000, active: true, direct_checkout: false, sort_order: 3 },
  { id: "sec-orphans", parent_id: null, type: "sector", slug: "sector-orphans", title_ar: "كفالة الأيتام وتيسير الزواج", title_en: "Orphans & Brides", description_ar: "كفالة شهرية وتجهيز يتيمات بالدقهلية", description_en: "Orphan sponsorships and brides", image_url: null, amount: 600, target_amount: 90000, collected_amount: 40000, active: true, direct_checkout: false, sort_order: 4 },
  { id: "sec-zakat", parent_id: null, type: "sector", slug: "sector-zakat", title_ar: "زكاة المال والصدقات", title_en: "Zakat & Charity", description_ar: "مصارف الزكاة الشرعية الثمانية", description_en: "Zakat distribution", image_url: null, amount: 1000, target_amount: 200000, collected_amount: 120000, active: true, direct_checkout: true, sort_order: 5 },
];

type Props = {
  onLeafSelect: (node: DonationNode, breadcrumb: DonationNode[]) => void;
  selectedSlug?: string;
  /** Sector slug (e.g. `sector-odhya`) to jump the tree to on change. */
  sectorSlug?: string;
};

/**
 * Hierarchical donation picker driven entirely by `donation_nodes` table.
 * Walk: Program → Project → Campaign → Option. When a node has no children
 * (or `direct_checkout=true`) we treat it as a leaf and emit `onLeafSelect`.
 */
export const DonationNodeSelector = ({ onLeafSelect, selectedSlug, sectorSlug }: Props) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [path, setPath] = useState<DonationNode[]>([]); // breadcrumb (excluding current level)
  const [items, setItems] = useState<DonationNode[]>([]);
  const [loading, setLoading] = useState(true);
  // True when the current sector is being auto-skipped (single direct child).
  // We avoid rendering the intermediate list to prevent flashing options the
  // donor doesn't need to choose from (e.g. Zakat sector → zakat program).
  const [autoSkipping, setAutoSkipping] = useState(false);
  // Force the "closed" empty state for Udhiya (booking is closed after Eid).
  const [forceClosed, setForceClosed] = useState(false);

  const currentParent = path[path.length - 1] ?? null;
  // Track which selectedSlug we've already navigated to, so a user who
  // walks back up the tree doesn't get yanked back down on every render.
  const lastJumpedSlug = useRef<string | null>(null);
  const lastJumpedSector = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // Udhiya booking is closed — always show the closed empty state inside
    // the Udhiya sector, regardless of any active children that remain in
    // the database from earlier seasons.
    if (currentParent && (currentParent.slug === "sector-odhya" || currentParent.slug === "odhya")) {
      setItems([]);
      setForceClosed(true);
      setAutoSkipping(false);
      setLoading(false);
      return () => { alive = false; };
    } else {
      setForceClosed(false);
    }
    listDonationNodeChildren(currentParent ? currentParent.id : null).then((data) => {
      if (!alive) return;
      let list: DonationNode[] = data;
      if (list.length === 0) {
        if (!currentParent) {
          list = STATIC_ROOT_NODES;
        } else {
          list = [
            { id: `${currentParent.id}-gen`, parent_id: currentParent.id, type: "program", slug: `${currentParent.slug}-program`, title_ar: currentParent.title_ar, title_en: currentParent.title_en, description_ar: currentParent.description_ar, description_en: currentParent.description_en, image_url: null, amount: currentParent.amount, target_amount: currentParent.target_amount, collected_amount: currentParent.collected_amount, active: true, direct_checkout: true, sort_order: 1 },
          ];
        }
      }
      setItems(list);
      setAutoSkipping(false);
      if (!alive) return;
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [currentParent?.id]);

  // Whenever the parent (hero strip) selects a program by slug, walk the
  // tree down to its parent so the matching leaf is visible + highlighted.
  useEffect(() => {
    if (!selectedSlug || selectedSlug === "general") return;
    if (lastJumpedSlug.current === selectedSlug) return;
    let alive = true;
    (async () => {
      const n: DonationNode | null = await getDonationNodeBySlug(selectedSlug);
      if (!alive || !n) return;
      lastJumpedSlug.current = selectedSlug;
      // Build breadcrumb by walking parent_id up to root.
      const chain: DonationNode[] = [];
      let cursor: DonationNode | null = n;
      // We only need to land on the parent level so the node itself shows
      // in the grid — so drop the leaf and keep its ancestors.
      while (cursor?.parent_id) {
        const p: DonationNode | null = await getDonationNodeById(cursor.parent_id);
        if (!p) break;
        chain.unshift(p);
        cursor = p;
      }
      const hasKids = await hasActiveChildren(n.id);
      if (alive) setPath(hasKids ? [...chain, n] : chain);
    })();
    return () => { alive = false; };
  }, [selectedSlug]);

  // External sector chip (hero strip filter) navigates the tree to that
  // sector so the donor immediately sees its child programs.
  useEffect(() => {
    if (!sectorSlug) return;
    if (lastJumpedSector.current === sectorSlug) return;
    // Zakat sector chip → send the donor straight to the Zakat program page.
    if (sectorSlug === "sector-zakat" || sectorSlug === "zakat") {
      lastJumpedSector.current = sectorSlug;
      navigate("/zakat");
      return;
    }
    let alive = true;
    (async () => {
      // API first; when the tree is not available, jump into the matching static root sector.
      const s: DonationNode | null =
        (await getDonationNodeBySlug(sectorSlug)) ?? STATIC_ROOT_NODES.find((n) => n.slug === sectorSlug) ?? null;
      if (!alive || !s) return;
      lastJumpedSector.current = sectorSlug;
      lastJumpedSlug.current = null; // allow selectedSlug effect to re-evaluate later
      setPath([s]);
    })();
    return () => { alive = false; };
  }, [sectorSlug]);

  const pick = async (node: DonationNode) => {
    // Zakat → always route to the dedicated Zakat program page which hosts
    // the Zakat calculator and explains the 8 sharia channels.
    if (node.slug === "sector-zakat" || node.slug === "zakat") {
      navigate("/zakat");
      return;
    }
    // Udhiya sector → enter it but force the "closed" empty state.
    if (node.slug === "sector-odhya" || node.slug === "odhya") {
      setPath((p) => [...p, node]);
      return;
    }
    // Always show active alternatives first. Some program nodes can be closed
    // for direct checkout while still having valid donation options beneath.
    const hasKids = await hasActiveChildren(node.id);
    if (hasKids) {
      setPath((p) => [...p, node]);
      return;
    }
    // No children → always treat as a leaf donation, regardless of the
    // `direct_checkout` flag. Activities (options) often have it set to
    // false but are still valid endpoints because they have no sub-options.
    onLeafSelect(node, [...path, node]);
  };

  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {currentParent && (currentParent.description_ar || currentParent.description_en) && (
        <div className="mb-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-secondary">
            {currentParent.type === "sector"
              ? (lang === "ar" ? "قطاع" : "Sector")
              : currentParent.type === "program"
              ? (lang === "ar" ? "برنامج" : "Program")
              : (lang === "ar" ? "حملة" : "Campaign")}
          </div>
          <h3 className="mt-1 text-sm font-extrabold text-primary">
            {lang === "ar" ? currentParent.title_ar : currentParent.title_en || currentParent.title_ar}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">
            {lang === "ar" ? currentParent.description_ar : currentParent.description_en}
          </p>
        </div>
      )}

      {path.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1 text-[11px] font-bold text-muted-foreground">
          <button
            onClick={() => setPath([])}
            className="rounded-full bg-muted px-2 py-0.5 hover:text-primary"
          >
            {lang === "ar" ? "كل القطاعات" : "All sectors"}
          </button>
          {path.map((p, i) => (
            <span key={p.id} className="inline-flex items-center gap-1">
              <Chevron className="h-3 w-3" />
              <button
                onClick={() => setPath((arr) => arr.slice(0, i + 1))}
                className="rounded-full bg-muted px-2 py-0.5 text-primary"
              >
                {lang === "ar" ? p.title_ar : p.title_en || p.title_ar}
              </button>
            </span>
          ))}
          <button
            onClick={() => setPath((arr) => arr.slice(0, -1))}
            className="ms-auto rounded-full border border-border bg-card px-2 py-0.5 hover:border-secondary"
          >
            {lang === "ar" ? "السابق" : "Back"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : autoSkipping ? (
        <div className="flex justify-center py-8" data-testid="auto-skipping">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center" data-testid="empty-state">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="h-5 w-5" /></div>
          <div className="text-sm font-extrabold text-primary">
            {currentParent?.slug === "sector-odhya" || currentParent?.slug === "odhya"
              ? (lang === "ar" ? "حجز صك الأضحية مغلق حاليًا" : "Udhiya voucher booking is currently closed")
              : (lang === "ar" ? "لا توجد عناصر متاحة حالياً" : "No items available right now")}
          </div>
          <p className="mt-1 text-[12px] font-bold text-muted-foreground">
            {lang === "ar"
              ? "تقدر تدعم مزرعتنا الوقفية أو برامج محور الغذاء أو التنمية بدلًا منها."
              : "You can support our Waqf Farm, Food or Development programs instead."}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link to="/donate?program=farm" data-testid="suggest-farm" className="rounded-full bg-secondary/20 px-3 py-1 text-[12px] font-extrabold text-primary hover:bg-secondary/30">
              {lang === "ar" ? "مزرعتنا الوقفية" : "Waqf Farm"}
            </Link>
            <Link to="/donate?sector=sector-food" data-testid="suggest-food" className="rounded-full bg-secondary/20 px-3 py-1 text-[12px] font-extrabold text-primary hover:bg-secondary/30">
              {lang === "ar" ? "محور الغذاء" : "Food sector"}
            </Link>
            <Link to="/donate?sector=sector-tanmia" data-testid="suggest-tanmia" className="rounded-full bg-secondary/20 px-3 py-1 text-[12px] font-extrabold text-primary hover:bg-secondary/30">
              {lang === "ar" ? "محور التنمية" : "Development sector"}
            </Link>
          </div>
        </div>
      ) : (() => {
        // Hide DB-level nodes that duplicate the synthetic "general donation"
        // buttons rendered at the top of each level — keeps a single source
        // of truth and avoids confusing the donor with two identical options.
        const isGeneralDuplicate = (n: DonationNode) => {
          const slug = (n.slug || "").toLowerCase();
          const ar = n.title_ar || "";
          const en = (n.title_en || "").toLowerCase();
          // NOTE: do NOT include `full` here — slugs like `qurbani-cow-full`
          // are legitimate fixed-amount options ("full cow" vs share).
          if (/(^|[-_])(general|any|complete|all|whole)([-_]|$)/.test(slug)) return true;
          if (/تبرع\s*عام/.test(ar)) return true;
          if (/أي\s*مبلغ/.test(ar)) return true;
          if (/(دعم|تبرع).*(كامل|كله|بالكامل)/.test(ar)) return true;
          if (/(general donation|any amount|whole (program|campaign)|fund the whole)/.test(en)) return true;
          return false;
        };
        const safeItems = Array.isArray(items) ? items : [];
        const visibleItems = safeItems.filter((n) => {
          // Inside a sector or program, filter out duplicates of the
          // synthetic general-donation buttons.
          if (currentParent && (currentParent.type === "sector" || currentParent.type === "program")) {
            if (isGeneralDuplicate(n)) return false;
          }
          return true;
        });
        return (
        <div className="grid gap-2 sm:grid-cols-2">
          {/* Root level: offer a single "general donation" that lets the donor
              support all sectors with any amount, before drilling into one. */}
          {!currentParent && items.length > 0 && (
            <button
              key="root-general"
              onClick={() =>
                onLeafSelect(
                  {
                    id: "general",
                    parent_id: null,
                    type: "option",
                    slug: "general",
                    title_ar: "تبرع عام (يوزّع على كل القطاعات)",
                    title_en: "General donation (across all sectors)",
                    description_ar: null,
                    description_en: null,
                    image_url: null,
                    amount: null,
                    target_amount: null,
                    collected_amount: 0,
                    active: true,
                    direct_checkout: true,
                    sort_order: -1,
                  },
                  [],
                )
              }
              data-testid="node-root-general"
              className={`rounded-2xl border-2 border-dashed p-3 text-start text-sm transition sm:col-span-2 ${
                selectedSlug === "general"
                  ? "border-secondary bg-secondary/15"
                  : "border-secondary/60 bg-secondary/5 hover:border-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-primary">
                  {lang === "ar" ? "تبرع عام (لكل القطاعات)" : "General donation (across all sectors)"}
                </span>
                <span className="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-black text-primary">
                  {lang === "ar" ? "أي مبلغ" : "Any amount"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-muted-foreground">
                {lang === "ar"
                  ? "ادعمنا بأي مبلغ — يوزَّع حيث الحاجة الأشد بين القطاعات."
                  : "Support us with any amount — routed where the need is greatest."}
              </div>
            </button>
          )}
          {/* Sector level: offer a "general donation to this sector" so the
              donor can support the entire axis (food / health / …) without
              picking a specific program first. */}
          {currentParent && currentParent.type === "sector" && (
            <button
              key={`${currentParent.id}-sector-general`}
              onClick={() => onLeafSelect(currentParent, [...path])}
              data-testid={`node-${currentParent.slug}-general`}
              className={`rounded-2xl border-2 border-dashed p-3 text-start text-sm transition sm:col-span-2 ${
                selectedSlug === currentParent.slug && !path.some((p) => p.slug === currentParent.slug)
                  ? "border-secondary bg-secondary/15"
                  : "border-secondary/60 bg-secondary/5 hover:border-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-primary">
                  {lang === "ar"
                    ? `تبرع عام لقطاع ${currentParent.title_ar}`
                    : `General donation to ${currentParent.title_en || currentParent.title_ar} sector`}
                </span>
                <span className="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-black text-primary">
                  {lang === "ar" ? "أي مبلغ" : "Any amount"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-muted-foreground">
                {lang === "ar"
                  ? "يُوزَّع تبرعك على كل برامج هذا القطاع وأنشطته."
                  : "Your donation is distributed across all programs in this sector."}
              </div>
            </button>
          )}
          {currentParent && currentParent.type === "program" && (
            <button
              key={`${currentParent.id}-general`}
              onClick={() => onLeafSelect(currentParent, [...path])}
              data-testid={`node-${currentParent.slug}-general`}
              className={`rounded-2xl border-2 border-dashed p-3 text-start text-sm transition sm:col-span-2 ${
                selectedSlug === currentParent.slug && !path.some((p) => p.slug === currentParent.slug)
                  ? "border-secondary bg-secondary/15"
                  : "border-secondary/60 bg-secondary/5 hover:border-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-primary">
                  {lang === "ar"
                    ? `تبرع عام للبرنامج (${currentParent.title_ar})`
                    : `General donation to program (${currentParent.title_en || currentParent.title_ar})`}
                </span>
                <span className="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-black text-primary">
                  {lang === "ar" ? "أي مبلغ" : "Any amount"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-muted-foreground">
                {lang === "ar"
                  ? "ادعم البرنامج كله بمبلغ تختاره — يوزّع على كل أنشطته."
                  : "Support the whole program with any amount — distributed across all its activities."}
              </div>
            </button>
          )}
          {/* "Fund the whole program" was removed — it duplicated the
              top synthetic "general donation to program" button. Donors
              who want to cover the full remaining target can enter the
              amount manually in the general donation. */}
          {visibleItems.map((n) => {
            const active = selectedSlug === n.slug;
            const title = lang === "ar" ? n.title_ar : n.title_en || n.title_ar;
            return (
              <button
                key={n.id}
                onClick={() => pick(n)}
                data-testid={`node-${n.slug}`}
                className={`rounded-2xl border-2 p-3 text-start text-sm transition ${
                  active
                    ? "border-secondary bg-secondary/15"
                    : "border-border hover:border-secondary/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-primary">{title}</span>
                      {n.amount ? (
                    <span className="shrink-0 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-black text-primary">
                      {formatNumberEN(n.amount)} EGP
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {n.direct_checkout
                        ? lang === "ar" ? "تبرع مباشر" : "Direct"
                        : lang === "ar" ? "اختيارات" : "Options"}
                    </span>
                  )}
                </div>
                {(n.description_ar || n.description_en) && (
                  <div className="mt-0.5 line-clamp-2 text-[11px] font-bold text-muted-foreground">
                    {lang === "ar" ? n.description_ar : n.description_en}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
};