import { useEffect, lazy, Suspense, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigationType, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/i18n/LangContext";
import { AuthProvider } from "@/auth/AuthContext";
import { bindAnchorClickTracker, track } from "@/lib/track";
const Index = lazy(() => import("./pages/Index.tsx"));
import { SmoothScroll } from "@/components/common/SmoothScroll";
const CampaignPageGate = lazy(() => import("@/components/common/PageGates").then((m) => ({ default: m.CampaignPageGate })));
const ProjectPageGate = lazy(() => import("@/components/common/PageGates").then((m) => ({ default: m.ProjectPageGate })));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail.tsx"));
const ProgramOptionDetail = lazy(() => import("./pages/ProgramOptionDetail.tsx"));
const GeoProgram = lazy(() => import("./pages/GeoProgram.tsx"));
const CityProgram = lazy(() => import("./pages/CityProgram.tsx"));
const DonatePage = lazy(() => import("./pages/DonatePage.tsx"));
const QurbaniLanding = lazy(() => import("./pages/QurbaniLanding.tsx"));
const QurbaniCity = lazy(() => import("./pages/QurbaniCity.tsx"));
const QurbaniConfirm = lazy(() => import("./pages/QurbaniConfirm.tsx"));
const DonateCity = lazy(() => import("./pages/site/DonateCity.tsx"));
const About = lazy(() => import("./pages/site/About.tsx"));
const Contact = lazy(() => import("./pages/site/Contact.tsx"));
const Stories = lazy(() => import("./pages/site/Stories.tsx"));
const Projects = lazy(() => import("./pages/site/Projects.tsx"));
const ProjectsPage = lazy(() => import("./pages/site/ProjectsPage.tsx"));
const ProjectDetail = lazy(() => import("./pages/site/ProjectDetail.tsx"));
const Cases = lazy(() => import("./pages/site/Cases.tsx"));
const CaseDetail = lazy(() => import("./pages/site/CaseDetail.tsx"));
const Zakat = lazy(() => import("./pages/site/Zakat.tsx"));
const ServicesMap = lazy(() => import("./pages/site/ServicesMap.tsx"));
const Gallery = lazy(() => import("./pages/site/Gallery.tsx"));
const Privacy = lazy(() => import("./pages/site/Privacy.tsx"));
const Terms = lazy(() => import("./pages/site/Terms.tsx"));
const Volunteer = lazy(() => import("./pages/site/Volunteer.tsx"));
const Farm = lazy(() => import("./pages/site/Farm.tsx"));
const Trust = lazy(() => import("./pages/site/Trust.tsx"));
const DonationTracking = lazy(() => import("./pages/DonationTracking.tsx"));
const DonorDashboard = lazy(() => import("./pages/DonorDashboard.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.tsx"));
const BlogCategory = lazy(() => import("./pages/BlogCategory.tsx"));
const BlogAuthor = lazy(() => import("./pages/BlogAuthor.tsx"));
const AdminBlogSeo = lazy(() => import("./pages/admin/AdminBlogSeo.tsx"));
const AdminBlogPostEdit = lazy(() => import("./pages/admin/AdminBlogPostEdit.tsx"));
const Login = lazy(() => import("./pages/auth/Login.tsx"));
const RegisterVolunteer = lazy(() => import("./pages/auth/RegisterVolunteer.tsx"));
const RegisterDonor = lazy(() => import("./pages/auth/RegisterDonor.tsx"));
const Register = lazy(() => import("./pages/auth/Register.tsx"));
const Profile = lazy(() => import("./pages/auth/Profile.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics.tsx"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations.tsx"));
const AdminDonationsAudit = lazy(() => import("./pages/admin/AdminDonationsAudit.tsx"));
const AdminCases = lazy(() => import("./pages/admin/AdminCases.tsx"));
const AdminCaseDetail = lazy(() => import("./pages/admin/AdminCaseDetail.tsx"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects.tsx"));
const AdminProjectDetail = lazy(() => import("./pages/admin/AdminProjectDetail.tsx"));
const AdminPrograms = lazy(() => import("./pages/admin/AdminPrograms.tsx"));
const AdminProgramDetail = lazy(() => import("./pages/admin/AdminProgramDetail.tsx"));
const AdminHomepageContent = lazy(() => import("./pages/admin/AdminHomepageContent.tsx"));
const AdminAboutUs = lazy(() => import("./pages/admin/AdminAboutUs.tsx"));
const AdminAxes = lazy(() => import("./pages/admin/AdminAxes.tsx"));
const AdminAxisDetail = lazy(() => import("./pages/admin/AdminAxisDetail.tsx"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent.tsx"));
const AdminContentReview = lazy(() => import("./pages/admin/AdminContentReview.tsx"));
const AdminMyTasks = lazy(() => import("./pages/admin/AdminMyTasks.tsx"));
const AdminMyCases = lazy(() => import("./pages/admin/AdminMyCases.tsx"));
const AdminDelegates = lazy(() => import("./pages/admin/AdminDelegates.tsx"));
const AdminVolunteers = lazy(() => import("./pages/admin/AdminVolunteers.tsx"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns.tsx"));
const AdminCampaignDetail = lazy(() => import("./pages/admin/AdminCampaignDetail.tsx"));
const AdminDonors = lazy(() => import("./pages/admin/AdminDonors.tsx"));
const AdminDonorDetail = lazy(() => import("./pages/admin/AdminDonorDetail.tsx"));
const AdminDonationDetail = lazy(() => import("./pages/admin/AdminDonationDetail.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile.tsx"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter.tsx"));
const AdminNewsletterCampaigns = lazy(() => import("./pages/admin/AdminNewsletterCampaigns.tsx"));
const AdminPaymentTransactions = lazy(() => import("./pages/admin/AdminPaymentTransactions.tsx"));
const AdminAdCampaigns = lazy(() => import("./pages/admin/AdminAdCampaigns.tsx"));
const AdminCampaignResults = lazy(() => import("./pages/admin/AdminCampaignResults.tsx"));
const AdminSiteStats = lazy(() => import("./pages/admin/AdminSiteStats.tsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.tsx"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery.tsx"));
const AdminMediaLibrary = lazy(() => import("./pages/admin/AdminMediaLibrary.tsx"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications.tsx"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox.tsx"));
const AdminActivityLog = lazy(() => import("./pages/admin/AdminActivityLog.tsx"));
const AdminPermissions = lazy(() => import("./pages/admin/AdminPermissions.tsx"));
const AdminContentEditor = lazy(() => import("./pages/admin/AdminContentEditor.tsx"));
const AdminCampaignsSection = lazy(() => import("./pages/admin/AdminCampaignsSection.tsx"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods.tsx"));
const AdminPaymentMethodDetail = lazy(() => import("./pages/admin/AdminPaymentMethodDetail.tsx"));
const AdLanding = lazy(() => import("./pages/AdLanding.tsx"));
const HeroBreakpointTest = lazy(() => import("./pages/HeroBreakpointTest.tsx"));
const DonationStatus = lazy(() => import("./pages/DonationStatus.tsx"));
const NewsletterAction = lazy(() => import("./pages/NewsletterAction.tsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.tsx"));
const Campaigns = lazy(() => import("./pages/site/Campaigns.tsx"));
const CampaignDetail = lazy(() => import("./pages/site/CampaignDetail.tsx"));
const SeasonDetail = lazy(() => import("./pages/site/SeasonDetail.tsx"));
const AdminSeasons = lazy(() => import("./pages/admin/AdminSeasons.tsx"));
const ServiceRouter = lazy(() => import("./pages/site/services/ServiceRouter.tsx"));
const AxisDetail = lazy(() => import("./pages/site/AxisDetail.tsx"));
const StoryDetail = lazy(() => import("./pages/site/StoryDetail.tsx"));
const AdminStories = lazy(() => import("./pages/admin/AdminStories.tsx"));
const AdminStoryEdit = lazy(() => import("./pages/admin/AdminStoryEdit.tsx"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices.tsx"));
const AdminDonationCampaigns = lazy(() => import("./pages/admin/AdminDonationCampaigns.tsx"));
const AdminDonationCampaignDetail = lazy(() => import("./pages/admin/AdminDonationCampaignDetail.tsx"));
const MarkounLanding = lazy(() => import("./pages/landings/MarkounLanding.tsx"));
const CharityMansouraLanding = lazy(() => import("./pages/landings/CharityMansouraLanding.tsx"));
const FoodBoxLanding = lazy(() => import("./pages/landings/FoodBoxLanding.tsx"));
const QurbaniGuaranteeLanding = lazy(() => import("./pages/landings/QurbaniGuaranteeLanding.tsx"));
const KhabiaLanding = lazy(() => import("./pages/landings/KhabiaLanding.tsx"));
const DhillLanding = lazy(() => import("./pages/landings/DhillLanding.tsx"));
const SetrLanding = lazy(() => import("./pages/landings/SetrLanding.tsx"));
const AtharLanding = lazy(() => import("./pages/landings/AtharLanding.tsx"));
const RamadanLanding = lazy(() => import("./pages/landings/RamadanLanding.tsx"));
const ArbounLanding = lazy(() => import("./pages/landings/ArbounLanding.tsx"));
const TakrimLanding = lazy(() => import("./pages/landings/TakrimLanding.tsx"));
const WaterLanding = lazy(() => import("./pages/landings/WaterLanding.tsx"));
const NurseriesLanding = lazy(() => import("./pages/landings/NurseriesLanding.tsx"));
const MedicalLanding = lazy(() => import("./pages/landings/MedicalLanding.tsx"));
const AshrLanding = lazy(() => import("./pages/landings/AshrLanding.tsx"));
const Misbaha = lazy(() => import("./pages/site/Misbaha.tsx"));
const CampaignsPage = lazy(() => import("./pages/site/CampaignsPage.tsx"));
const FaqCenter = lazy(() => import("./pages/site/FaqCenter.tsx"));
const AdminFaqs = lazy(() => import("./pages/admin/AdminFaqs.tsx"));
import { RequireAuth } from "./auth/RequireAuth";

const queryClient = new QueryClient();

/* ── Scroll memory ──────────────────────────────────────────────────────────
 * Every history entry remembers where the visitor was on the page (sessionStorage, per tab).
 * Back / Forward (POP) returns to that spot, also after a full reload or coming back from
 * another site. A new navigation (link click) starts at the top, or at the #hash target. */
const SCROLL_KEY = (key: string) => `yusr-scroll:${key}`;
const readScroll = (key: string): number | null => {
  try { const v = sessionStorage.getItem(SCROLL_KEY(key)); return v === null ? null : Number(v) || 0; } catch { return null; }
};
const writeScroll = (key: string, y: number) => {
  try { sessionStorage.setItem(SCROLL_KEY(key), String(Math.round(y))); } catch { void 0; }
};
/** Pages render lazily and fetch their data, so the target may not exist yet: keep trying until the
 *  page is tall enough (max ~4 s), and stop as soon as the visitor scrolls on their own. */
const restoreScroll = (y: number) => {
  let cancelled = false;
  const stop = () => { cancelled = true; };
  const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
  const started = performance.now();
  const attempt = () => {
    if (cancelled) return;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.min(y, Math.max(0, maxY)));
    const reached = Math.abs(window.scrollY - y) < 4;
    if (!reached && performance.now() - started < 4000) setTimeout(attempt, 60);
    else events.forEach((e) => window.removeEventListener(e, stop));
  };
  requestAnimationFrame(attempt);
};
const initialLoadRestores = () => {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === "reload" || nav?.type === "back_forward";
  } catch { return false; }
};

const RouteTracker = () => {
  const loc = useLocation();
  const navType = useNavigationType();
  const didInitScroll = useRef(false);
  const pageViewSent = useRef(false);
  const currentKey = useRef(loc.key);
  /** Last scroll position of the current entry (kept in memory every scroll, stored on pause/leave). */
  const lastY = useRef<number | null>(null);
  useEffect(() => {
    bindAnchorClickTracker();
    try { if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual"; } catch { void 0; }
    // Remember the position of the current entry while the visitor scrolls.
    let raf = 0;
    // While a navigation is in flight the history entry has already changed but this component has
    // not caught up yet; the old page shrinking fires scroll events then, which must not be saved.
    const settled = () => {
      const k = (window.history.state as { key?: string } | null)?.key;
      return !k || k === currentKey.current;
    };
    // Saved when scrolling pauses (and on pagehide), not on every frame: no main-thread work while the
    // visitor scrolls (matters on iPhone with the pinned home carousel).
    const onScroll = () => {
      if (raf) window.clearTimeout(raf);
      if (!settled()) return;
      lastY.current = window.scrollY;
      raf = window.setTimeout(() => { raf = 0; if (settled()) writeScroll(currentKey.current, window.scrollY); }, 150);
    };
    const onHide = () => { if (settled()) writeScroll(currentKey.current, window.scrollY); };
    // A click (link, button that navigates) is saved immediately, in the capture phase — before the
    // router changes the page — so a quick scroll-then-tap still returns to the right place.
    const onIntent = () => {
      if (!settled()) return;
      lastY.current = window.scrollY;
      writeScroll(currentKey.current, window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("click", onIntent, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("click", onIntent, true);
      if (raf) window.clearTimeout(raf);
    };
  }, []);
  useEffect(() => {
    // Store where the visitor left the previous page, even if they navigated within the save delay.
    // Only when a position was actually seen on that page, so a stale value never overwrites a good save.
    if (currentKey.current !== loc.key && lastY.current !== null) writeScroll(currentKey.current, lastY.current);
    currentKey.current = loc.key;
    lastY.current = null;
    if (typeof window !== "undefined") {
      const isFirst = !didInitScroll.current;
      const saved = readScroll(loc.key);
      if (navType === "POP" && saved !== null && (!isFirst || initialLoadRestores())) {
        // Back / Forward / reload: return to where the visitor was.
        restoreScroll(saved);
      } else if (loc.hash) {
        // Defer hash scroll so the new page renders first, then jump (no smooth).
        const id = loc.hash.slice(1);
        requestAnimationFrame(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
          else window.scrollTo(0, 0);
        });
      } else if (!isFirst) {
        // A new page: start at the top. (Not on the very first render: fast mobile users may already be scrolling.)
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      didInitScroll.current = true;
    }
    // The first PageView is sent by the pixel snippet in index.html; only in-app page changes are sent here,
    // so Meta never counts the landing page twice.
    const firstView = !pageViewSent.current;
    pageViewSent.current = true;
    track("page_view", {
      fbEvent: firstView ? undefined : "PageView",
      fbCustom: false,
      payload: { path: loc.pathname, search: loc.search },
    });
  }, [loc.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <SmoothScroll />
              <RouteTracker />
              <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-primary"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" aria-label="loading" /></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/programs" element={<Projects />} />
                  <Route path="/programs/volunteer" element={<Navigate to="/volunteer" replace />} />
                  <Route path="/programs/:slug" element={<ProgramDetail />} />
                  <Route path="/programs/:slug/:option" element={<ProgramOptionDetail />} />
                  <Route path="/geo/:governorate/:program" element={<GeoProgram />} />
                  <Route path="/dakahlia/:city/:program" element={<CityProgram />} />
                  <Route path="/qurbani" element={<QurbaniLanding />} />
                  <Route path="/qurbani/confirm" element={<QurbaniConfirm />} />
                  <Route path="/qurbani/:city" element={<QurbaniCity />} />
                  <Route path="/donate" element={<DonatePage />} />
                  <Route path="/donate/:city" element={<DonateCity />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/stories/:slug" element={<StoryDetail />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/cases/:ref" element={<CaseDetail />} />
                  <Route path="/zakat" element={<Zakat />} />
                  <Route path="/services-map" element={<ServicesMap />} />
                  {/* 301-style redirect for retired daily-feeding page → services map */}
                  <Route path="/services/daily-feeding" element={<Navigate to="/services-map" replace />} />
                  <Route path="/services/:slug" element={<ServiceRouter />} />
                  <Route path="/axes/:slug" element={<AxisDetail />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/volunteer" element={<Volunteer />} />
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  <Route path="/campaign" element={<CampaignsPage />} />
                  <Route path="/volunteer-campaigns" element={<Campaigns />} />
                  <Route path="/volunteer/campaigns" element={<Campaigns />} />
                  <Route path="/campaigns/:slug" element={<CampaignDetail />} />
                  <Route path="/seasons/:slug" element={<SeasonDetail />} />
                  <Route path="/c/:slug" element={<AdLanding />} />
                  {import.meta.env.DEV && <Route path="/dev/hero-breakpoints" element={<HeroBreakpointTest />} />}
                  <Route path="/farm" element={<ProjectPageGate slug="waqf"><Farm /></ProjectPageGate>} />
                  <Route path="/trust" element={<Trust />} />
                  <Route path="/markoun" element={<CampaignPageGate slug="markoun"><MarkounLanding /></CampaignPageGate>} />
                  <Route path="/food-box" element={<CampaignPageGate slug="food"><FoodBoxLanding /></CampaignPageGate>} />
                  <Route path="/qurbani-guarantee" element={<QurbaniGuaranteeLanding />} />
                  <Route path="/khabia" element={<KhabiaLanding />} />
                  <Route path="/dhill" element={<CampaignPageGate slug="dhill"><DhillLanding /></CampaignPageGate>} />
                  <Route path="/setr" element={<CampaignPageGate slug="setr"><SetrLanding /></CampaignPageGate>} />
                  <Route path="/athar" element={<CampaignPageGate slug="athar"><AtharLanding /></CampaignPageGate>} />
                  <Route path="/education-campaign" element={<CampaignPageGate slug="athar"><AtharLanding /></CampaignPageGate>} />
                  <Route path="/ramadan" element={<CampaignPageGate slug="ramadan"><RamadanLanding /></CampaignPageGate>} />
                  <Route path="/arboun" element={<CampaignPageGate slug="arboun"><ArbounLanding /></CampaignPageGate>} />
                  <Route path="/takrim" element={<TakrimLanding />} />
                  <Route path="/water" element={<WaterLanding />} />
                  <Route path="/nurseries" element={<NurseriesLanding />} />
                  <Route path="/medical" element={<MedicalLanding />} />
                  <Route path="/ten-days" element={<CampaignPageGate slug="ashr"><AshrLanding /></CampaignPageGate>} />
                  <Route path="/ashr" element={<Navigate to="/ten-days" replace />} />
                  <Route path="/misbaha" element={<Misbaha />} />
                  <Route path="/misbaha/:slug" element={<Misbaha />} />
                  <Route path="/tasbih" element={<Navigate to="/misbaha" replace />} />
                  <Route path="/freelancers" element={<CampaignPageGate slug="arboun"><ArbounLanding /></CampaignPageGate>} />
                  <Route path="/donate/track/:ref" element={<DonationTracking />} />
                  <Route path="/donate/track" element={<DonationTracking />} />
                  <Route path="/dashboard" element={<RequireAuth><DonorDashboard /></RequireAuth>} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/category/:slug" element={<BlogCategory />} />
                  <Route path="/blog/author/:slug" element={<BlogAuthor />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/faqs" element={<FaqCenter />} />
                  <Route path="/faq" element={<Navigate to="/faqs" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register/volunteer" element={<RegisterVolunteer />} />
                  <Route path="/register/donor" element={<RegisterDonor />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register/editor" element={<Register />} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

                  <Route path="/admin" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminDashboard /></RequireAuth>} />
                  <Route path="/admin/analytics" element={<RequireAuth roles={["admin", "caseworker"]}><AdminAnalytics /></RequireAuth>} />
                  <Route path="/admin/faqs" element={<RequireAuth roles={["admin", "editor"]}><AdminFaqs /></RequireAuth>} />
                  <Route path="/admin/donations" element={<RequireAuth roles={["admin", "caseworker"]}><AdminDonations /></RequireAuth>} />
                  <Route path="/admin/donations/audit" element={<RequireAuth roles={["admin"]}><AdminDonationsAudit /></RequireAuth>} />
                  <Route path="/admin/cases" element={<RequireAuth roles={["admin", "caseworker", "volunteer"]}><AdminCases /></RequireAuth>} />
                  <Route path="/admin/cases/:id" element={<RequireAuth roles={["admin", "caseworker", "volunteer"]}><AdminCaseDetail /></RequireAuth>} />
                  <Route path="/admin/projects" element={<RequireAuth roles={["admin", "caseworker"]}><AdminProjects /></RequireAuth>} />
                  <Route path="/admin/projects/new" element={<RequireAuth roles={["admin", "caseworker"]}><AdminProjectDetail /></RequireAuth>} />
                  <Route path="/admin/projects/:id" element={<RequireAuth roles={["admin", "caseworker"]}><AdminProjectDetail /></RequireAuth>} />
                  <Route path="/admin/programs" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminPrograms /></RequireAuth>} />
                  <Route path="/admin/programs/new" element={<RequireAuth roles={["admin", "editor"]}><AdminProgramDetail /></RequireAuth>} />
                  <Route path="/admin/programs/:id" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminProgramDetail /></RequireAuth>} />
                  <Route path="/admin/programs-carousel" element={<Navigate to="/admin/campaigns-section" replace />} />
                  <Route path="/admin/homepage-content" element={<RequireAuth roles={["admin", "editor"]}><AdminHomepageContent /></RequireAuth>} />
                  <Route path="/admin/about-us" element={<RequireAuth roles={["admin", "editor"]}><AdminAboutUs /></RequireAuth>} />
                  <Route path="/admin/axes" element={<RequireAuth roles={["admin", "editor"]}><AdminAxes /></RequireAuth>} />
                  <Route path="/admin/axes/:id" element={<RequireAuth roles={["admin", "editor"]}><AdminAxisDetail /></RequireAuth>} />
                  <Route path="/admin/content" element={<RequireAuth roles={["admin", "editor"]}><AdminContent /></RequireAuth>} />
                  <Route path="/admin/content-editor" element={<RequireAuth roles={["admin", "editor"]}><AdminContentEditor /></RequireAuth>} />
                  <Route path="/admin/campaigns-section" element={<RequireAuth roles={["admin", "editor"]}><AdminCampaignsSection /></RequireAuth>} />
                  <Route path="/admin/review" element={<RequireAuth roles={["admin", "editor"]}><AdminContentReview /></RequireAuth>} />
                  <Route path="/admin/my-tasks" element={<RequireAuth roles={["admin", "volunteer", "editor", "caseworker"]}><AdminMyTasks /></RequireAuth>} />
                  <Route path="/admin/my-cases" element={<RequireAuth roles={["admin", "caseworker", "volunteer"]}><AdminMyCases /></RequireAuth>} />
                  <Route path="/admin/delegates" element={<RequireAuth roles={["admin", "caseworker"]}><AdminDelegates /></RequireAuth>} />
                  <Route path="/admin/volunteers" element={<RequireAuth roles={["admin", "caseworker"]}><AdminVolunteers /></RequireAuth>} />
                  <Route path="/admin/campaigns" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminCampaigns /></RequireAuth>} />
                  <Route path="/admin/campaigns/new" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminCampaignDetail /></RequireAuth>} />
                  <Route path="/admin/campaigns/:id" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminCampaignDetail /></RequireAuth>} />
                  <Route path="/admin/donors" element={<RequireAuth roles={["admin", "caseworker"]}><AdminDonors /></RequireAuth>} />
                  <Route path="/admin/donors/:id" element={<RequireAuth roles={["admin"]}><AdminDonorDetail /></RequireAuth>} />
                  <Route path="/admin/donations/:id" element={<RequireAuth roles={["admin", "caseworker"]}><AdminDonationDetail /></RequireAuth>} />
                  <Route path="/admin/users" element={<RequireAuth roles={["admin"]}><AdminUsers /></RequireAuth>} />
                  <Route path="/admin/payment-methods" element={<RequireAuth roles={["admin"]}><AdminPaymentMethods /></RequireAuth>} />
                  <Route path="/admin/payment-methods/:id" element={<RequireAuth roles={["admin"]}><AdminPaymentMethodDetail /></RequireAuth>} />
                  <Route path="/admin/permissions" element={<RequireAuth roles={["admin"]}><AdminPermissions /></RequireAuth>} />
                  <Route path="/admin/activity" element={<RequireAuth roles={["admin"]}><AdminActivityLog /></RequireAuth>} />
                  <Route path="/admin/blog-seo" element={<RequireAuth roles={["admin", "editor"]}><AdminBlogSeo /></RequireAuth>} />
                  <Route path="/admin/blog-seo/:slug" element={<RequireAuth roles={["admin", "editor"]}><AdminBlogPostEdit /></RequireAuth>} />
                  <Route path="/admin/stories" element={<RequireAuth roles={["admin", "editor"]}><AdminStories /></RequireAuth>} />
                  <Route path="/admin/stories/new" element={<RequireAuth roles={["admin", "editor"]}><AdminStoryEdit /></RequireAuth>} />
                  <Route path="/admin/stories/:id" element={<RequireAuth roles={["admin", "editor"]}><AdminStoryEdit /></RequireAuth>} />
                  <Route path="/admin/donation-campaigns" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminDonationCampaigns /></RequireAuth>} />
                  <Route path="/admin/donation-campaigns/new" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminDonationCampaignDetail /></RequireAuth>} />
                  <Route path="/admin/donation-campaigns/:id" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminDonationCampaignDetail /></RequireAuth>} />
                  <Route path="/admin/services" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminDonationCampaigns /></RequireAuth>} />
                  <Route path="/admin/services/:slug" element={<RequireAuth roles={["admin", "editor", "caseworker"]}><AdminDonationCampaigns /></RequireAuth>} />
                  <Route path="/admin/profile" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminProfile /></RequireAuth>} />
                  <Route path="/admin/newsletter" element={<RequireAuth roles={["admin"]}><AdminNewsletter /></RequireAuth>} />
                  <Route path="/admin/newsletter/campaigns" element={<RequireAuth roles={["admin"]}><AdminNewsletterCampaigns /></RequireAuth>} />
                  <Route path="/admin/transactions" element={<RequireAuth roles={["admin", "caseworker"]}><AdminPaymentTransactions /></RequireAuth>} />
                  <Route path="/admin/ad-campaigns" element={<RequireAuth roles={["admin", "editor"]}><AdminAdCampaigns /></RequireAuth>} />
                  <Route path="/admin/campaign-results" element={<RequireAuth roles={["admin", "editor"]}><AdminCampaignResults /></RequireAuth>} />
                  <Route path="/admin/site-stats" element={<RequireAuth roles={["admin", "editor"]}><AdminSiteStats /></RequireAuth>} />
                  <Route path="/admin/gallery" element={<RequireAuth roles={["admin"]}><AdminGallery /></RequireAuth>} />
                  <Route path="/admin/media" element={<RequireAuth roles={["admin", "editor"]}><AdminMediaLibrary /></RequireAuth>} />
                  <Route path="/admin/inbox" element={<RequireAuth roles={["admin", "editor"]}><AdminInbox /></RequireAuth>} />
                  <Route path="/admin/notifications" element={<RequireAuth roles={["admin", "editor", "caseworker", "volunteer"]}><AdminNotifications /></RequireAuth>} />
                  <Route path="/admin/reports" element={<RequireAuth roles={["admin", "caseworker"]}><AdminReports /></RequireAuth>} />
                  <Route path="/admin/seasons" element={<RequireAuth roles={["admin", "editor"]}><AdminSeasons /></RequireAuth>} />
                  <Route path="/donate/status" element={<DonationStatus />} />
                  <Route path="/donate/status/:ref" element={<DonationStatus />} />
                  <Route path="/payment/success" element={<DonationStatus />} />
                  <Route path="/payment/failed" element={<DonationStatus />} />
                  <Route path="/payment/callback" element={<DonationStatus />} />
                  <Route path="/newsletter/confirm" element={<NewsletterAction action="confirm" />} />
                  <Route path="/newsletter/unsubscribe" element={<NewsletterAction action="unsubscribe" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
