import { isPublicSiteRoute } from "@/lib/publicSiteRoute";
import { publicPagePath } from "@/lib/publicPaths";

const LIGHTWEIGHT_PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/home(\/|$)/,
  /^\/about-us(\/|$)/,
  /^\/about(\/|$)/,
  /^\/services(\/|$)/,
  /^\/legal(\/|$)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/data-privacy(\/|$)/,
  /^\/public\/home(\/|$)/,
  /^\/public\/about-us(\/|$)/,
  /^\/public\/about(\/|$)/,
  /^\/public\/services(\/|$)/,
  /^\/public\/legal(\/|$)/,
  /^\/public\/privacy(\/|$)/,
  /^\/public\/terms(\/|$)/,
  /^\/public\/data-privacy(\/|$)/,
];

export function isLightweightPublicPage(pathname: string) {
  if (!isPublicSiteRoute(pathname)) return false;
  const normalized = publicPagePath(pathname.split("?")[0]);
  return LIGHTWEIGHT_PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export const PUBLIC_CONSENT_STORAGE_KEY = "webfocus.publicConsent.v1";
