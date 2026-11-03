import { useParams, Navigate } from "react-router-dom";
import { Building2, HardHat, Hammer, Heart, BookOpen, MapPin, ShieldCheck, Truck, Sparkles, Users, Droplets, Wrench, Pipette, Sprout, Beef, Stethoscope, Home, Bed, Construction, KeyRound, Snowflake, Recycle, Refrigerator, Wind, Activity, GraduationCap, HandCoins, Gift, UtensilsCrossed, Package, Calendar } from "lucide-react";
import { ServicePage, type ServicePageConfig } from "@/components/services/ServicePage";
import { useServicePage } from "@/data/sources/services";
import { useServiceDetail } from "@/hooks/useServices";
import { useSettled } from "@/hooks/useCampaignPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { LandingPageSkeleton } from "@/components/common/ContentSkeletons";

const ICON_MAP: Record<string, any> = {
  Building2, HardHat, Hammer, Heart, BookOpen, MapPin, ShieldCheck, Truck, Sparkles, Users, Droplets, Wrench, Pipette, Sprout, Beef, Stethoscope, Home, Bed, Construction, KeyRound, Snowflake, Recycle, Refrigerator, Wind, Activity, GraduationCap, HandCoins, Gift, UtensilsCrossed, Package, Calendar
};

function resolveIcon(icon: any) {
  if (typeof icon === "string") return ICON_MAP[icon] || Heart;
  if (icon && typeof icon === "object") {
    // If it's a React element or forwardRef component
    if (icon.$$typeof || typeof icon.render === "function") return icon;
    // If it's a JSON object with name property
    if (typeof icon.name === "string" && ICON_MAP[icon.name]) return ICON_MAP[icon.name];
    if (typeof icon.icon === "string" && ICON_MAP[icon.icon]) return ICON_MAP[icon.icon];
    return Heart;
  }
  if (typeof icon === "function") return icon;
  return Heart;
}

const ServiceRouter = () => {
  const { slug = "" } = useParams();
  const { data: remoteDetail, isLoading } = useServiceDetail(slug);
  const { servicePage: staticConfig, isLoading: listLoading } = useServicePage(slug);
  // Wait for the dashboard copy (or a short timeout) so the built-in text and photo never show first.
  const ready = useSettled(!isLoading && !listLoading);

  if (!ready) {
    return (
      <PageLayout>
        <LandingPageSkeleton />
      </PageLayout>
    );
  }

  // Fall back to static config if remote isn't ready or hasn't override features
  const configSource = remoteDetail || staticConfig;
  if (!configSource) return <Navigate to="/services-map" replace />;

  const features = (configSource.features || staticConfig?.features || []).map((f: any) => ({
    Icon: resolveIcon(f.Icon || f.icon),
    t_ar: f.t_ar,
    t_en: f.t_en,
    d_ar: f.d_ar,
    d_en: f.d_en,
  }));

  const fullConfig: ServicePageConfig = {
    slug: configSource.slug,
    programSlug: configSource.programSlug || staticConfig?.programSlug || configSource.slug,
    hero: configSource.hero || staticConfig?.hero || "",
    badge_ar: configSource.badge_ar || staticConfig?.badge_ar || "",
    badge_en: configSource.badge_en || staticConfig?.badge_en || "",
    title_ar: configSource.title_ar || staticConfig?.title_ar || "",
    title_en: configSource.title_en || staticConfig?.title_en || "",
    intro_ar: configSource.intro_ar || staticConfig?.intro_ar || "",
    intro_en: configSource.intro_en || staticConfig?.intro_en || "",
    seo_title_ar: configSource.seo_title_ar || staticConfig?.seo_title_ar || configSource.title_ar,
    seo_title_en: configSource.seo_title_en || staticConfig?.seo_title_en || configSource.title_en,
    seo_desc_ar: configSource.seo_desc_ar || staticConfig?.seo_desc_ar || configSource.intro_ar,
    seo_desc_en: configSource.seo_desc_en || staticConfig?.seo_desc_en || configSource.intro_en,
    bullets_ar: configSource.bullets_ar || staticConfig?.bullets_ar || [],
    bullets_en: configSource.bullets_en || staticConfig?.bullets_en || [],
    stats: configSource.stats || staticConfig?.stats || [],
    features,
    tiers: (configSource.tiers || staticConfig?.tiers || []) as any,
    related: configSource.related || staticConfig?.related || [],
  };

  return <ServicePage config={fullConfig} />;
};

export default ServiceRouter;
