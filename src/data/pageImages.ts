/**
 * Pictures bundled with the site that landing pages use as their default images.
 *
 * Defaults are written as `asset:<file>` (see `asset()`), never as the bundled URL itself: the bundled URL
 * changes between dev and production builds, the name does not. So when the dashboard saves a page whose
 * pictures are still (partly) the defaults, what is stored keeps working after every deploy.
 */
import { formatServerImageUrl } from "@/data/laravelApi";
import { l, type L, type PageImage } from "@/data/campaignPages/types";

import asasMarqun from "@/assets/asas-marqun.jpg";
import axisEducation from "@/assets/axis-education.jpg";
import brandCartonStack from "@/assets/brand-carton-stack.png";
import brandPosterClassroom from "@/assets/brand-poster-classroom.webp";
import farmHero from "@/assets/farm-hero.jpg";
import heroCartonOpened from "@/assets/hero-carton-opened.webp";
import heroChild from "@/assets/hero-child.jpg";
import markounFurniture from "@/assets/markoun-furniture.webp";
import markounPosterClothes from "@/assets/markoun-poster-clothes.webp";
import markounPosterDelivery from "@/assets/markoun-poster-delivery.png";
import markounPosterFurniture from "@/assets/markoun-poster-furniture.webp";
import markounPosterMedbottle from "@/assets/markoun-poster-medbottle.png";
import markounPosterMeds from "@/assets/markoun-poster-meds.png";
import posterEducation from "@/assets/poster-education.png";
import posterMeat from "@/assets/poster-meat.webp";
import posterWater from "@/assets/poster-water.png";
import programEducation from "@/assets/program-education.jpg";
import programFoodNew from "@/assets/program-food-new.jpg";
import programWaterNew from "@/assets/program-water-new.jpg";
import qurbaniHeroTrays from "@/assets/qurbani-hero-trays.webp";
import yusrDistribution1 from "@/assets/yusr-distribution-1.webp";
import yusrMeals from "@/assets/yusr-meals.webp";
import yusrRamadanBox from "@/assets/yusr-ramadan-box.png";
import yusrWater from "@/assets/yusr-water.png";
import projectsHero from "@/assets/projects-hero.webp";
import programsHero from "@/assets/programs-hero.webp";
import fieldC26Elder from "@/assets/field/convoy-2026-elder-handover.jpg";
import fieldC26NightHand from "@/assets/field/convoy-2026-night-handover.jpg";
import fieldC26Day from "@/assets/field/convoy-2026-day-distribution.jpg";
import fieldC26Night from "@/assets/field/convoy-2026-night-delivery.jpg";
import fieldC26Pickup from "@/assets/field/convoy-2026-pickup-loaded.jpg";
import fieldC26Road from "@/assets/field/convoy-2026-fuwah-road.jpg";
import fieldQ24Tray from "@/assets/field/qurbani-2024-meat-tray.jpg";
import fieldQ24Cattle from "@/assets/field/qurbani-2024-cattle-truck.jpg";
import fieldQ24Pack from "@/assets/field/qurbani-2024-packing-area.jpg";
import fieldQ24Pen from "@/assets/field/qurbani-2024-cattle-pen.jpg";
import fieldQ25A from "@/assets/field/qurbani-2025-prep-a.jpg";
import fieldQ25B from "@/assets/field/qurbani-2025-prep-b.jpg";
import fieldQ25C from "@/assets/field/qurbani-2025-prep-c.jpg";
import programHealth from "@/assets/program-health.webp";
import prosthetics from "@/assets/Prosthetics.jpg";
import axisHealth from "@/assets/axis-health.jpg";
import programFood from "@/assets/program-food.jpg";
import programOrphans from "@/assets/program-orphans.jpg";
import brandTruck from "@/assets/brand-truck.jpg";
import familyHope from "@/assets/family-hope.webp";
import brandBags from "@/assets/brand-bags.jpg";
import brandGirlOrange from "@/assets/brand-girl-orange.jpg";
import posterVolunteerField from "@/assets/poster-volunteer-field.webp";

