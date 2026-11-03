import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

const LIGHTWEIGHT_PUBLIC_ROUTE_PATTERNS = [
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
  return LIGHTWEIGHT_PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export const PUBLIC_CONSENT_STORAGE_KEY = "webfocus.publicConsent.v1";
