import { absoluteSiteUrl } from "@/lib/site-runtime";

/** Public case link (https://elyusr.org/cases/CODE); with `source`, UTM tags so analytics show which platform brought each donation. */
export const caseShareUrl = (code: string, source?: string) => {
  const base = absoluteSiteUrl(`/cases/${encodeURIComponent(code)}`);
  return source
    ? `${base}?utm_source=${source}&utm_medium=social&utm_campaign=case-${encodeURIComponent(code.toLowerCase())}`
    : base;
};
