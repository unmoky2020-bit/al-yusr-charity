import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X, Check, Plus, Minus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDonationEntities } from "@/data/sources/donationEntities";

export type DonationItemState = {
  id: string;
  entityId: string;
  donationMode: "general" | "shares" | "case" | "in_kind";
  amount: number;
  selectedShares: Record<string, number>;
  selectedCaseId?: string | null;
  inKindCategory?: string;
  customNotes?: string;
};

const TYPE_LABEL: Record<string, { ar: string; en: string; dot: string }> = {
  program:  { ar: "برنامج دائم", en: "Program",  dot: "bg-emerald-500" },
  project:  { ar: "مشروع",      en: "Project",  dot: "bg-blue-500" },
  campaign: { ar: "حملة",       en: "Campaign", dot: "bg-orange-500" },
};

interface Props {
  item: DonationItemState;
  index: number;
  totalItems: number;
  error?: string;
  lang: string;
  onUpdate: (updated: DonationItemState) => void;
  onRemove: (id: string) => void;
}

export function DonationEntityItem({
  item, index, totalItems, error, lang, onUpdate, onRemove,
}: Props) {
  const isAR = lang === "ar";
  const { entities } = useDonationEntities();

  // ── Entity Dropdown State ──
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  // We need the trigger button's position to portal the dropdown
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === item.entityId) || entities[0],
    [item.entityId, entities]
  );

  const typeLabel = TYPE_LABEL[selectedEntity.entityType] || TYPE_LABEL.program;
  const hasShares = selectedEntity.shares.length > 0;
  const hasCases  = selectedEntity.cases.length > 0;
  const isMarkoun = !!selectedEntity.isMarkoun;

  // Measure trigger on open
  const openDropdown = useCallback(() => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setDropdownOpen(true);
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        triggerRef.current && triggerRef.current.contains(e.target as Node)
      ) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDropdownOpen(false); };
    const onScroll = () => {
      if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    window.addEventListener("scroll",      onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
      window.removeEventListener("scroll",      onScroll, true);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 60);
    else setQuery("");
  }, [dropdownOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter(
      (e) => e.ar.includes(q) || e.en.toLowerCase().includes(q) || e.taglineAr.includes(q)
    );
  }, [query, entities]);

  // ── Entity Selection ──
  const selectEntity = (id: string) => {
    const next = entities.find((e) => e.id === id) || entities[0];
    const defMode = next.isMarkoun ? "in_kind" : "general";
    onUpdate({
      ...item,
      entityId:      next.id,
      donationMode:  defMode,
      amount:        defMode === "in_kind" ? 0 : (next.priceFrom || 100),
      selectedShares: {},
      selectedCaseId: null,
    });
    setDropdownOpen(false);
  };

  // ── Mode Switching ──
  const setMode = (m: DonationItemState["donationMode"]) => {
    if (m === "in_kind") {
      onUpdate({ ...item, donationMode: "in_kind", amount: 0, selectedShares: {}, selectedCaseId: null });
    } else if (m === "general") {
      onUpdate({ ...item, donationMode: "general", amount: item.amount > 0 ? item.amount : (selectedEntity.priceFrom || 100), selectedShares: {}, selectedCaseId: null });
    } else if (m === "shares") {
      const first = selectedEntity.shares[0];
      onUpdate({ ...item, donationMode: "shares", selectedShares: first ? { [first.id]: 1 } : {}, amount: first?.price ?? (selectedEntity.priceFrom || 100), selectedCaseId: null });
    } else if (m === "case") {
      const first = selectedEntity.cases[0];
      onUpdate({ ...item, donationMode: "case", selectedCaseId: first?.id || null, amount: item.amount > 0 ? item.amount : 250, selectedShares: {} });
    }
  };

  // ── Shares Counter ──
  const updateShareCount = (shareId: string, delta: number) => {
    const prev = item.selectedShares[shareId] || 0;
    const next = Math.max(0, prev + delta);
    const updated = { ...item.selectedShares };
    if (next === 0) delete updated[shareId]; else updated[shareId] = next;
    let total = 0;
    for (const [sId, cnt] of Object.entries(updated)) {
      const s = selectedEntity.shares.find((x) => x.id === sId);
      if (s) total += s.price * cnt;
    }
    onUpdate({ ...item, selectedShares: updated, amount: total > 0 ? total : (selectedEntity.priceFrom || 100) });
  };

  const quickAmounts = [50, 100, 200, 500, 1000].filter((a) => a >= (selectedEntity.priceFrom || 10));

  // ── Portal Dropdown (breaks out of overflow constraints) ──
  const portalDropdown = dropdownOpen && triggerRect ? createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      style={{
        position:  "fixed",
        top:       triggerRect.bottom + 6,
        left:      triggerRect.left,
        width:     triggerRect.width,
        zIndex:    9999,
        maxHeight: "min(400px, 65dvh)",
      }}
      className="rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-card px-3 py-2.5 border-b border-border/50 shrink-0">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAR ? "ابحث عن برنامج أو مشروع أو حملة..." : "Search..."}
          className="w-full bg-transparent text-sm font-bold placeholder:text-muted-foreground/50 outline-none text-primary"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}
            className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted cursor-pointer shrink-0">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isAR ? "لا توجد نتائج" : "No results"}
          </p>
        ) : (
          (["program", "project", "campaign"] as const).map((type) => {
            const group = filtered.filter((e) => e.entityType === type);
            if (!group.length) return null;
            const gl = TYPE_LABEL[type];
            return (
              <div key={type}>
                {/* Group divider */}
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${gl.dot}`} />
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wide">
                    {isAR ? gl.ar : gl.en}
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                {group.map((e) => {
                  const sel = e.id === selectedEntity.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      role="option"
                      aria-selected={sel}
                      onClick={() => selectEntity(e.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-start transition-all cursor-pointer rounded-lg ${
                        sel
                          ? "bg-emerald-950 text-white shadow-sm border-r-4 border-secondary dark:bg-emerald-950"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <div className={`h-9 w-9 shrink-0 rounded-lg overflow-hidden border ${
                        sel ? "border-secondary/50 ring-1 ring-secondary/30" : "border-border/60 bg-muted"
                      }`}>
                        {e.image
                          ? <img src={e.image} alt={e.ar} className="h-full w-full object-cover" loading="lazy" />
                          : <div className="h-full w-full grid place-items-center bg-secondary text-slate-950 text-xs font-black">{e.ar.slice(0, 2)}</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-black truncate leading-tight tracking-wide ${
                          sel ? "text-secondary drop-shadow-[0_0_8px_rgba(190,242,100,0.35)]" : "text-primary"
                        }`}>
                          {isAR ? e.ar : e.en}
                        </p>
                        <p className={`text-[11px] truncate mt-0.5 ${sel ? "text-emerald-100/75" : "text-muted-foreground"}`}>
                          {isAR ? e.taglineAr : e.taglineEn}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold whitespace-nowrap ${sel ? "text-emerald-200" : "text-muted-foreground"}`}>
                          {e.priceFrom ? `${isAR ? "من" : "from"} ${e.priceFrom}` : (isAR ? "مفتوح" : "open")}
                        </span>
                        {sel && <Check className="h-4 w-4 text-secondary stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body
  ) : null;

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="rounded-2xl border border-border/80 bg-card text-start shadow-xs hover:border-secondary/40 transition-colors">

      {/* ── Card Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-slate-950 text-[11px] font-black leading-none select-none">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {totalItems > 1
              ? (isAR ? `البند ${index + 1}` : `Item #${index + 1}`)
              : (isAR ? "اختر وجهة تبرعك" : "Choose donation destination")}
          </span>
        </div>
        {totalItems > 1 && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1 text-destructive/60 hover:text-destructive text-xs font-bold transition cursor-pointer px-2 py-0.5 rounded-lg hover:bg-destructive/8"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAR ? "حذف" : "Remove"}</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-3.5">

        {/* ── Entity Trigger Button ── */}
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-start bg-card cursor-pointer select-none transition-all ${
              dropdownOpen
                ? "border-secondary ring-2 ring-secondary/20"
                : "border-border/80 hover:border-secondary/50"
            }`}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border/70 bg-muted">
                {selectedEntity.image
                  ? <img src={selectedEntity.image} alt={selectedEntity.ar} className="h-full w-full object-cover" loading="lazy" />
                  : <div className="h-full w-full grid place-items-center bg-secondary text-slate-950 text-xs font-black">{selectedEntity.ar.slice(0, 2)}</div>}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-black text-primary leading-tight">
                    {isAR ? selectedEntity.ar : selectedEntity.en}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${typeLabel.dot}`} />
                    {isAR ? typeLabel.ar : typeLabel.en}
                    {isMarkoun && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {isAR ? " · عيني ونقدي" : " · In-Kind"}
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {isAR ? selectedEntity.taglineAr : selectedEntity.taglineEn}
                </p>
              </div>
            </div>
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/60 text-muted-foreground transition-transform duration-150 ${dropdownOpen ? "rotate-180 text-secondary" : ""}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>

          {/* Portal dropdown renders here via createPortal to body */}
          {portalDropdown}
        </div>

        {/* ── Mode Tabs ── */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setMode("general")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
              item.donationMode === "general"
                ? "bg-secondary text-slate-950 border-secondary shadow-xs"
                : "border-border/60 text-muted-foreground hover:border-secondary/50 hover:text-primary bg-card"
            }`}>
            {selectedEntity.id === "general"
              ? (isAR ? "تبرع عام" : "General Donation")
              : (isAR ? `تبرع عام ${selectedEntity.entityType === "project" ? "للمشروع" : "للبرنامج"}` : "General Donation")}
          </button>

          {hasShares && (
            <button type="button" onClick={() => setMode("shares")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                item.donationMode === "shares"
                  ? "bg-secondary text-slate-950 border-secondary shadow-xs"
                  : "border-border/60 text-muted-foreground hover:border-secondary/50 hover:text-primary bg-card"
              }`}>
              {isAR ? `الأسهم والباقات (${selectedEntity.shares.length})` : `Shares (${selectedEntity.shares.length})`}
            </button>
          )}

          {hasCases && (
            <button type="button" onClick={() => setMode("case")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                item.donationMode === "case"
                  ? "bg-secondary text-slate-950 border-secondary shadow-xs"
                  : "border-border/60 text-muted-foreground hover:border-secondary/50 hover:text-primary bg-card"
              }`}>
              {isAR ? `حالات إنسانية (${selectedEntity.cases.length})` : `Cases (${selectedEntity.cases.length})`}
            </button>
          )}

          {isMarkoun && (
            <button type="button" onClick={() => setMode("in_kind")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                item.donationMode === "in_kind"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 bg-card"
              }`}>
              {isAR ? "تبرع عيني (أثاث / أجهزة)" : "In-Kind Donation"}
            </button>
          )}
        </div>

        {/* ══ MODE: General ══ */}
        {item.donationMode === "general" && (
          <div className="space-y-2.5 rounded-xl border border-border/60 bg-muted/15 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAR
                ? "مبلغ مفتوح يوزع على أولويات هذا البرنامج باحتياجاته الأشد إلحاحاً"
                : "Open amount distributed across the most urgent needs"}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="relative w-full sm:w-48">
                <Input
                  type="number" min={10}
                  value={item.amount || ""}
                  onChange={(e) => onUpdate({ ...item, amount: Number(e.target.value) || 0 })}
                  placeholder={isAR ? "اكتب المبلغ" : "Enter amount"}
                  className="h-10 ps-3 pe-14 font-black text-base rounded-xl border-border/70 focus:border-secondary focus:ring-2 focus:ring-secondary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-muted-foreground">
                  {isAR ? "ج.م" : "EGP"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((q) => (
                  <button key={q} type="button" onClick={() => onUpdate({ ...item, amount: q })}
                    className={`h-9 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      item.amount === q
                        ? "bg-secondary text-slate-950 border-secondary"
                        : "border-border/60 text-primary hover:border-secondary/50 bg-card"
                    }`}>
                    {q} {isAR ? "ج" : "EGP"}
                  </button>
                ))}
              </div>
            </div>
            {selectedEntity.priceFrom > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {isAR ? `الحد الأدنى: ${selectedEntity.priceFrom} ج.م` : `Min: ${selectedEntity.priceFrom} EGP`}
              </p>
            )}
          </div>
        )}

        {/* ══ MODE: Shares ══ */}
        {item.donationMode === "shares" && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              {isAR ? "اختر سهماً أو أكثر — المبلغ يتحسب تلقائياً" : "Select one or more shares — total auto-calculates"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedEntity.shares.map((share) => {
                const count = item.selectedShares[share.id] || 0;
                const selected = count > 0;
                return (
                  <div key={share.id}
                    className={`rounded-xl border p-2.5 transition-all ${
                      selected ? "border-secondary bg-secondary/8 ring-1 ring-secondary/25" : "border-border/70 bg-card"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-primary leading-snug">
                          {isAR ? share.nameAr : share.nameEn}
                        </p>
                        {share.descAr && (
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">
                            {isAR ? share.descAr : share.descEn}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-black text-secondary shrink-0 whitespace-nowrap">
                        {share.price.toLocaleString()} {isAR ? "ج" : "EGP"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/30">
                      <span className="text-[10.5px] text-muted-foreground font-bold">
                        {selected
                          ? `${isAR ? "الإجمالي:" : "Subtotal:"} ${(share.price * count).toLocaleString()} ${isAR ? "ج" : "EGP"}`
                          : (isAR ? "لم يُختر بعد" : "Not selected")}
                      </span>
                      {selected ? (
                        <div className="flex items-center gap-1 bg-card border border-border/60 rounded-lg p-0.5">
                          <button type="button" onClick={() => updateShareCount(share.id, -1)}
                            className="grid h-6 w-6 place-items-center rounded-md hover:bg-destructive/10 hover:text-destructive text-primary cursor-pointer transition">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-primary">{count}</span>
                          <button type="button" onClick={() => updateShareCount(share.id, 1)}
                            className="grid h-6 w-6 place-items-center rounded-md bg-secondary text-slate-950 hover:opacity-90 cursor-pointer transition">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => updateShareCount(share.id, 1)}
                          className="h-7 px-3 text-xs font-bold rounded-lg border border-secondary/50 text-secondary hover:bg-secondary hover:text-slate-950 transition cursor-pointer">
                          {isAR ? "+ اختيار" : "+ Select"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(item.selectedShares).length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-secondary/30 bg-secondary/8 px-3 py-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {isAR ? "إجمالي الأسهم:" : "Shares total:"}
                </span>
                <span className="text-sm font-black text-secondary">
                  {item.amount.toLocaleString()} {isAR ? "ج.م" : "EGP"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ══ MODE: Cases ══ */}
        {item.donationMode === "case" && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              {isAR ? "اختر الحالة الإنسانية وحدد مبلغ مساهمتك:" : "Select a case and your contribution:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedEntity.cases.map((cs) => {
                const sel = item.selectedCaseId === cs.id;
                const pct = Math.min(100, Math.round((cs.raisedAmount / cs.neededAmount) * 100));
                return (
                  <div key={cs.id}
                    onClick={() => onUpdate({ ...item, selectedCaseId: cs.id })}
                    className={`rounded-xl border p-2.5 cursor-pointer transition-all ${
                      sel ? "border-secondary bg-secondary/8 ring-1 ring-secondary/25" : "border-border/70 bg-card hover:border-secondary/40"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-primary leading-snug">
                          {isAR ? cs.titleAr : cs.titleEn}
                        </p>
                        <p className="text-[10.5px] text-accent font-bold mt-0.5">
                          {cs.beneficiaryName} — {cs.city || cs.governorate}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {cs.urgent && (
                          <span className="rounded px-1.5 py-px text-[9px] font-black bg-destructive/12 text-destructive border border-destructive/20">
                            {isAR ? "عاجلة" : "Urgent"}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">#{cs.refCode}</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10.5px] font-bold">
                        <span className="text-muted-foreground">
                          {cs.raisedAmount.toLocaleString()} / {cs.neededAmount.toLocaleString()} {isAR ? "ج" : "EGP"}
                        </span>
                        <span className="text-secondary">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {sel && <p className="mt-1.5 text-[10.5px] font-black text-secondary">{isAR ? "تم الاختيار ✓" : "Selected ✓"}</p>}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {isAR ? "مبلغ المساهمة:" : "Your amount:"}
              </label>
              <div className="relative flex-1 max-w-xs">
                <Input
                  type="number" min={20}
                  value={item.amount || ""}
                  onChange={(e) => onUpdate({ ...item, amount: Number(e.target.value) || 0 })}
                  placeholder={isAR ? "اكتب المبلغ" : "Amount"}
                  className="h-9 ps-3 pe-14 font-black text-sm rounded-xl border-border/70 focus:border-secondary focus:ring-2 focus:ring-secondary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10.5px] font-black text-muted-foreground">
                  {isAR ? "ج.م" : "EGP"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODE: In-Kind (Markoun) ══ */}
        {item.donationMode === "in_kind" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3 space-y-2.5">
            <div>
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                {isAR ? "تبرع عيني — مركون" : "In-Kind — Markoun"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAR ? "استلام مجاني من باب بيتك مع إيصال رسمي." : "Free pickup from your door with an official receipt."}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary mb-1.5">
                {isAR ? "نوع ما تودّ التبرع به:" : "Item category:"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "furniture",  ar: "أثاث وصالونات",  en: "Furniture" },
                  { id: "appliances", ar: "أجهزة كهربائية", en: "Appliances" },
                  { id: "clothing",   ar: "ملابس ومفروشات", en: "Clothing" },
                  { id: "household",  ar: "أواني ومستلزمات", en: "Household" },
                ].map((cat) => {
                  const sel = (item.inKindCategory || "furniture") === cat.id;
                  return (
                    <button key={cat.id} type="button"
                      onClick={() => onUpdate({ ...item, inKindCategory: cat.id })}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                        sel
                          ? "border-emerald-500 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                          : "border-border/60 bg-card text-muted-foreground hover:bg-muted"
                      }`}>
                      {isAR ? cat.ar : cat.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p role="alert" className="text-xs font-bold text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
