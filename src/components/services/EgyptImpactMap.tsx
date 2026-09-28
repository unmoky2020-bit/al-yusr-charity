import { useEffect, useMemo, useState } from "react";
import { Building2, Home, Droplets, Stethoscope, Sparkles, Heart, CheckCircle2, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pin = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  label_ar: string;
  label_en: string;
  lat: number;
  lon: number;
  metric_ar: string;
  metric_en: string;
  note_ar: string;
  note_en: string;
  icon: typeof Building2;
  zoom: number;
};

const PINS: Pin[] = [
  { id: "dak", slug: "dakahlia",     name_ar: "الدقهلية · المنصورة", label_ar: "الدقهلية", name_en: "Dakahlia · Mansoura", label_en: "Dakahlia", lat: 31.036, lon: 31.360,
    metric_ar: "المقر الرئيسي + المجمّع الطبي", metric_en: "HQ + Medical Complex",
    note_ar: "إدارة عامة، قوافل طبية، صرف نقدي شهري للأسر.", note_en: "HQ, medical caravans, monthly cash support for families.", icon: Building2,
    zoom: 10 },
  { id: "shr", slug: "sharqia",      name_ar: "الشرقية", label_ar: "الشرقية", name_en: "Sharqia", label_en: "Sharqia", lat: 30.575, lon: 31.490,
    metric_ar: "قوافل إطعام دورية", metric_en: "Periodic food caravans",
    note_ar: "كرتونة عزومة وتوزيع لحوم بلدي على القرى الأكثر احتياجًا.", note_en: "Food boxes & local meat distribution in the neediest villages.", icon: Sparkles,
    zoom: 9 },
  { id: "kfs", slug: "kafr-elsheikh", name_ar: "كفر الشيخ · الحفير", label_ar: "كفر الشيخ", name_en: "Kafr El-Sheikh · Hafir", label_en: "Kafr El-Sheikh", lat: 31.100, lon: 30.930,
    metric_ar: "مشروع سكن كريم", metric_en: "Sakan Kareem project",
    note_ar: "تسقيف وترميم بيوت الأسر الفقيرة في الحفير والمراكز المجاورة.", note_en: "Roofing & restoring poor families' homes in Hafir & nearby centres.", icon: Home,
    zoom: 9 },
  { id: "fyo", slug: "fayoum",       name_ar: "الفيوم", label_ar: "الفيوم", name_en: "Fayoum", label_en: "Fayoum", lat: 29.300, lon: 30.835,
    metric_ar: "بناء وترميم المساجد", metric_en: "Mosque building & restoration",
    note_ar: "مشاريع عمارة المساجد وصيانتها في القرى.", note_en: "Mosque construction & maintenance projects in villages.", icon: Sparkles,
    zoom: 9 },
  { id: "cai", slug: "cairo",        name_ar: "القاهرة", label_ar: "القاهرة", name_en: "Cairo", label_en: "Cairo", lat: 30.030, lon: 31.225,
    metric_ar: "قوافل طبية وحالات صحية", metric_en: "Medical caravans & health care", note_ar: "متابعة الحالات الصحية وقوافل طبية داخل العاصمة.", note_en: "Health cases follow-up and medical caravans inside the capital.", icon: Stethoscope,
    zoom: 10 },
];

const govPin = (active = false) =>
  L.divIcon({
    className: "yusr-gov-pin",
    iconSize: active ? [22, 22] : [14, 14],
    iconAnchor: active ? [11, 11] : [7, 7],
    popupAnchor: [0, active ? -12 : -8],
    html: `<div class="yusr-marker-glow-wrap${active ? " is-active" : ""}"><div class="yusr-marker-ring"></div><div class="yusr-marker-dot"></div></div>`,
  });

const EGYPT_CENTER: [number, number] = [30.4, 31.2];
const EGYPT_ZOOM = 7.3;

const FlyController = ({ target, userSelected }: { target: { lat: number; lon: number; zoom: number }; userSelected: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (userSelected) {
      map.flyTo([target.lat, target.lon], target.zoom, { duration: 1.1 });
    }
  }, [map, target.lat, target.lon, target.zoom, userSelected]);
  return null;
};

