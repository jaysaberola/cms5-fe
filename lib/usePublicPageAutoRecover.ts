import { useEffect } from "react";
import { useRouter } from "next/router";
import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

const retryKey = (path: string) => `webfocus.publicNavRetry:${path}`;

/**
 * If client-side navigation finishes without SSR props, do one full load (same as manual refresh).
 */
export function usePublicPageAutoRecover(
  pageData: unknown,
  opts?: { enabled?: boolean; isRouteTransitioning?: boolean },
) {
  const router = useRouter();
  const enabled = opts?.enabled !== false;
  const isRouteTransitioning = opts?.isRouteTransitioning === true;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!router.isReady || isRouteTransitioning) return;

    const path = router.asPath.split("?")[0] || "/";

    if (pageData) {
      sessionStorage.removeItem(retryKey(path));
      return;
    }

    if (!isPublicSiteRoute(path) || path === "/") return;

    if (sessionStorage.getItem(retryKey(path))) return;

    sessionStorage.setItem(retryKey(path), "1");
    const query = router.asPath.includes("?") ? router.asPath.slice(router.asPath.indexOf("?")) : "";
    window.location.assign(`${path}${query}`);
  }, [enabled, isRouteTransitioning, pageData, router.asPath, router.isReady]);
}
