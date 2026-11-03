import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

function pathFromRouteUrl(url: unknown, fallback: string): string {
  if (typeof url === "string") return url.split("?")[0] || fallback;
  return fallback.split("?")[0] || "/";
}

export function usePublicRouteTransition() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollBehaviorRef = useRef<ScrollBehavior>("auto");

  useEffect(() => {
    try {
      scrollBehaviorRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
    } catch {
      scrollBehaviorRef.current = "auto";
    }
  }, []);

  useEffect(() => {
    const finishTransition = (url: unknown, scrollToTop: boolean) => {
      const path = pathFromRouteUrl(url, router.asPath);
      if (!isPublicSiteRoute(path)) return;
      setIsTransitioning(false);
      if (scrollToTop && typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: scrollBehaviorRef.current });
      }
    };

    const start = (url: string) => {
      if (!isPublicSiteRoute(pathFromRouteUrl(url, router.asPath))) return;
      setIsTransitioning(true);
    };

    const complete = (url: string) => {
      finishTransition(url, true);
    };

    /** Next.js passes `(err, url)` — not `(url)` like other route events. */
    const onError = (_err: unknown, url: string) => {
      finishTransition(url, false);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", complete);
    router.events.on("routeChangeError", onError);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", complete);
      router.events.off("routeChangeError", onError);
    };
  }, [router]);

  return isTransitioning;
}
