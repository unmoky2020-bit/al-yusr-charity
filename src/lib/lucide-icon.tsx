/**
 * Curated lucide icon registry.
 *
 * Why not `import * as Icons from "lucide-react"`? That single line defeats tree-shaking and
 * ships the entire library (~650 KB minified, 39% of the main bundle) to every visitor.
 * Only the icons listed here can be chosen in the admin picker or resolved by name from the
 * CMS; unknown names fall back to Sparkles. To add an icon: import it and add it to ICONS.
 */
import type { LucideIcon } from "lucide-react";
import {
  Accessibility, Activity, Archive, Award, Baby, BadgeCheck, Banknote, BarChart3, BedDouble, Beef,
  BookOpen, Boxes, Briefcase, Building, Building2, Bus, Calculator, Calendar, CalendarDays, Camera,
  Car, CheckCheck, CheckCircle2, Church, Clock, Coins, Compass, CreditCard, Cross, DoorOpen,
  Droplet, Droplets, Drumstick, Eye, FileCheck2, Flame, Gift, Globe, Globe2, GraduationCap,
  Hammer, HandCoins, HandHeart, Handshake, Heart, HeartHandshake, HeartPulse, Home, Hospital, Image,
  Info, Landmark, Laptop, Layers, Leaf, Lightbulb, ListChecks, Mail, Map, MapPin, Megaphone, Moon,
  Newspaper, Package, PenTool, Pencil, Phone, PhoneCall, PiggyBank, Recycle, Scale, School, Shield,
  ShieldAlert, ShieldCheck, Shirt, Smartphone, Soup, Sparkles, Sprout, Star, Stethoscope, Sun,
  Syringe, Target, Tent, Thermometer, Timer, Trees, TrendingUp, Trophy, Truck, User, Users,
  Utensils, UtensilsCrossed, Video, Wallet, Wheat, Wind, Zap,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Accessibility, Activity, Archive, Award, Baby, BadgeCheck, Banknote, BarChart3, BedDouble, Beef,
  BookOpen, Boxes, Briefcase, Building, Building2, Bus, Calculator, Calendar, CalendarDays, Camera,
  Car, CheckCheck, CheckCircle2, Church, Clock, Coins, Compass, CreditCard, Cross, DoorOpen,
  Droplet, Droplets, Drumstick, Eye, FileCheck2, Flame, Gift, Globe, Globe2, GraduationCap,
  Hammer, HandCoins, HandHeart, Handshake, Heart, HeartHandshake, HeartPulse, Home, Hospital, Image,
  Info, Landmark, Laptop, Layers, Leaf, Lightbulb, ListChecks, Mail, Map, MapPin, Megaphone, Moon,
  Newspaper, Package, PenTool, Pencil, Phone, PhoneCall, PiggyBank, Recycle, Scale, School, Shield,
  ShieldAlert, ShieldCheck, Shirt, Smartphone, Soup, Sparkles, Sprout, Star, Stethoscope, Sun,
  Syringe, Target, Tent, Thermometer, Timer, Trees, TrendingUp, Trophy, Truck, User, Users,
  Utensils, UtensilsCrossed, Video, Wallet, Wheat, Wind, Zap,
};

/** Common, curated lucide icons exposed for the admin picker. Add freely (must also exist in ICONS). */
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

/** Resolve a lucide icon by name with a safe fallback. Accepts PascalCase, kebab-case or lowercase. */
export function getLucideIcon(name?: string | null): LucideIcon {
  if (!name) return Sparkles;
  const direct = ICONS[name];
  if (direct) return direct;
  const norm = name.toLowerCase().replace(/[-_\s]/g, "");
  const hit = Object.keys(ICONS).find((k) => k.toLowerCase() === norm);
  return hit ? ICONS[hit] : Sparkles;
}

/** All icon names available in this build (PascalCase), for the admin picker. */
export function getAllLucideIconNames(): string[] {
  return Object.keys(ICONS).sort();
}
