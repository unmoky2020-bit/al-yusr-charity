export const PRIMARY_DOMAIN = "elyusr.org";
export const WWW_DOMAIN = `www.${PRIMARY_DOMAIN}`;
export const PRIMARY_ORIGIN = `https://${PRIMARY_DOMAIN}`;

/**
 * Hosting-preview domains that must never become the canonical origin
 * (old Lovable previews). Absolute URLs generated on them point at PRIMARY_ORIGIN.
 */
export const PREVIEW_DOMAIN_SUFFIXES = ["lovable.app", "lovableproject.com"];

const trimSlashes = (value: string) => value.replace(/^\/+/, "");

export const normalizePath = (path = "/") => {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return `/${trimSlashes(path)}`;
};

export const isPreviewHost = (hostname: string) =>
  PREVIEW_DOMAIN_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));

export const getRuntimeOrigin = () => {
  if (typeof window === "undefined") return PRIMARY_ORIGIN;

  const { hostname, origin, protocol } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isLocal && !isPreviewHost(hostname) && protocol === "https:") {
    return origin;
  }

  return PRIMARY_ORIGIN;
};

export const absoluteSiteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRuntimeOrigin()}${normalizePath(path)}`;
};
