import { useEffect, useState, useCallback } from "react";
import { programs, type ProgramContent } from "@/data/programs";
import { carouselApi } from "@/data/laravelApi";

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
 * Persists in localStorage and syncs with backend API when available.
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

const STORAGE_KEY = "alyusr_campaigns_section_v1";

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

const loadSettings = (): CampaignsSectionSettings => {
  if (typeof window === "undefined") return DEFAULT_CAMPAIGNS_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CAMPAIGNS_SETTINGS;
    const parsed = JSON.parse(raw);
    const rawCards: any[] = Array.isArray(parsed.cards) ? parsed.cards : [];

    const sanitizedCards: CarouselCard[] = rawCards.map((c: any) => {
      let donateUrl = c.donateUrl;
      let detailsUrl = c.detailsUrl;
      const slug = (c.slug || c.sourceId || "").replace(/^carousel-\d+$/, "").trim();

      if (!donateUrl || donateUrl === "/donate" || donateUrl === "/donate/") {
        const type = c.sourceType === "campaign" ? "campaign" : c.sourceType === "project" ? "project" : "program";
        const target = slug || (c.name_ar?.includes("ستر") ? "shelter" : c.name_ar?.includes("ماء") ? "water" : "general");
        donateUrl = `/donate?${type}=${encodeURIComponent(target)}`;
      }

      if (!detailsUrl || detailsUrl === "/programs" || detailsUrl === "/programs/") {
        const target = slug || (c.name_ar?.includes("ستر") ? "shelter" : c.name_ar?.includes("ماء") ? "water" : "");
        detailsUrl = target ? `/programs/${encodeURIComponent(target)}` : "/programs";
      }

      return {
        ...c,
        donateUrl,
        detailsUrl,
      };
    });

    return {
      ...DEFAULT_CAMPAIGNS_SETTINGS,
      ...parsed,
      cards: sanitizedCards,
      title: { ...DEFAULT_CAMPAIGNS_SETTINGS.title, ...parsed.title },
      subtitle: { ...DEFAULT_CAMPAIGNS_SETTINGS.subtitle, ...parsed.subtitle },
    };
  } catch {
    return DEFAULT_CAMPAIGNS_SETTINGS;
  }
};

const saveSettings = (s: CampaignsSectionSettings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("alyusr_campaigns_settings_changed", { detail: s }));
  } catch (e) {
    console.warn("Could not save campaigns settings to localStorage", e);
  }
};

