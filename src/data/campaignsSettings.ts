import { useEffect, useState, useCallback, useRef } from "react";
import { programs, type ProgramContent } from "@/data/programs";
import { carouselApi, type LaravelCarouselItem, type LaravelCarouselResponse } from "@/data/laravelApi";
import { useApiContent } from "@/lib/contentSource";
import {
  campaignsSectionApi,
  type CampaignsSectionCardRecord,
  type CampaignsSectionRecord,
} from "@/data/api/campaignsSectionApi";
import { describeWriteError, isEndpointMissing } from "@/data/api/backendPending";

export type CarouselSourceType = "program" | "campaign" | "project" | "custom";

export interface CarouselCard {
  id: string;
  sourceType: CarouselSourceType;
  sourceId?: string;
  slug: string;
  name_ar: string;
  name_en: string;
  tagline_ar: string;
  tagline_en: string;
  image: string;
  priceFrom: number;
  detailsUrl: string;
  donateUrl: string;
  is_active: boolean;
}

/**
 * Settings for the "Al-Yusr Campaigns" horizontal-scroll section on the homepage.
 * Editable from /admin/campaigns-section.
 *
 * Storage (no localStorage any more):
 *   - cards (texts, image, link, active, order) + show/hide + speed: the existing carousel endpoints
 *     (`/homepage/carousel`, `/admin/homepage/carousel/...`), exactly as before;
 *   - header texts, the three switches, speed and the extra card fields (price, donate link, source):
 *     PROPOSED `GET/PUT /homepage/campaigns-section`.
 * Public reads: CONTENT_SOURCE "static" -> today's behaviour (defaults + carousel items);
 * "api"/"auto" -> the same plus `/homepage/campaigns-section` on top.
 */
export interface CampaignsSectionSettings {
  enabled: boolean;
  /** Multiplier for section scroll height (higher = slower, smoother scroll) */
  scrollSpeed: number;
  /** Custom configured cards displayed in the carousel */
  cards: CarouselCard[];
  /** Ordered list of program slugs to display (legacy fallback) */
  enabledSlugs: string[];
  /** Explicitly disabled slugs — hidden from the homepage (legacy fallback) */
  disabledSlugs?: string[];
  /** Show the final golden CTA card at the end of the strip */
  showFinalCta: boolean;
  /** Whether scroll-driven 3D coverflow is active */
  enableScrollTrigger?: boolean;
  /** Show quick skip button below indicator */
  showSkipButton?: boolean;
  /** Optional overrides for the section header text */
  title?: { ar: string; en: string };
  subtitle?: { ar: string; en: string };
}

/**
 * Generates default cards array from all registered programs.
 */
export const getDefaultCards = (): CarouselCard[] => {
  return [];
};

export const DEFAULT_CAMPAIGNS_SETTINGS: CampaignsSectionSettings = {
  enabled: true,
  scrollSpeed: 2.6,
  cards: [],
  enabledSlugs: [],
  disabledSlugs: ["volunteer"],
  showFinalCta: true,
  enableScrollTrigger: true,
  showSkipButton: true,
  title: {
    ar: "حملات تصنع الأثر",
    en: "Campaigns that make impact",
  },
  subtitle: {
    ar: "مرّر بهدوء، كل بطاقة قصة أثر حقيقية",
    en: "Scroll gently; every card is a real story of impact",
  },
};

/* ───────────────────────── mapping ───────────────────────── */

const paramFor = (t: CarouselSourceType) => (t === "campaign" ? "campaign" : t === "project" ? "project" : "program");

/**
 * "/programs/https://elyusr.org/food-box" -> "/programs/food-box": a full URL saved as a slug
 * (program 42) must not produce a broken link.
 */
export function cleanCarouselLink(url: string | null | undefined): string {
  return (url || "").replace(/^(\/(?:programs|campaigns|projects)\/)https?:\/\/[^/]+\/(.+)$/i, "$1$2");
}

