import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Common, curated lucide icons exposed for the admin picker. Add freely. */
export const STAT_ICON_NAMES = [
  "Heart", "HeartHandshake", "Users", "User", "Home", "Building2", "Briefcase",
  "MapPin", "Map", "Globe", "Globe2", "ShieldCheck", "Shield", "BadgeCheck",
  "Award", "Trophy", "Star", "Sparkles", "Flame", "Sun", "Moon",
  "HandHeart", "HandCoins", "Coins", "Wallet", "PiggyBank", "Gift",
  "Beef", "Drumstick", "UtensilsCrossed", "Wheat", "Soup",
  "GraduationCap", "BookOpen", "School", "PenTool", "Pencil",
  "Calendar", "CalendarDays", "Clock", "Timer", "TrendingUp", "BarChart3",
  "CheckCircle2", "CheckCheck", "ListChecks", "Target",
  "Truck", "Package", "Boxes", "Building", "Stethoscope", "Syringe", "Cross",
  "Droplet", "Droplets", "Leaf", "Trees", "Sprout",
] as const;

export type StatIconName = (typeof STAT_ICON_NAMES)[number];

/** Resolve a lucide icon by name with a safe fallback. */
export function getLucideIcon(name?: string | null): LucideIcon {
  if (!name) return Icons.Sparkles as LucideIcon;
  const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
  return (Comp || (Icons.Sparkles as LucideIcon));
}

/** All lucide icon names available in this build (PascalCase). */
export function getAllLucideIconNames(): string[] {
  const skip = new Set(["Icon", "createLucideIcon", "default"]);
  return Object.keys(Icons)
    .filter((k) => /^[A-Z]/.test(k) && !skip.has(k) && !k.endsWith("Icon"))
    .sort();
}