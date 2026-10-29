/**
 * Homepage «حالات عاجلة» carousel (backend: HomepageUrgentCasesController, stored in `settings`).
 *   GET /homepage/urgent-cases  public → { settings, data: cases }
 *   PUT /homepage/urgent-cases  admin  → same shape
 * mode "auto"   = approved cases with priority "high" (عاجلة), nearest deadline first
 * mode "manual" = the cases the admin picked, in that order
 */
import { apiFetch, invalidateApiCache, type LaravelCase } from "@/data/laravelApi";
import { mapLaravelCaseToRow, type CaseRow } from "@/data/casesApi";

export interface UrgentCasesSettings {
  is_active: boolean;
  mode: "auto" | "manual";
  case_ids: number[];
  limit: number;
  title_ar?: string | null;
  title_en?: string | null;
  subtitle_ar?: string | null;
  subtitle_en?: string | null;
}

export const DEFAULT_URGENT_SETTINGS: UrgentCasesSettings = {
  is_active: true,
  mode: "auto",
  case_ids: [],
  limit: 8,
  title_ar: "حالات عاجلة محتاجة دعمك",
  title_en: "Urgent cases that need you",
};

type Response = { settings?: Partial<UrgentCasesSettings>; data?: LaravelCase[] };

const read = (res: Response | null) => ({
  settings: { ...DEFAULT_URGENT_SETTINGS, ...(res?.settings ?? {}), case_ids: (res?.settings?.case_ids ?? []).map(Number) },
  cases: (res?.data ?? []).map(mapLaravelCaseToRow) as CaseRow[],
});

export const urgentCasesApi = {
  async get(opts?: { fresh?: boolean }) {
    const res = await apiFetch<Response>("/homepage/urgent-cases", { useCache: !opts?.fresh, ttlMs: 60_000, skipAuthClear: true });
    return read(res);
  },
  async put(settings: UrgentCasesSettings) {
    const res = await apiFetch<Response>("/homepage/urgent-cases", { method: "PUT", body: settings });
    invalidateApiCache("/homepage/urgent-cases");
    return read(res);
  },
};