const ASSETS: Record<string, string> = {
  "asas-marqun.jpg": asasMarqun,
  "axis-education.jpg": axisEducation,
  "brand-carton-stack.png": brandCartonStack,
  "brand-poster-classroom.webp": brandPosterClassroom,
  "farm-hero.jpg": farmHero,
  "hero-carton-opened.webp": heroCartonOpened,
  "hero-child.jpg": heroChild,
  "markoun-furniture.webp": markounFurniture,
  "markoun-poster-clothes.webp": markounPosterClothes,
  "markoun-poster-delivery.png": markounPosterDelivery,
  "markoun-poster-furniture.webp": markounPosterFurniture,
  "markoun-poster-medbottle.png": markounPosterMedbottle,
  "markoun-poster-meds.png": markounPosterMeds,
  "poster-education.png": posterEducation,
  "poster-meat.webp": posterMeat,
  "poster-water.png": posterWater,
  "program-education.jpg": programEducation,
  "program-food-new.jpg": programFoodNew,
  "program-water-new.jpg": programWaterNew,
  "qurbani-hero-trays.webp": qurbaniHeroTrays,
  "yusr-distribution-1.webp": yusrDistribution1,
  "yusr-meals.webp": yusrMeals,
  "yusr-ramadan-box.png": yusrRamadanBox,
  "yusr-water.png": yusrWater,
  "projects-hero.webp": projectsHero,
  "programs-hero.webp": programsHero,
  "field/convoy-2026-elder-handover.jpg": fieldC26Elder,
  "field/convoy-2026-night-handover.jpg": fieldC26NightHand,
  "field/convoy-2026-day-distribution.jpg": fieldC26Day,
  "field/convoy-2026-night-delivery.jpg": fieldC26Night,
  "field/convoy-2026-pickup-loaded.jpg": fieldC26Pickup,
  "field/convoy-2026-fuwah-road.jpg": fieldC26Road,
  "field/qurbani-2024-meat-tray.jpg": fieldQ24Tray,
  "field/qurbani-2024-cattle-truck.jpg": fieldQ24Cattle,
  "field/qurbani-2024-packing-area.jpg": fieldQ24Pack,
  "field/qurbani-2024-cattle-pen.jpg": fieldQ24Pen,
  "field/qurbani-2025-prep-a.jpg": fieldQ25A,
  "field/qurbani-2025-prep-b.jpg": fieldQ25B,
  "field/qurbani-2025-prep-c.jpg": fieldQ25C,
  "program-health.webp": programHealth,
  "Prosthetics.jpg": prosthetics,
  "axis-health.jpg": axisHealth,
  "program-food.jpg": programFood,
  "program-orphans.jpg": programOrphans,
  "brand-truck.jpg": brandTruck,
  "family-hope.webp": familyHope,
  "brand-bags.jpg": brandBags,
  "brand-girl-orange.jpg": brandGirlOrange,
  "poster-volunteer-field.webp": posterVolunteerField,
};

export type AssetName = keyof typeof ASSETS;

/** Reference to a bundled picture, for code defaults. */
export const asset = (file: AssetName) => `asset:${file}`;

/** A default picture: bundled file + Arabic/English description (and optional caption). */
export const img = (file: AssetName, altAr: string, altEn: string, caption?: L): PageImage => ({
  src: asset(file),
  alt: l(altAr, altEn),
  ...(caption ? { caption } : {}),
});

/** URL to put in <img src>: bundled pictures by name, uploaded ones through the usual server-URL fixes. */
export function pageImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  const s = src.trim();
  if (s.startsWith("asset:")) return ASSETS[s.slice(6)] ?? "";
  return formatServerImageUrl(s) || s;
}

/**
 * A slot's pictures in the shape the page components already take (BentoGallery & co).
 * `caption*` falls back to the description; `tag*` is the caption as typed ("" when none).
 */
export type ResolvedImage = { src: string; altAr: string; altEn: string; captionAr: string; captionEn: string; tagAr: string; tagEn: string };

export function resolveImages(items: PageImage[] | undefined): ResolvedImage[] {
  return (items ?? [])
    .map((it) => {
      const altAr = it.alt.ar || it.alt.en;
      const altEn = it.alt.en || it.alt.ar;
      return {
        src: pageImageUrl(it.src),
        altAr,
        altEn,
        captionAr: it.caption?.ar || altAr,
        captionEn: it.caption?.en || it.caption?.ar || altEn,
        tagAr: it.caption?.ar || "",
        tagEn: it.caption?.en || it.caption?.ar || "",
      };
    })
    .filter((it) => !!it.src);
}
