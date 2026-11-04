import LandingTopbar from "./_Topbar";
import LandingFooter from "./_Footer";
import MinimalPublicFooter from "./MinimalPublicFooter";
import Banner from "./_Banner";
import { PublicAlbum } from "@/services/publicPageService";
import ToastHost from "@/components/UI/ToastHost";
import PrivacyConsentBanner from "@/components/Layout/PrivacyConsentBanner";
import PublicRouteProgress from "@/components/Layout/PublicRouteProgress";
import Head from "next/head";
import { useEffect, useLayoutEffect, useState } from "react";
import { revealAppDocument } from "@/lib/revealDocument";
import { armPublicScrollReveal } from "@/lib/publicScrollReveal";
import { useRouter } from "next/router";
import { getHeroPreloadImage } from "@/lib/heroBanner";
import { getWebsiteSettingsCached, readStoredWebsiteSettings, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";
import SiteFavicon from "@/components/Layout/SiteFavicon";
import { usePublicRouteTransition } from "@/lib/usePublicRouteTransition";
import { usePublicInternalLinkCapture } from "@/lib/usePublicInternalLinkCapture";
import { applyPublicSiteTheme, readPublicSiteTheme } from "@/lib/publicSiteTheme";
import transitionStyles from "@/styles/publicPageTransition.module.css";

interface LandingPageLayoutProps {
  children: React.ReactNode;
  pageData?: {
    title?: string;
    slug?: string;
    album?: PublicAlbum | null;
    meta?: {
      title?: string | null;
      description?: string | null;
      keywords?: string | null;
    };
  };
  layout?: {
    fullWidth?: boolean;
    hideBanner?: boolean;
    minimalFooter?: boolean;
  };
}

export default function LandingPageLayout({
  children,
  pageData,
  layout,
}: LandingPageLayoutProps) {
  const router = useRouter();
  const isRouteTransitioning = usePublicRouteTransition();
  usePublicInternalLinkCapture(true);
  const contentWrapperClassName = layout?.fullWidth
    ? "container-fluid px-0"
    : "container";

  const [companyName, setCompanyName] = useState<string | null>(null);

  useLayoutEffect(() => {
    applyPublicSiteTheme(readPublicSiteTheme());
    revealAppDocument();
    const root =
      (document.querySelector(".public-page-content") as HTMLElement | null) ||
      (document.querySelector(".public-site-main") as HTMLElement | null);
    return armPublicScrollReveal(root);
  }, [router.asPath, pageData?.slug]);

  useEffect(() => {
    let alive = true;

    const refresh = async (opts?: { force?: boolean }) => {
      try {
        const s = await getWebsiteSettingsCached({ force: opts?.force === true });
        if (!alive) return;
        setCompanyName((s as any)?.company_name || null);
      } catch {
        // ignore
      }
    };

    refresh({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => {
      const stored = readStoredWebsiteSettings();
      if (!alive) return;
      setCompanyName((stored as any)?.company_name || null);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const baseTitle = pageData?.meta?.title || pageData?.title || "Page";
  const tabTitle = companyName ? `${baseTitle} | ${companyName}` : baseTitle;
  const metaDescription = pageData?.meta?.description || null;
  const metaKeywords = pageData?.meta?.keywords || null;

  const isHomeHero = pageData?.album?.type === "main_banner";
  const showMainHeroBanner = isHomeHero && layout?.hideBanner !== true;
  const heroPreloadImage = showMainHeroBanner ? getHeroPreloadImage(pageData?.album) : null;

  return (
    <div className="d-flex flex-column min-vh-100 public-site-shell public-site-shell--executra">
      <Head>
        <title>{tabTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        {heroPreloadImage ? (
          <link rel="preload" as="image" href={heroPreloadImage} fetchPriority="high" />
        ) : null}
      </Head>
      <SiteFavicon />

      <PublicRouteProgress />
      <LandingTopbar />

      <div
        className={transitionStyles.heroSlot}
        data-public-hero-slot={showMainHeroBanner ? "visible" : "hidden"}
        aria-hidden={!showMainHeroBanner}
      >
        {showMainHeroBanner ? (
          <Banner title={pageData?.title} album={pageData?.album} />
        ) : null}
      </div>

      <main
        className={[
          "flex-grow-1 public-site-main pt-0",
          transitionStyles.main,
          isRouteTransitioning ? transitionStyles.mainTransitioning : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={contentWrapperClassName}>{children}</div>
      </main>

      {layout?.minimalFooter ? <MinimalPublicFooter /> : <LandingFooter />}

      <ToastHost />
      <PrivacyConsentBanner />
    </div>
  );
}