/** Carousel item -> card (same mapping the public strip has always used). */
export function cardFromCarouselItem(item: LaravelCarouselItem): CarouselCard {
  const link = cleanCarouselLink(item.link_url);
  const isCamp = link.includes("campaign");
  const isProj = link.includes("project");
  const sType: CarouselSourceType = isCamp ? "campaign" : isProj ? "project" : "program";
  const detectedSlug = link.match(/\/(programs|campaigns|projects)\/([a-zA-Z0-9_-]+)/)?.[2] || `carousel-${item.id}`;
  const donateTarget = detectedSlug.startsWith("carousel-") ? "general" : detectedSlug;
  return {
    id: String(item.id),
    sourceType: sType,
    sourceId: String(item.id),
    slug: detectedSlug,
    name_ar: item.title_ar,
    name_en: item.title_en || item.title_ar,
    tagline_ar: item.description_ar,
    tagline_en: item.description_en || item.description_ar,
    image: item.image || "/og-ar.jpg",
    priceFrom: 100,
    detailsUrl: link || `/programs/${detectedSlug}`,
    donateUrl: `/donate?${paramFor(sType)}=${encodeURIComponent(donateTarget)}`,
    is_active: item.is_active !== false,
  };
}

const cardFromSectionRecord = (c: CampaignsSectionCardRecord, idx: number): CarouselCard => ({
  id: c.carousel_item_id ? String(c.carousel_item_id) : `section-${idx + 1}`,
  sourceType: c.source_type || "program",
  sourceId: c.source_id || undefined,
  slug: c.slug,
  name_ar: c.name_ar,
  name_en: c.name_en || c.name_ar,
  tagline_ar: c.tagline_ar || "",
  tagline_en: c.tagline_en || c.tagline_ar || "",
  image: c.image || "/og-ar.jpg",
  priceFrom: Number(c.price_from) || 0,
  detailsUrl: c.details_url || `/programs/${c.slug}`,
  donateUrl: c.donate_url || `/donate?${paramFor(c.source_type || "program")}=${encodeURIComponent(c.slug)}`,
  is_active: c.is_active !== false,
});

/**
 * Carousel cards enriched with the section's extra card fields (matched by `carousel_item_id`).
 * When there are no carousel items, the section's own card list is used.
 */
export function mergeSectionCards(carouselCards: CarouselCard[], sectionCards?: CampaignsSectionCardRecord[] | null): CarouselCard[] {
  if (!Array.isArray(sectionCards) || sectionCards.length === 0) return carouselCards;
  if (carouselCards.length === 0) {
    return [...sectionCards].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(cardFromSectionRecord);
  }
  const byId = new Map(sectionCards.filter((c) => c.carousel_item_id).map((c) => [String(c.carousel_item_id), c]));
  return carouselCards.map((card) => {
    const extra = byId.get(card.id);
    if (!extra) return card;
    return {
      ...card,
      sourceType: extra.source_type || card.sourceType,
      sourceId: extra.source_id || card.sourceId,
      slug: extra.slug || card.slug,
      priceFrom: Number.isFinite(Number(extra.price_from)) ? Number(extra.price_from) : card.priceFrom,
      detailsUrl: extra.details_url || card.detailsUrl,
      donateUrl: extra.donate_url || card.donateUrl,
    };
  });
}

/** Settings <- section record (blank values keep the base). */
export function applySectionRecord(base: CampaignsSectionSettings, rec: CampaignsSectionRecord | null | undefined): CampaignsSectionSettings {
  if (!rec) return base;
  const b = (v: unknown, d: boolean | undefined) => (typeof v === "boolean" ? v : d);
  const speed = Number(rec.scroll_speed);
  return {
    ...base,
    enabled: b(rec.is_active, base.enabled) ?? true,
    scrollSpeed: Number.isFinite(speed) && speed > 0 ? speed : base.scrollSpeed,
    showFinalCta: b(rec.show_final_cta, base.showFinalCta) ?? true,
    enableScrollTrigger: b(rec.enable_scroll_trigger, base.enableScrollTrigger),
    showSkipButton: b(rec.show_skip_button, base.showSkipButton),
    title: { ar: rec.title_ar || base.title?.ar || "", en: rec.title_en || base.title?.en || "" },
    subtitle: { ar: rec.subtitle_ar || base.subtitle?.ar || "", en: rec.subtitle_en || base.subtitle?.en || "" },
    enabledSlugs: Array.isArray(rec.enabled_slugs) ? rec.enabled_slugs : base.enabledSlugs,
    disabledSlugs: Array.isArray(rec.disabled_slugs) ? rec.disabled_slugs : base.disabledSlugs,
    cards: mergeSectionCards(base.cards, rec.cards),
  };
}

