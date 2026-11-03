import LandingPageLayout from "@/components/Layout/GuestLayout";
import { PublicPage } from "@/services/publicPageService";
import { activateCmsPageAnimations, cleanupPublicPageScripts } from "@/lib/publicPageScripts";
import { stabilizeAboutPage } from "@/lib/stabilizeAboutPage";
import { initHomeBrandMarquee } from "@/lib/initHomeBrandMarquee";
import { initHomePortfolioModal } from "@/lib/initHomePortfolioModal";
import CmsPublicContactForms from "@/components/Public/CmsPublicContactForms";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { usePublicRouteTransition } from "@/lib/usePublicRouteTransition";
import { usePublicPageAutoRecover } from "@/lib/usePublicPageAutoRecover";
import transitionStyles from "@/styles/publicPageTransition.module.css";

interface PublicPageViewProps {
  pageData?: PublicPage | null;
  htmlContent?: string | null;
}

function PublicPageView({ pageData, htmlContent: htmlContentProp }: PublicPageViewProps) {
  const router = useRouter();
  const isRouteTransitioning = usePublicRouteTransition();
  usePublicPageAutoRecover(pageData, { isRouteTransitioning });
  const htmlContent = htmlContentProp ?? "";
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentKey = pageData?.id ?? pageData?.slug ?? router.asPath.split("?")[0];

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const scripts = Array.from(root.querySelectorAll("script"));
    if (!scripts.length) return;

    const win = window as Window & {
      __cmsExecutedScripts?: Set<string>;
      __cmsExecutedInlineScripts?: Set<string>;
      __cmsLoadedScriptSrc?: Set<string>;
    };

    if (!win.__cmsExecutedScripts) {
      win.__cmsExecutedScripts = new Set<string>();
    }
    if (!win.__cmsExecutedInlineScripts) {
      win.__cmsExecutedInlineScripts = new Set<string>();
    }
    if (!win.__cmsLoadedScriptSrc) {
      win.__cmsLoadedScriptSrc = new Set<string>();
    }

    const executionKey = `${contentKey}::${htmlContent}`;
    if (win.__cmsExecutedScripts.has(executionKey)) {
      return;
    }
    win.__cmsExecutedScripts.add(executionKey);

    scripts.forEach((oldScript) => {
      const src = oldScript.getAttribute("src") || "";
      const inlineSource = (oldScript.textContent || "").trim();
      const inlineKey = `${contentKey}::inline::${inlineSource}`;
      const srcKey = src ? `src::${src}` : "";

      if (srcKey && win.__cmsLoadedScriptSrc?.has(srcKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      if (!src && inlineSource && win.__cmsExecutedInlineScripts?.has(inlineKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      const newScript = document.createElement("script");

      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (inlineSource) {
        newScript.text = `(() => {\n${inlineSource}\n})();`;
      }

      if (srcKey) {
        win.__cmsLoadedScriptSrc?.add(srcKey);
      } else if (inlineSource) {
        win.__cmsExecutedInlineScripts?.add(inlineKey);
      }

      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent, contentKey]);

  useEffect(() => {
    return () => {
      cleanupPublicPageScripts();
    };
  }, [pageData?.slug]);

  useEffect(() => {
    return activateCmsPageAnimations(contentRef.current);
  }, [htmlContent, pageData?.slug]);

  useEffect(() => {
    const slug = String(pageData?.slug || "").toLowerCase();
    if (slug !== "about" && slug !== "about-us") return;

    const root = contentRef.current;
    if (!root) return;

    const run = () => stabilizeAboutPage(root);

    run();
    const t1 = window.setTimeout(run, 0);
    const t2 = window.setTimeout(run, 120);
    const t3 = window.setTimeout(run, 900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [htmlContent, pageData?.slug]);

  useLayoutEffect(() => {
    const slug = String(pageData?.slug || "").toLowerCase();
    if (slug !== "home") return;

    const root = contentRef.current;
    if (!root) return;

    let queued = false;
    const run = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        initHomeBrandMarquee(root);
      });
    };

    run();
    const stopPortfolioFix = initHomePortfolioModal();

    const observer = new MutationObserver((mutations) => {
      const shouldReinit = mutations.some((mutation) => {
        if (mutation.type !== "childList") return false;
        const target = mutation.target as Element;
        return Boolean(
          target.closest?.(".wsi-clients-section") ||
            target.classList?.contains("public-page-content"),
        );
      });
      if (shouldReinit) run();
    });

    observer.observe(root, { childList: true, subtree: true });

    const t1 = window.setTimeout(run, 150);
    const t2 = window.setTimeout(run, 600);

    return () => {
      observer.disconnect();
      stopPortfolioFix();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [htmlContent, pageData?.slug]);

  const hasContactForm = useMemo(
    () => htmlContent.includes('data-cms-contact-form="1"'),
    [htmlContent],
  );

  if (!pageData) {
    if (!router.isReady || isRouteTransitioning) {
      return (
        <div
          className={`public-page-content ${transitionStyles.pagePending}`}
          aria-busy="true"
          aria-live="polite"
        />
      );
    }
    return (
      <div className={`public-page-content ${transitionStyles.pagePending}`} aria-busy="true">
        Loading page…
      </div>
    );
  }

  return (
    <>
      <div
        key={contentKey}
        ref={contentRef}
        className={`public-page-content${hasContactForm ? " public-contact" : ""}`}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {hasContactForm ? <CmsPublicContactForms rootRef={contentRef} /> : null}
    </>
  );
}

PublicPageView.Layout = LandingPageLayout;

export default PublicPageView;