export const EgyptImpactMap = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [active, setActive] = useState<string>("dak");
  const [userSelected, setUserSelected] = useState<boolean>(false);
  const ap = PINS.find((p) => p.id === active) ?? PINS[0];

  const markerLabel = (pin: Pin) => isRTL ? pin.label_ar : pin.label_en;

  const buildDonateHref = (citySlug?: string) => {
    const params = new URLSearchParams({ governorate: ap.slug });
    if (citySlug) params.set("city", citySlug);
    return `/donate?${params.toString()}`;
  };

  const flyTarget = useMemo(
    () => ({ lat: ap.lat, lon: ap.lon, zoom: ap.zoom }),
    [ap.lat, ap.lon, ap.zoom],
  );

  return (
    <section
      id="impact"
      className="pattern-programs relative overflow-hidden py-14 text-foreground md:py-20"
      aria-label={isRTL ? "خريطة أثر اليسر في مصر" : "Al-Yusr impact map"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Soft brand leaf tile overlay matching screenshot */}
      <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />

      <div className="container relative mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-[11px] font-black text-primary">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {isRTL ? "خريطة الأثر الميداني" : "Field Impact Map"}
          </span>
          <h2 className="mt-2.5 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
            {isRTL ? (
              <>بنوصل لكل <span className="text-accent">بيت مستحق</span></>
            ) : (
              <>Reaching every <span className="text-accent">eligible family</span></>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {isRTL
              ? "تواجد دائم في ٥ محافظات — فِرَق محلية بتعرف الأسر بأسمائهم، وخيرك بيوصل في مكانة بأمانة و إحسان."
              : "Permanent presence in 5 governorates — local teams identifying families and delivering support with integrity and excellence."}
          </p>

          {/* Governorate Tabs Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {PINS.map((p) => {
              const isSelected = active === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActive(p.id);
                    setUserSelected(true);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-black transition-all shadow-sm ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-cta scale-105"
                      : "border border-border/80 bg-card text-foreground/80 hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {isRTL ? p.label_ar : p.label_en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Info Sidebar + Map (Map first on mobile) */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1.9fr] lg:items-stretch">

          {/* ── Info Sidebar (Cards) — Order 2 on mobile, Order 1 on desktop ── */}
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            {/* Selected Governorate Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {isRTL ? "المحافظة المختارة" : "Selected Governorate"}
              </span>

              <h3 className="mt-2 text-2xl font-black text-primary">
                {isRTL ? ap.name_ar : ap.name_en}
              </h3>

              <div className="mt-1 text-xs font-black text-accent">
                {isRTL ? ap.metric_ar : ap.metric_en}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {isRTL ? ap.note_ar : ap.note_en}
              </p>

              <div className="mt-6">
                <Button
                  asChild
                  className="h-11 w-full rounded-2xl bg-orange-grad font-black text-accent-foreground shadow-cta transition hover:opacity-95 text-sm"
                >
                  <Link to={buildDonateHref(ap.slug)}>
                    <Heart className="h-4 w-4" />
                    {isRTL ? `تبرع لـ ${ap.label_ar}` : `Donate to ${ap.label_en}`}
                  </Link>
                </Button>
              </div>
            </div>

            {/* How We Work on Ground Card */}
            <div className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-soft">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-primary">
                {isRTL ? "كيف بنشتغل على الأرض" : "How we operate on the ground"}
              </span>

              <ul className="mt-3.5 space-y-2.5 text-xs font-bold leading-relaxed text-foreground/85">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{isRTL ? "فِرَق محلية مقيمة داخل المحافظة." : "Local teams residing within each governorate."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{isRTL ? "بحث وتحقق من الأسر عبر زيارات منزلية واستمارات بحث اجتماعي." : "Field investigation and verification via home visits and social research."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{isRTL ? "توثيق كل عملية صرف بصور وتقارير دورية." : "Photo and report documentation for every disbursement."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{isRTL ? "تنسيق مع جهات موثوقة في القري البعيدة لضمان الوصول لابعد الاماكن." : "Coordination with trusted local entities to reach the most remote areas."}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Map Area — Order 1 on mobile, Order 2 on desktop ── */}
          <div className="order-1 relative min-h-[340px] sm:min-h-[380px] overflow-hidden rounded-3xl border border-border bg-card p-1.5 shadow-[0_18px_50px_-25px_hsl(var(--primary)/0.25)] lg:order-2">
            <div className="h-full min-h-[380px] w-full overflow-hidden rounded-[1.4rem]">
              <MapContainer
                center={EGYPT_CENTER}
                zoom={EGYPT_ZOOM}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  subdomains={["a", "b", "c", "d"]}
                  attribution="&copy; OpenStreetMap contributors, &copy; CARTO"
                />
                <ZoomControl position={isRTL ? "bottomleft" : "bottomright"} />
                <FlyController target={flyTarget} userSelected={userSelected} />

                {PINS.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lon]}
                    icon={govPin(active === p.id)}
                    eventHandlers={{
                      click: () => {
                        setActive(p.id);
                        setUserSelected(true);
                      },
                    }}
                    pane="markerPane"
                  >
                    <Popup offset={[0, active === p.id ? -8 : -5]}>
                      <div className="max-w-[16rem] text-sm leading-tight p-0.5">
                        <div className="font-black text-primary text-base">
                          {isRTL ? p.name_ar : p.name_en}
                        </div>
                        <div className="mt-1 text-xs font-extrabold text-accent">
                          {isRTL ? p.metric_ar : p.metric_en}
                        </div>
                        <p className="mt-1.5 text-xs text-foreground/85 leading-relaxed font-medium">
                          {isRTL ? p.note_ar : p.note_en}
                        </p>
                        <Link
                          to={buildDonateHref(p.slug)}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#d8ff39] px-3.5 py-1.5 text-xs font-black text-primary shadow-[0_10px_30px_-20px_rgba(34,56,18,0.9)] transition hover:brightness-105"
                        >
                          {isRTL ? `تبرع لـ ${markerLabel(p)}` : `Donate to ${markerLabel(p)}`}
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="pointer-events-none absolute bottom-2 start-3 z-[400] rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-bold text-muted-foreground backdrop-blur-sm">
              © OpenStreetMap - CARTO
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EgyptImpactMap;