/** Settings -> section record (what PUT /homepage/campaigns-section receives). */
export function toSectionRecord(s: CampaignsSectionSettings): CampaignsSectionRecord {
  return {
    is_active: s.enabled,
    scroll_speed: Number(s.scrollSpeed.toFixed(1)),
    show_final_cta: s.showFinalCta,
    enable_scroll_trigger: s.enableScrollTrigger !== false,
    show_skip_button: s.showSkipButton !== false,
    title_ar: s.title?.ar || "",
    title_en: s.title?.en || "",
    subtitle_ar: s.subtitle?.ar || "",
    subtitle_en: s.subtitle?.en || "",
    enabled_slugs: s.enabledSlugs || [],
    disabled_slugs: s.disabledSlugs || [],
    cards: s.cards.map((c, i) => ({
      carousel_item_id: /^\d+$/.test(c.id) ? Number(c.id) : null,
      source_type: c.sourceType,
      source_id: c.sourceId || null,
      slug: c.slug,
      name_ar: c.name_ar,
      name_en: c.name_en,
      tagline_ar: c.tagline_ar,
      tagline_en: c.tagline_en,
      image: c.image,
      price_from: Number(c.priceFrom) || 0,
      details_url: c.detailsUrl,
      donate_url: c.donateUrl,
      is_active: c.is_active,
      sort_order: i + 1,
    })),
  };
}

/** Settings <- carousel response (enabled + speed + cards), as the public strip has always done. */
function applyCarousel(base: CampaignsSectionSettings, res: LaravelCarouselResponse | null | undefined): CampaignsSectionSettings {
  if (!res || !Array.isArray(res.items)) return base;
  return {
    ...base,
    cards: res.items.map(cardFromCarouselItem),
    enabled: res.settings?.is_active !== undefined ? res.settings.is_active : base.enabled,
    scrollSpeed: res.settings?.autoplay_speed ? Number((res.settings.autoplay_speed / 1000).toFixed(1)) : base.scrollSpeed,
  };
}

/* ───────────────────────── public hook ───────────────────────── */

/**
 * Public settings for the homepage strip. Static mode: defaults + carousel items (today's behaviour).
 * API mode: the same with `/homepage/campaigns-section` on top (ignored when the route is missing).
 */
