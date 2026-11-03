import { useEffect } from "react";
import { useRouter } from "next/router";
import { normalizePublicHref } from "@/lib/publicMenuLinks";
import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

const SKIP_HREF = /^(#|mailto:|tel:|sms:|javascript:|data:|blob:)/i;

/**
 * Turn in-content/footer `<a href="/about-us">` into client navigations so every
 * public link behaves like the navbar (same transition, no full reload).
 */
export function usePublicInternalLinkCapture(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;

      if (
        anchor.closest(
          ".public-site-header, .public-site-nav, [data-public-hero], .public-news-hero",
        )
      ) {
        return;
      }

      if (
        !anchor.closest(
          ".public-page-content, .public-site-footer-host, .public-site-main, .public-news-shell",
        )
      ) {
        return;
      }

      const target = (anchor.getAttribute("target") || "").trim().toLowerCase();
      if (target && target !== "_self") return;

      const raw = (anchor.getAttribute("href") || "").trim();
      if (!raw || SKIP_HREF.test(raw)) return;

      const normalized = normalizePublicHref(raw);
      const pathOnly = normalized.split("#")[0]?.split("?")[0] || "";
      if (!pathOnly || !isPublicSiteRoute(pathOnly)) return;
      if (/^https?:\/\//i.test(normalized)) return;

      const hash = normalized.includes("#") ? normalized.slice(normalized.indexOf("#")) : "";
      const destination = `${pathOnly}${hash}`;

      if (destination.split("?")[0] === router.asPath.split("?")[0] && !normalized.includes("?")) {
        if (hash) {
          event.preventDefault();
          router.push(destination);
        }
        return;
      }

      event.preventDefault();
      void router.push(normalized);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled, router]);
}
