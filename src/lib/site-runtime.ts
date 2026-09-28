export const PRIMARY_DOMAIN = "elyusr.org";
export const WWW_DOMAIN = `www.${PRIMARY_DOMAIN}`;
export const PRIMARY_ORIGIN = `https://${PRIMARY_DOMAIN}`;
export const LOVABLE_DOMAIN_SUFFIXES = ["lovable.app", "lovableproject.com"];

const trimSlashes = (value: string) => value.replace(/^\/+/, "");

export const normalizePath = (path = "/") => {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return `/${trimSlashes(path)}`;
};

export const isLovableHost = (hostname: string) =>
  LOVABLE_DOMAIN_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));

export const getRuntimeOrigin = () => {
  if (typeof window === "undefined") return PRIMARY_ORIGIN;

  const { hostname, origin, protocol } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isLocal && !isLovableHost(hostname) && protocol === "https:") {
    return origin;
  }

  return PRIMARY_ORIGIN;
};

export const absoluteSiteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRuntimeOrigin()}${normalizePath(path)}`;
};

export const expectedDns = {
  rootA: "185.158.133.1",
  wwwA: "185.158.133.1",
  verificationTxtHost: "_lovable",
  cloudflareTracePath: "/cdn-cgi/trace",
};

export const isPotentialCloudflareProxy = (hostname: string, aRecords: string[] = []) => {
  const hostLooksCustom = hostname === PRIMARY_DOMAIN || hostname === WWW_DOMAIN || (!isLovableHost(hostname) && hostname.includes("."));
  const pointsAwayFromLovableIp = aRecords.length > 0 && !aRecords.includes(expectedDns.rootA);
  return hostLooksCustom && pointsAwayFromLovableIp;
};