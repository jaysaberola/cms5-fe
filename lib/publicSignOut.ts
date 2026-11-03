import { logout as adminLogout } from "@/services/authService";
import { customerLogout } from "@/services/publicCustomerService";
import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

const PROTECTED_PUBLIC_PATHS = ["/checkout"];

export function getPublicSignOutRedirect(): string {
  if (typeof window === "undefined") return "/";

  const { pathname, search } = window.location;
  const isProtected = PROTECTED_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected || !isPublicSiteRoute(pathname)) {
    return "/";
  }

  return `${pathname}${search}`;
}

export function signOutAdminAndStayOnSite() {
  adminLogout();
  window.location.assign(getPublicSignOutRedirect());
}

export function signOutCustomerAndStayOnSite() {
  customerLogout();
  window.location.assign(getPublicSignOutRedirect());
}