export const useCampaignsSettings = () => {
  const [settings, setSettings] = useState<CampaignsSectionSettings>(() => loadSettings());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(loadSettings());
    };
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<CampaignsSectionSettings>;
      if (customEvent.detail) setSettings(customEvent.detail);
      else setSettings(loadSettings());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("alyusr_campaigns_settings_changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("alyusr_campaigns_settings_changed", handleCustom);
    };
  }, []);

  // Fetch remote backend items on mount if available
  useEffect(() => {
    let cancelled = false;
    void carouselApi.getPublic().then((res) => {
      if (cancelled || !res || !Array.isArray(res.items)) return;
      setSettings((prev) => {
        // Map backend items to CarouselCard
        const mergedRemoteCards: CarouselCard[] = res.items.map((item) => {
          const isCamp = (item.link_url || "").includes("campaign");
          const isProj = (item.link_url || "").includes("project");
          const sType: CarouselSourceType = isCamp ? "campaign" : isProj ? "project" : "program";

          const detectedSlug = (item.link_url || "").match(/\/(programs|campaigns|projects)\/([a-zA-Z0-9_-]+)/)?.[2]
            || `carousel-${item.id}`;
          const donateTarget = detectedSlug.startsWith("carousel-") ? "general" : detectedSlug;
          const paramName = isCamp ? "campaign" : isProj ? "project" : "program";

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
            detailsUrl: item.link_url || `/programs/${detectedSlug}`,
            donateUrl: `/donate?${paramName}=${encodeURIComponent(donateTarget)}`,
            is_active: item.is_active !== false,
          };
        });

        // Only keep local pending cards that have a temp client ID ("card-...") not yet in DB
        const pendingLocal = (prev.cards || []).filter(
          (c) => c.id.startsWith("card-")
        );
        const merged = [...mergedRemoteCards, ...pendingLocal];

        const next = {
          ...prev,
          cards: merged,
          enabled: res.settings?.is_active !== undefined ? res.settings.is_active : prev.enabled,
          scrollSpeed: res.settings?.autoplay_speed ? Number((res.settings.autoplay_speed / 1000).toFixed(1)) : prev.scrollSpeed,
        };
        saveSettings(next);
        return next;
      });
    }).catch(() => { });

    return () => { cancelled = true; };
  }, []);

  const update = useCallback((patch: Partial<CampaignsSectionSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);

      // Background sync to backend carousel settings
      try {
        void carouselApi.updateSettings({
          is_active: next.enabled,
          autoplay_speed: Math.round((next.scrollSpeed || 2.6) * 1000),
          autoplay: true,
          show_dots: true,
        });
      } catch { }

      return next;
    });
  }, []);

  const addCard = useCallback((newCard: Omit<CarouselCard, "id">) => {
    const tempId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setSettings((prev) => {
      const currentCards = prev.cards && prev.cards.length > 0 ? prev.cards : getDefaultCards();
      const cards = [...currentCards, { ...newCard, id: tempId }];
      const next = { ...prev, cards };
      saveSettings(next);
      return next;
    });

    // Background sync — on success, swap temp ID with real server ID in localStorage
    carouselApi.addItem({
      title_ar: newCard.name_ar,
      title_en: newCard.name_en || newCard.name_ar,
      description_ar: newCard.tagline_ar,
      description_en: newCard.tagline_en || newCard.tagline_ar,
      image: newCard.image || "/og-ar.jpg",
      link_url: newCard.detailsUrl || "/programs",
      sort_order: 999,
      is_active: newCard.is_active,
    }).then((created) => {
      if (!created?.id) return;
      const realId = String(created.id);
      setSettings((prev) => {
        const cards = prev.cards.map((c) =>
          c.id === tempId ? { ...c, id: realId } : c
        );
        const next = { ...prev, cards };
        saveSettings(next);
        return next;
      });
    }).catch(() => { });
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<CarouselCard>) => {
    setSettings((prev) => {
      const currentCards = prev.cards || [];
      const cards = currentCards.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const next = { ...prev, cards };
      saveSettings(next);

      // Only sync to backend when we have a real numeric DB id
      const numericId = Number(id);
      const isNumericId = !isNaN(numericId) && numericId > 0 && String(numericId) === id;
      if (isNumericId) {
        const updated = cards.find((c) => c.id === id);
        if (updated) {
          try {
            void carouselApi.updateItem(numericId, {
              title_ar: updated.name_ar,
              title_en: updated.name_en || updated.name_ar,
              description_ar: updated.tagline_ar,
              description_en: updated.tagline_en || updated.tagline_ar,
              image: updated.image,
              link_url: updated.detailsUrl || "/programs",
              is_active: updated.is_active,
            });
          } catch { }
        }
      }

      return next;
    });
  }, []);

  const deleteCard = useCallback((id: string) => {
    setSettings((prev) => {
      const currentCards = prev.cards || [];
      const cards = currentCards.filter((c) => c.id !== id);
      const next = { ...prev, cards };
      saveSettings(next);

      // Only call backend DELETE when the id is a real numeric DB record id.
      // Slug-based ids (e.g. "program-orphans") are local-only and have no DB record.
      const numericId = Number(id);
      const isNumericId = !isNaN(numericId) && numericId > 0 && String(numericId) === id;
      if (isNumericId) {
        try {
          void carouselApi.deleteItem(numericId);
        } catch { }
      }

      return next;
    });
  }, []);

  const moveCard = useCallback((id: string, direction: -1 | 1) => {
    setSettings((prev) => {
      const currentCards = [...(prev.cards || [])];
      const index = currentCards.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= currentCards.length) return prev;
      const [moved] = currentCards.splice(index, 1);
      currentCards.splice(targetIndex, 0, moved);
      const next = { ...prev, cards: currentCards };
      saveSettings(next);

      // Background sync — only reorder items that have real numeric DB ids
      try {
        const reorderPayload = currentCards
          .map((c, idx) => ({ id: Number(c.id), sort_order: idx + 1 }))
          .filter((r) => !isNaN(r.id) && r.id > 0);
        if (reorderPayload.length > 0) void carouselApi.reorder(reorderPayload);
      } catch { }

      return next;
    });
  }, []);

  const toggleCard = useCallback((id: string) => {
    setSettings((prev) => {
      const currentCards = prev.cards || [];
      const cards = currentCards.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c));
      const next = { ...prev, cards };
      saveSettings(next);

      // Only call backend toggle when id is a real numeric DB id
      const numericId = Number(id);
      const isNumericId = !isNaN(numericId) && numericId > 0 && String(numericId) === id;
      if (isNumericId) {
        try {
          void carouselApi.toggleItem(numericId);
        } catch { }
      }

      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSettings(DEFAULT_CAMPAIGNS_SETTINGS);
    setSettings(DEFAULT_CAMPAIGNS_SETTINGS);
    try {
      void carouselApi.updateSettings({
        is_active: DEFAULT_CAMPAIGNS_SETTINGS.enabled,
        autoplay_speed: 2600,
      });
    } catch { }
  }, []);

  return { settings, update, reset, addCard, updateCard, deleteCard, moveCard, toggleCard };
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