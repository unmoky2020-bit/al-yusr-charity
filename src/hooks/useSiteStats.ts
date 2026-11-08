import { useEffect, useState } from "react";
import {
  homeNumbersApi,
  achievementsApi,
  type LaravelHomeNumber,
  type LaravelAchievement,
} from "@/data/laravelApi";

export type SiteStat = {
  id: string;
  section: string;
  sort_order: number;
  active: boolean;
  label_ar: string;
  label_en: string;
  value_number: number | null;
  value_text: string | null;
  suffix_ar: string | null;
  suffix_en: string | null;
  icon_name: string | null;
  image_url: string | null;
  link_url: string | null;
};

export const DEFAULT_STATS: Record<string, SiteStat[]> = {
  home_stats: [
    {
      id: "default-1",
      section: "home_stats",
      sort_order: 1,
      active: true,
      label_ar: "أسرة مستحقة",
      label_en: "Families supported",
      value_number: 13267,
      value_text: null,
      suffix_ar: "",
      suffix_en: "",
      icon_name: "Users",
      image_url: null,
      link_url: null,
    },
    {
      id: "default-2",
      section: "home_stats",
      sort_order: 2,
      active: true,
      label_ar: "طالب تحت الكفالة",
      label_en: "Students sponsored",
      value_number: 1278,
      value_text: null,
      suffix_ar: "",
      suffix_en: "",
      icon_name: "GraduationCap",
      image_url: null,
      link_url: null,
    },
    {
      id: "default-3",
      section: "home_stats",
      sort_order: 3,
      active: true,
      label_ar: "سقف منزل",
      label_en: "Home roofs built",
      value_number: 1000,
      value_text: null,
      suffix_ar: "+",
      suffix_en: "+",
      icon_name: "Home",
      image_url: null,
      link_url: null,
    },
    {
      id: "default-4",
      section: "home_stats",
      sort_order: 4,
      active: true,
      label_ar: "وصلة مياه",
      label_en: "Water connections",
      value_number: 1500,
      value_text: null,
      suffix_ar: "+",
      suffix_en: "+",
      icon_name: "Droplets",
      image_url: null,
      link_url: null,
    },
    {
      id: "default-5",
      section: "home_stats",
      sort_order: 5,
      active: true,
      label_ar: "محافظات بحضور دائم",
      label_en: "Active governorates",
      value_number: 5,
      value_text: null,
      suffix_ar: "",
      suffix_en: "",
      icon_name: "MapPin",
      image_url: null,
      link_url: null,
    },
    {
      id: "default-6",
      section: "home_stats",
      sort_order: 6,
      active: true,
      label_ar: "لحوم بلدية سنويًا",
      label_en: "Local meat per year",
      value_number: 5,
      value_text: null,
      suffix_ar: " طن",
      suffix_en: " tons",
      icon_name: "Beef",
      image_url: null,
      link_url: null,
    },
  ],
  achievements: [
    {
      id: "ach-1",
      section: "achievements",
      sort_order: 1,
      active: true,
      label_ar: "كرتونة رمضان",
      label_en: "Ramadan food boxes",
      value_number: 1400,
      value_text: null,
      suffix_ar: " كرتونة",
      suffix_en: " boxes",
      icon_name: "Utensils",
      image_url: null,
      link_url: null,
    },
    {
      id: "ach-2",
      section: "achievements",
      sort_order: 2,
      active: true,
      label_ar: "كرتونة غذائية شهرية",
      label_en: "Monthly food boxes",
      value_number: 3000,
      value_text: null,
      suffix_ar: "+",
      suffix_en: "+",
      icon_name: "Utensils",
      image_url: null,
      link_url: null,
    },
    {
      id: "ach-3",
      section: "achievements",
      sort_order: 3,
      active: true,
      label_ar: "سقف منزل معزول",
      label_en: "Homes roofed",
      value_number: 122,
      value_text: null,
      suffix_ar: " سقف",
      suffix_en: " roofs",
      icon_name: "Home",
      image_url: null,
      link_url: null,
    },
    {
      id: "ach-4",
      section: "achievements",
      sort_order: 4,
      active: true,
      label_ar: "وصلة مياه نقية",
      label_en: "Water connections",
      value_number: 385,
      value_text: null,
      suffix_ar: " وصلة",
      suffix_en: " connections",
      icon_name: "Droplets",
      image_url: null,
      link_url: null,
    },
  ],
};

export function useSiteStats(section: "home_stats" | "achievements") {
  const cacheKey = `elyusr_stats_${section}`;

  const [data, setData] = useState<SiteStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadStats() {
      try {
        if (section === "home_stats") {
          const res = await homeNumbersApi.listAll();
          if (alive && Array.isArray(res) && res.length > 0) {
            const mapped: SiteStat[] = res
              .filter((item: LaravelHomeNumber) => item.is_visible !== false)
              .map((item: LaravelHomeNumber, idx: number) => ({
                id: String(item.id || idx + 1),
                section: "home_stats",
                sort_order: Number(item.sort_order || idx + 1),
                active: item.is_visible !== false,
                label_ar: item.title_ar || "",
                label_en: item.title_en || item.title_ar || "",
                value_number: typeof item.number === "number" ? item.number : parseFloat(String(item.number)) || null,
                value_text: typeof item.number === "string" && isNaN(Number(item.number)) ? item.number : null,
                suffix_ar: item.number_label_ar || "",
                suffix_en: item.number_label_en || item.number_label_ar || "",
                icon_name: item.icon || DEFAULT_STATS.home_stats[idx % DEFAULT_STATS.home_stats.length]?.icon_name || "Check",
                image_url: item.fallback_image || null,
                link_url: null,
              }));
            setData(mapped);
          } else if (alive) {
            // Only fallback if backend returned nothing or empty
            setData(DEFAULT_STATS[section] || []);
          }
        } else {
          const res = await achievementsApi.listAll();
          if (alive && Array.isArray(res) && res.length > 0) {
            const mapped: SiteStat[] = res
              .filter((item: LaravelAchievement) => item.is_active !== false)
              .map((item: LaravelAchievement, idx: number) => ({
                id: String(item.id || idx + 1),
                section: "achievements",
                sort_order: Number(item.sort_order || idx + 1),
                active: item.is_active !== false,
                label_ar: item.title_ar || "",
                label_en: item.title_en || item.title_ar || "",
                value_number: typeof item.number === "number" ? item.number : parseFloat(String(item.number)) || null,
                value_text: null,
                suffix_ar: item.number_suffix_ar || "",
                suffix_en: item.number_suffix_en || item.number_suffix_ar || "",
                icon_name: item.icon || "Award",
                image_url: item.image || null,
                link_url: null,
              }));
            setData(mapped);
          } else if (alive) {
            setData(DEFAULT_STATS[section] || []);
          }
        }
      } catch {
        // Fallback to default ONLY if backend request genuinely failed
        if (alive) {
          setData(DEFAULT_STATS[section] || []);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      alive = false;
    };
  }, [section, cacheKey]);

  return { data, loading };
}