export const useCampaignsSettings = () => {
  const [settings, setSettings] = useState<CampaignsSectionSettings>(DEFAULT_CAMPAIGNS_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [carousel, section] = await Promise.all([
        carouselApi.getPublic().catch(() => null),
        useApiContent ? campaignsSectionApi.get().catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      let next = applyCarousel(DEFAULT_CAMPAIGNS_SETTINGS, carousel);
      if (section) next = applySectionRecord(next, section);
      if (next !== DEFAULT_CAMPAIGNS_SETTINGS) setSettings(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings };
};

/* ───────────────────────── dashboard hook ───────────────────────── */

export type SectionBackendState = "loading" | "ok" | "missing" | "error";

export type SectionWriteResult = {
  /** true when PUT /homepage/campaigns-section succeeded */
  sectionSaved: boolean;
  /** Arabic description of why the section part was not saved (missing route or server error). */
  sectionError?: string;
};

const isNumericId = (id: string) => /^\d+$/.test(id) && Number(id) > 0;

/**
 * Dashboard state for /admin/campaigns-section. Every write is awaited and throws (with an Arabic message) when
 * the carousel part fails; the section part (proposed route) is reported in the returned result.
 * `settings` is an unsaved draft until `saveSettings()`; cards are written immediately.
 */
export const useCampaignsSectionAdmin = () => {
  const [settings, setSettings] = useState<CampaignsSectionSettings>(DEFAULT_CAMPAIGNS_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sectionState, setSectionState] = useState<SectionBackendState>("loading");
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  /** Last settings known to be stored on the backend (cards are persisted with these, not with the draft). */
  const savedRef = useRef<CampaignsSectionSettings>(DEFAULT_CAMPAIGNS_SETTINGS);
  /** False when the carousel could not be read: then `cards` is NOT sent (the backend keeps its card list). */
  const carouselLoadedRef = useRef(false);

  const reload = useCallback(async (opts?: { keepDraft?: boolean }) => {
    setLoading(true);
    const errors: string[] = [];
    let carousel: LaravelCarouselResponse | null = null;
    carouselLoadedRef.current = false;
    try {
      carousel = await carouselApi.getAdmin();
      carouselLoadedRef.current = true;
    } catch (e) {
      errors.push(`الكاروسيل: ${describeWriteError(e, "GET /admin/homepage/carousel")}`);
    }
    let section: CampaignsSectionRecord | null = null;
    let state: SectionBackendState = "ok";
    try {
      section = await campaignsSectionApi.get({ fresh: true });
    } catch (e) {
      state = isEndpointMissing(e) ? "missing" : "error";
      if (state === "error") errors.push(`إعدادات القسم: ${describeWriteError(e, "GET /homepage/campaigns-section")}`);
    }
    const server = applySectionRecord(applyCarousel(DEFAULT_CAMPAIGNS_SETTINGS, carousel), section);
    savedRef.current = server;
    setSectionState(state);
    setLoadErrors(errors);
    setSettings((prev) => (opts?.keepDraft ? { ...prev, cards: server.cards } : server));
    if (!opts?.keepDraft) setDirty(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Edit the draft (header texts, switches, speed). Nothing is sent until saveSettings(). */
  const update = useCallback((patch: Partial<CampaignsSectionSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const putSection = async (s: CampaignsSectionSettings): Promise<SectionWriteResult> => {
    try {
      const body = toSectionRecord(s);
      if (!carouselLoadedRef.current) delete body.cards;
      await campaignsSectionApi.put(body);
      setSectionState("ok");
      return { sectionSaved: true };
    } catch (e) {
      if (isEndpointMissing(e)) setSectionState("missing");
      return { sectionSaved: false, sectionError: describeWriteError(e, "PUT /homepage/campaigns-section") };
    }
  };

  /**
   * Save the draft: carousel settings (show/hide + speed, existing route) then the section row (proposed route).
   * Throws when the carousel part fails; the section part is in the result.
   */
  const saveSettings = useCallback(async (): Promise<SectionWriteResult> => {
    const draft = settings;
    await carouselApi.updateSettings({
      is_active: draft.enabled,
      autoplay_speed: Math.round((draft.scrollSpeed || 2.6) * 1000),
      autoplay: true,
      show_dots: true,
    });
    const res = await putSection(draft);
    if (res.sectionSaved) savedRef.current = { ...draft };
    else savedRef.current = { ...savedRef.current, enabled: draft.enabled, scrollSpeed: draft.scrollSpeed };
    await reload({ keepDraft: !res.sectionSaved });
    if (res.sectionSaved) setDirty(false);
    return res;
  }, [settings, reload]);

  /** After a card write: store the extra card fields with the LAST SAVED section settings, then refresh the cards. */
  const persistCards = async (cards: CarouselCard[]): Promise<SectionWriteResult> => {
    const res = await putSection({ ...savedRef.current, cards });
    await reload({ keepDraft: true });
    return res;
  };

  const carouselPayload = (c: Omit<CarouselCard, "id">) => ({
    title_ar: c.name_ar,
    title_en: c.name_en || c.name_ar,
    description_ar: c.tagline_ar,
    description_en: c.tagline_en || c.tagline_ar,
    image: c.image || "/og-ar.jpg",
    link_url: c.detailsUrl || "/programs",
    is_active: c.is_active,
  });

  const addCard = useCallback(async (newCard: Omit<CarouselCard, "id">): Promise<SectionWriteResult> => {
    const created = await carouselApi.addItem({ ...carouselPayload(newCard), sort_order: settings.cards.length + 1 });
    if (!created?.id) throw new Error("الخادم لم يرجع رقم البطاقة الجديدة");
    return persistCards([...settings.cards, { ...newCard, id: String(created.id) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cards]);

  const updateCard = useCallback(async (id: string, patch: Partial<CarouselCard>): Promise<SectionWriteResult> => {
    const cards = settings.cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const updated = cards.find((c) => c.id === id);
    if (updated && isNumericId(id)) await carouselApi.updateItem(Number(id), carouselPayload(updated));
    return persistCards(cards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cards]);

  const deleteCard = useCallback(async (id: string): Promise<SectionWriteResult> => {
    if (isNumericId(id)) await carouselApi.deleteItem(Number(id));
    return persistCards(settings.cards.filter((c) => c.id !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cards]);

  const moveCard = useCallback(async (id: string, direction: -1 | 1): Promise<SectionWriteResult | null> => {
    const cards = [...settings.cards];
    const index = cards.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= cards.length) return null;
    const [moved] = cards.splice(index, 1);
    cards.splice(target, 0, moved);
    const payload = cards.map((c, idx) => ({ id: c.id, sort_order: idx + 1 })).filter((r) => isNumericId(r.id)).map((r) => ({ id: Number(r.id), sort_order: r.sort_order }));
    if (payload.length) await carouselApi.reorder(payload);
    return persistCards(cards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cards]);

  const toggleCard = useCallback(async (id: string): Promise<SectionWriteResult> => {
    if (isNumericId(id)) await carouselApi.toggleItem(Number(id));
    return persistCards(settings.cards.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cards]);

  /** Drop the unsaved draft and show what the backend has. */
  const discardDraft = useCallback(() => {
    void reload();
  }, [reload]);

  return { settings, dirty, loading, sectionState, loadErrors, reload, update, saveSettings, discardDraft, addCard, updateCard, deleteCard, moveCard, toggleCard };
};

/**
 * Returns the currently active cards from settings.
 */
export const getVisibleCards = (settings: CampaignsSectionSettings): CarouselCard[] => {
  const allCards = settings.cards && settings.cards.length > 0
    ? settings.cards
    : getDefaultCards();
  return allCards.filter((c) => c.is_active);
};

/**
 * Resolves the ordered, enabled charity programs to display in the Coverflow strip.
 * Respects admin order and enabled/disabled status.
 */
export const getVisibleCampaignPrograms = (
  settings: CampaignsSectionSettings
): ProgramContent[] => {
  // If user configured cards, map active cards
  if (settings.cards && settings.cards.length > 0) {
    const active = settings.cards.filter((c) => c.is_active);
    const bySlug = new Map(programs.map((p) => [p.slug, p]));
    return active.map((c) => {
      const existing = bySlug.get(c.slug);
      if (existing) {
        return {
          ...existing,
          ar: { ...existing.ar, name: c.name_ar, tagline: c.tagline_ar },
          en: { ...existing.en, name: c.name_en, tagline: c.tagline_en },
          image: c.image || existing.image,
          priceFrom: c.priceFrom,
          detailsUrl: c.detailsUrl || `/programs/${c.slug}`,
          donateUrl: (c.donateUrl && c.donateUrl !== "/donate" && c.donateUrl !== "/donate/" && c.donateUrl.includes("?"))
            ? c.donateUrl
            : `/donate?${c.sourceType === "campaign" ? "campaign" : c.sourceType === "project" ? "project" : "program"}=${encodeURIComponent(c.slug)}${c.priceFrom > 0 ? `&amount=${c.priceFrom}` : ""}`,
        } as unknown as ProgramContent;
      }
      return {
        id: c.id,
        slug: c.slug,
        image: c.image || "/og-ar.jpg",
        priceFrom: c.priceFrom,
        category: "general",
        icon: "Heart",
        ar: { name: c.name_ar, tagline: c.tagline_ar, description: c.tagline_ar, impact: "" },
        en: { name: c.name_en, tagline: c.tagline_en, description: c.tagline_en, impact: "" },
        detailsUrl: c.detailsUrl || `/programs/${c.slug}`,
        donateUrl: (c.donateUrl && c.donateUrl !== "/donate" && c.donateUrl !== "/donate/" && c.donateUrl.includes("?"))
          ? c.donateUrl
          : `/donate?${c.sourceType === "campaign" ? "campaign" : c.sourceType === "project" ? "project" : "program"}=${encodeURIComponent(c.slug)}${c.priceFrom > 0 ? `&amount=${c.priceFrom}` : ""}`,
      } as unknown as ProgramContent;
    });
  }

  const disabled = new Set(settings.disabledSlugs ?? ["volunteer"]);
  const bySlug = new Map(programs.map((p) => [p.slug, p]));

  const ordered = (settings.enabledSlugs ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((p): p is ProgramContent => Boolean(p));

  const orderedSet = new Set(ordered.map((p) => p.slug));
  const appended = programs.filter((p) => !orderedSet.has(p.slug));

  return [...ordered, ...appended].filter((p) => !disabled.has(p.slug));
};