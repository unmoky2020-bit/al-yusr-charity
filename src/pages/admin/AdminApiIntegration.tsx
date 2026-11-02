import { useState, useEffect, useCallback } from "react";
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Database,
  Lock,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import {
  API_BASE_URL,
  getApiToken,
  checkAllEndpoints,
  EndpointCheck,
} from "@/data/laravelApi";
import { toast } from "@/hooks/use-toast";

const AdminApiIntegration = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [checks, setChecks] = useState<EndpointCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const token = getApiToken();

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const results = await checkAllEndpoints();
      setChecks(results);
      setLastCheck(new Date());
      toast({ title: isAr ? "تم تحديث فحص الـ API" : "API checks refreshed", description: isAr ? `تم فحص ${results.length} نقطة نهاية بنجاح`
          : `Checked ${results.length} endpoints successfully`,
      });
    } catch {
      toast({ title: isAr ? "خطأ أثناء الفحص" : "Error running checks", variant: "destructive", });
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const total = checks.length;
  const working = checks.filter((c) => c.ok).length;
  const withErrors = checks.filter((c) => !c.ok).length;
  const avgLatency =
    checks.length > 0
      ? Math.round(
          checks.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / checks.length
        )
      : 0;

  const boundMap: Record<string, { status: string; usedIn: string }> = {
    "/profile": { status: "مربوط", usedIn: "AuthContext (استعادة الجلسة والدخول)" },
    "/dashboard": { status: "مربوط", usedIn: "/admin/api-integration + dashboardApi" },
    "/reports": { status: "مربوط", usedIn: "dashboardApi.reports" },
    "/users": { status: "مربوط", usedIn: "/admin/users · /admin/donors" },
    "/roles": { status: "مربوط", usedIn: "usersApi (تعيين/سحب الأدوار)" },
    "/permissions": { status: "مربوط", usedIn: "rolesApi.permissions" },
    "/donors": { status: "جاهز للاستخدام", usedIn: "donorsApi (CRUD جاهز)" },
    "/donations": { status: "جاهز للاستخدام", usedIn: "donationsApiV1 (CRUD جاهز)" },
    "/programs": { status: "جاهز للاستخدام", usedIn: "programsApiV1 (CRUD جاهز)" },
    "/projects": { status: "جاهز للاستخدام", usedIn: "projectsApiV1 (CRUD جاهز)" },
    "/cases": { status: "جاهز للاستخدام", usedIn: "casesApiV1 (CRUD جاهز)" },
    "/articles": { status: "جاهز للاستخدام", usedIn: "articlesApi" },
    "/faqs": { status: "جاهز للاستخدام", usedIn: "faqsApi" },
    "/pages": { status: "جاهز للاستخدام", usedIn: "pagesApi" },
    "/home-statistics": { status: "مربوط (يعمل)", usedIn: "statsApi · الرئيسية" },
    "/achievements": { status: "مربوط (يعمل)", usedIn: "achievementsApi · الرئيسية" },
    "/homepage-content": { status: "مربوط (يعمل)", usedIn: "contentApi.homepage · صفحة إدارة محتوى الهيرو والرئيسية" },
    "/volunteers": { status: "مربوط (يعمل)", usedIn: "volunteersApi · صفحة التطوع ولوحة التحكم" },
    "/volunteer-campaigns": { status: "مربوط (يعمل)", usedIn: "volunteerCampaignsApi · حملات التطوع" },
    "/content-change-requests": { status: "مربوط (يعمل)", usedIn: "contentChangeRequestsApi · مراجعة المحتوى" },
    "/stories": { status: "مربوط (يعمل)", usedIn: "storiesApi · القصص وإدارتها" },
    "/gallery": { status: "مربوط (يعمل)", usedIn: "galleryApi · معرض الصور" },
    "/newsletter": { status: "مربوط (يعمل)", usedIn: "newsletterApi · النشرة البريدية ولوحة التحكم" },
    "/service-categories": { status: "مربوط (يعمل)", usedIn: "serviceCategoriesApi" },
    "/services": { status: "مربوط (يعمل)", usedIn: "laravelServicesApi" },
    "/settings": { status: "غير متاح (خطأ سيرفر 500)", usedIn: "contentApi.settings" },
  };

  return (
    <RequireAuth roles={["admin"]}>
      <AdminLayout
        title={{ ar: "ربط Laravel API", en: "Laravel API Integration" }}
      >
        <div className="space-y-6">
          {/* Top summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard
              label={isAr ? "نقاط النهاية" : "Endpoints"}
              value={total || 18}
              icon={Server}
            />
            <StatCard
              label={isAr ? "تعمل بنجاح" : "Working"}
              value={working}
              icon={CheckCircle2}
            />
            <StatCard
              label={isAr ? "بها مشكلة / خطأ" : "Issues / Errors"}
              value={withErrors}
              icon={AlertTriangle}
            />
            <StatCard
              label={isAr ? "متوسط الاستجابة" : "Avg Latency"}
              value={`${avgLatency} ms`}
              icon={Zap}
            />
          </div>

          {/* Server details & token banner */}
          <Card className="p-4 sm:p-5 border border-primary/20 bg-card shadow-soft rounded-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-primary">
                    {isAr ? "خادم Laravel الأساسي" : "Laravel Base Server"}
                  </h3>
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                    v1 API
                  </Badge>
                </div>
                <code className="block text-xs font-mono text-muted-foreground break-all" dir="ltr">
                  {API_BASE_URL}
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs bg-muted/40">
                  <Lock className="h-3.5 w-3.5 text-accent" />
                  <span>
                    {token
                      ? isAr
                        ? `توكن Sanctum نشط (...${token.slice(-8)})`
                        : `Sanctum Token Active (...${token.slice(-8)})`
                      : isAr
                      ? "لا يوجد توكن جلسة"
                      : "No active token"}
                  </span>
                </div>
                <Button
                  onClick={runCheck}
                  disabled={loading}
                  size="sm"
                  className="rounded-xl bg-orange-grad font-bold text-white shadow-cta gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {isAr ? "إعادة الفحص الآن" : "Recheck Now"}
                </Button>
              </div>
            </div>

            {lastCheck && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                {isAr
                  ? `آخر فحص: ${lastCheck.toLocaleTimeString("ar-EG")}`
                  : `Last checked: ${lastCheck.toLocaleTimeString()}`}
              </p>
            )}
          </Card>

          {/* Endpoints Table */}
          <Card className="overflow-hidden border border-border/80 bg-card shadow-soft rounded-2xl">
            <div className="border-b border-border/70 p-4 sm:p-5 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-primary text-base">
                  {isAr ? "جدول نقاط النهاية والحالة المباشرة" : "Endpoints Status Table"}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {isAr ? "يستخدم توكن الجلسة الحالية" : "Uses current session token"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[11px] sm:text-xs">
                    <th className="p-3 text-start">{isAr ? "المسار" : "Path"}</th>
                    <th className="p-3 text-start">{isAr ? "الوظيفة" : "Function"}</th>
                    <th className="p-3 text-start">{isAr ? "حالة الربط" : "Binding Status"}</th>
                    <th className="p-3 text-start">{isAr ? "مستخدم في" : "Used in"}</th>
                    <th className="p-3 text-end">{isAr ? "الاستجابة والزمن" : "Response & Latency"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {checks.map((c) => {
                    const info = boundMap[c.path] || { status: "متاح", usedIn: "laravelApi" };
                    const is500 = c.status === 500;
                    const is200 = c.status === 200;

                    return (
                      <tr key={c.path} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-primary flex items-center gap-1.5" dir="ltr">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">
                            {c.method}
                          </Badge>
                          <span>{c.path}</span>
                        </td>
                        <td className="p-3 font-semibold text-foreground">{c.name}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              is500
                                ? "bg-red-500/10 text-red-700"
                                : info.status.includes("مربوط")
                                ? "bg-emerald-500/15 text-emerald-800"
                                : "bg-blue-500/15 text-blue-800"
                            }`}
                          >
                            {is500 ? (
                              <XCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            )}
                            {info.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground font-medium">{info.usedIn}</td>
                        <td className="p-3 text-end">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                                is200
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {c.status}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">{c.latencyMs}ms</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Notes & Reference Card */}
          <Card className="p-5 border border-border bg-card shadow-soft rounded-2xl space-y-3">
            <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              {isAr ? "ملاحظات الربط ومواصفات الـ API" : "API Integration Specs"}
            </h4>
            <ul className="text-xs space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                <strong>المصادقة:</strong> Laravel Sanctum عبر Bearer Token محفوظ في <code>localStorage</code> باسم <code>alyusr_api_token</code>.
              </li>
              <li>
                <strong>اللغة والترويسات:</strong> كل الطلبات ترسل <code>Accept-Language</code> طبقاً للغة الواجهة (ar/en) و<code>Accept: application/json</code>.
              </li>
              <li>
                <strong>حساب المدير:</strong> بيانات الدخول لا تُكتب في الكود ولا في الواجهة؛ تُحفظ في مدير كلمات المرور الخاص بالفريق.
              </li>
              <li>
                <strong>التعامل مع الأخطاء:</strong> عند رجوع كود <code>401</code> يتم تنظيف التوكن تلقائياً وتحويل المستخدم للدخول.
              </li>
            </ul>
          </Card>
        </div>
      </AdminLayout>
    </RequireAuth>
  );
};

export default AdminApiIntegration;
