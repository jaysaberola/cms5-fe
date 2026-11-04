import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicAlbum } from "@/services/publicPageService";
import { resolveStorageAssetUrl, resolveStorageAssetUrlWithFallback } from "@/lib/storageAssets";
import { BannerMediaType, resolveBannerMediaType } from "@/lib/bannerAssets";
import {
  BANNER_ANIMATION_DURATION_MS,
  bannerAnimationClasses,
  resolveBannerSlideInterval,
  resolveBannerTransitionClass,
} from "@/lib/bannerTransitions";
import styles from "@/styles/mainbanner.module.css";

interface MainBannerProps {
  album: PublicAlbum;
}

const HOME_BANNER_VISIBILITY_STORAGE_KEY = "cms4.homeBanner.visibility.v1";
const HOME_BANNER_FONT_STORAGE_KEY = "cms4.homeBanner.fonts.v1";

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}
const WEB_DESIGN_SERVICES_URL = "/services?tab=webdesign";

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function resolveSecondaryBannerUrl(url: string, label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  const isCustomPackages =
    normalizedLabel.includes("custom package") || normalizedLabel === "custom packages";

  if (isCustomPackages || !url || url === "#" || url === "/products") {
    return WEB_DESIGN_SERVICES_URL;
  }

  return url;
}

const DEFAULT_HERO_IMAGE = "/images/homescreenify-sA3wymYqyaI-unsplash.jpg";

/** Inline so first paint never shows a full-width 1920px img before CSS modules load. */
const HERO_CARD_STYLE = {
  position: "relative",
  minHeight: "min(88vh, 820px)",
  overflow: "hidden",
} as const;

const HERO_STRIP_STYLE = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
} as const;

const HERO_SLIDE_STYLE = {
  position: "absolute",
  inset: 0,
} as const;

const HERO_MEDIA_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
} as const;

function resolveSlideImage(banner: { image_url?: string; image_path?: string }) {
  const resolved =
    resolveStorageAssetUrl(banner.image_path) ||
    resolveStorageAssetUrl(banner.image_url);

  return resolved || DEFAULT_HERO_IMAGE;
}

function resolveSubtitle(banner: { alt?: string; title?: string }) {
  const alt = banner.alt?.trim();
  if (alt) return alt;

  const title = (banner.title ?? "").toLowerCase();
  if (title.includes("restaurant") || title.includes("place")) {
    return "Discover exceptional flavors, warm hospitality, and an unforgettable dining experience.";
  }

  return "Establish a powerhouse digital presence on Manila's lowest-latency hosting nodes to load your pages 3x faster than traditional foreign servers.";
}

export default function MainBanner({ album }: MainBannerProps) {
  const albumBannerType: BannerMediaType = album.banner_type === "video" ? "video" : "image";

  const isVideoBanner = (banner: any) =>
    resolveBannerMediaType(
      {
        image_path: banner?.image_path,
        image_url: banner?.image_url,
        media_type: banner?.media_type ?? banner?.mediaType,
      },
      albumBannerType
    ) === "video";

  const toBoolean = (value: any): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
    return undefined;
  };

  const toVisibleFromStatus = (value: any): boolean | undefined => {
    if (value == null) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (["published", "public", "active", "visible", "show"].includes(normalized)) return true;
    if (["private", "hidden", "inactive", "draft", "archived", "hide"].includes(normalized)) return false;
    return undefined;
  };

  const isBannerVisible = (banner: any): boolean => {
    const active = toBoolean(banner?.is_active ?? banner?.active);
    const hidden = toBoolean(banner?.is_hidden ?? banner?.hidden);
    const visibleByStatus = toVisibleFromStatus(banner?.status ?? banner?.visibility);
    if (typeof hidden === "boolean") return !hidden;
    if (typeof active === "boolean") return active;
    if (typeof visibleByStatus === "boolean") return visibleByStatus;
    return true;
  };

  /** Empty on first render so SSR and hydration match; localStorage applied after mount. */
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, { is_active?: boolean }>
  >({});
  const [fontOverrides, setFontOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    setVisibilityOverrides(readJsonStorage(HOME_BANNER_VISIBILITY_STORAGE_KEY, {}));
    setFontOverrides(readJsonStorage(HOME_BANNER_FONT_STORAGE_KEY, {}));
  }, []);

  const banners = useMemo(() => {
    return (album.banners || []).filter((banner: any, index: number) => {
      const mediaType = resolveBannerMediaType(
        {
          image_path: banner?.image_path,
          image_url: banner?.image_url,
          media_type: banner?.media_type ?? banner?.mediaType,
        },
        albumBannerType
      );
      if (mediaType !== albumBannerType) return false;

      const keyById = banner?.id ? `id:${banner.id}` : undefined;
      const keyByOrder = typeof banner?.order !== "undefined" ? `order:${banner.order}` : undefined;
      const keyByIndex = `index:${index}`;

      const local =
        (keyById ? visibilityOverrides[keyById] : undefined) ||
        (keyByOrder ? visibilityOverrides[keyByOrder] : undefined) ||
        visibilityOverrides[keyByIndex];

      if (typeof local?.is_active === "boolean") return local.is_active;
      return isBannerVisible(banner);
    });
  }, [album.banners, album.banner_type, albumBannerType, visibilityOverrides]);
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);
  const [heroMediaReady, setHeroMediaReady] = useState(false);
  const [heroInteractive, setHeroInteractive] = useState(false);

  useEffect(() => {
    setHeroInteractive(true);
  }, []);

  useEffect(() => {
    setHeroMediaReady(false);
  }, [album?.id]);

  useEffect(() => {
    if (heroMediaReady) return;
    const fallback = window.setTimeout(() => setHeroMediaReady(true), 4500);
    return () => window.clearTimeout(fallback);
  }, [heroMediaReady, banners.length]);

  const transitionInClass = resolveBannerTransitionClass(album as Record<string, unknown>, "in");
  const transitionOutClass = resolveBannerTransitionClass(album as Record<string, unknown>, "out");

  const goToBanner = (next: number) => {
    if (!banners.length || next === current) return;
    const outgoing = current;
    setExiting(outgoing);
    setCurrent(next);

    window.setTimeout(() => {
      setExiting((value) => (value === outgoing ? null : value));
    }, BANNER_ANIMATION_DURATION_MS);
  };

  const interval = resolveBannerSlideInterval(album.transition);

  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      goToBanner((current + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners.length, current, interval]);

  if (!banners.length) {
    return (
      <section className={styles.bannerWrap} aria-hidden="true">
        <div className={styles.bannerHero}>
          <div className={styles.bannerCard} />
        </div>
      </section>
    );
  }

  const banner = banners[current];
  const subtitleText = resolveSubtitle(banner);

  const buttonParts = (banner.button_text || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const urlParts = (banner.url || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const primaryButtonText = buttonParts[0] || "";
  const secondaryButtonText = buttonParts[1] || "";
  const primaryButtonUrl = urlParts[0] || "";
  const secondaryButtonUrl = urlParts[1] || "";

  const resolvedPrimaryText = primaryButtonText || "CLICK TO SEE MORE";
  const resolvedSecondaryText = secondaryButtonText || "CUSTOM PACKAGES";
  const resolvedPrimaryUrl = primaryButtonUrl || secondaryButtonUrl || "#";
  const resolvedSecondaryUrl = resolveSecondaryBannerUrl(
    secondaryButtonUrl || primaryButtonUrl || "",
    resolvedSecondaryText
  );

  const overrideById = (banner as any)?.id ? fontOverrides[`id:${(banner as any).id}`] : undefined;
  const overrideByOrder = typeof (banner as any)?.order !== "undefined" ? fontOverrides[`order:${(banner as any).order}`] : undefined;
  const override = overrideById || overrideByOrder;

  const descriptionFont =
    (banner as any).description_font ??
    (banner as any).descriptionFont ??
    (banner as any).description_font_family ??
    (banner as any).descriptionFontFamily ??
    override?.description_font;
  const titleFont =
    (banner as any).title_font ??
    (banner as any).titleFont ??
    (banner as any).title_font_family ??
    (banner as any).titleFontFamily ??
    override?.title_font;
  const buttonFont =
    (banner as any).button_font ??
    (banner as any).buttonFont ??
    (banner as any).button_font_family ??
    (banner as any).buttonFontFamily ??
    override?.button_font;

  const titleFontSizeRaw =
    (banner as any).title_font_size ??
    (banner as any).titleFontSize ??
    (banner as any).title_size ??
    (banner as any).titleSize ??
    override?.title_font_size;
  const titleFontSize =
    typeof titleFontSizeRaw === "number"
      ? titleFontSizeRaw
      : typeof titleFontSizeRaw === "string" && titleFontSizeRaw.trim() !== ""
        ? Number(titleFontSizeRaw)
        : undefined;

  const titleBoldRaw =
    (banner as any).title_bold ??
    (banner as any).titleBold ??
    (banner as any).is_title_bold ??
    (banner as any).isTitleBold ??
    override?.title_bold;
  const titleBold =
    typeof titleBoldRaw === "boolean"
      ? titleBoldRaw
      : titleBoldRaw === 1 || titleBoldRaw === "1" || titleBoldRaw === "true"
        ? true
        : titleBoldRaw === 0 || titleBoldRaw === "0" || titleBoldRaw === "false"
          ? false
          : undefined;

  const descriptionFontSizeRaw =
    (banner as any).description_font_size ??
    (banner as any).descriptionFontSize ??
    (banner as any).description_size ??
    (banner as any).descriptionSize ??
    override?.description_font_size;
  const descriptionFontSize =
    typeof descriptionFontSizeRaw === "number"
      ? descriptionFontSizeRaw
      : typeof descriptionFontSizeRaw === "string" && descriptionFontSizeRaw.trim() !== ""
        ? Number(descriptionFontSizeRaw)
        : undefined;

  const descriptionBoldRaw =
    (banner as any).description_bold ??
    (banner as any).descriptionBold ??
    (banner as any).is_description_bold ??
    (banner as any).isDescriptionBold ??
    override?.description_bold;
  const descriptionBold =
    typeof descriptionBoldRaw === "boolean"
      ? descriptionBoldRaw
      : descriptionBoldRaw === 1 || descriptionBoldRaw === "1" || descriptionBoldRaw === "true"
        ? true
        : descriptionBoldRaw === 0 || descriptionBoldRaw === "0" || descriptionBoldRaw === "false"
          ? false
          : undefined;

  const buttonFontSizeRaw =
    (banner as any).button_font_size ??
    (banner as any).buttonFontSize ??
    (banner as any).button_size ??
    (banner as any).buttonSize ??
    override?.button_font_size;
  const buttonFontSize =
    typeof buttonFontSizeRaw === "number"
      ? buttonFontSizeRaw
      : typeof buttonFontSizeRaw === "string" && buttonFontSizeRaw.trim() !== ""
        ? Number(buttonFontSizeRaw)
        : undefined;

  const buttonBoldRaw =
    (banner as any).button_bold ??
    (banner as any).buttonBold ??
    (banner as any).is_button_bold ??
    (banner as any).isButtonBold ??
    override?.button_bold;
  const buttonBold =
    typeof buttonBoldRaw === "boolean"
      ? buttonBoldRaw
      : buttonBoldRaw === 1 || buttonBoldRaw === "1" || buttonBoldRaw === "true"
        ? true
        : buttonBoldRaw === 0 || buttonBoldRaw === "0" || buttonBoldRaw === "false"
          ? false
          : undefined;

  const buildInlineStyle = (
    parts: Array<Record<string, string | number> | undefined | false>,
  ): React.CSSProperties | undefined => {
    const merged = Object.assign({}, ...parts.filter(Boolean));
    return Object.keys(merged).length ? merged : undefined;
  };

  const titleStyle = buildInlineStyle([
    titleFont ? { fontFamily: titleFont } : undefined,
    typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
      ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
      : undefined,
    typeof titleBold === "boolean" ? { fontWeight: titleBold ? 800 : 400 } : undefined,
  ]);

  const subtitleStyle = buildInlineStyle([
    descriptionFont ? { fontFamily: descriptionFont } : undefined,
    typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
      ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
      : undefined,
    typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 600 : 400 } : undefined,
  ]);

  const primaryButtonStyle = buildInlineStyle([
    buttonFont ? { fontFamily: buttonFont } : undefined,
    typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
      ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
      : undefined,
    typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 800 : 400 } : undefined,
  ]);

  const secondaryButtonStyle = buildInlineStyle([
    buttonFont ? { fontFamily: buttonFont } : undefined,
    typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
      ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
      : undefined,
    typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 700 : 400 } : undefined,
  ]);

  return (
    <section className={styles.bannerWrap}>
      <div className={styles.bannerHero}>
        <div
          className={styles.bannerCard}
          style={HERO_CARD_STYLE}
          data-public-hero="1"
          data-public-hero-ready={heroMediaReady ? "true" : undefined}
        >
      {/* SLIDER STRIP */}
      <div
        className={styles.sliderStrip}
        style={HERO_STRIP_STYLE}
        data-public-hero-strip
        data-hero-interactive={heroInteractive ? "1" : undefined}
      >
        {banners.map((banner, index) => {
          const isActive = index === current;
          const isExiting = index === exiting;
          const animationName = isExiting
            ? transitionOutClass
            : isActive
              ? transitionInClass
              : "";
          const shouldAnimate = Boolean(animationName && (isActive || isExiting));

          return (
            <div
              key={banner.id ?? index}
              className={[
                styles.slide,
                isActive ? styles.slideActive : "",
                isActive && index === 0 ? styles.slideActivePrimary : "",
                isExiting ? styles.slideExiting : "",
                ...bannerAnimationClasses(animationName, shouldAnimate),
              ].filter(Boolean).join(" ")}
              style={{
                ...HERO_SLIDE_STYLE,
                ["--animate-duration" as any]: `${BANNER_ANIMATION_DURATION_MS}ms`,
              }}
            >
              {isVideoBanner(banner) ? (
                <video
                  className={styles.slideVideo}
                  style={HERO_MEDIA_STYLE}
                  src={resolveStorageAssetUrlWithFallback(banner.image_path || banner.image_url, DEFAULT_HERO_IMAGE)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload={index === 0 ? "auto" : "metadata"}
                  onLoadedData={index === 0 ? () => setHeroMediaReady(true) : undefined}
                />
              ) : (
                <img
                  src={resolveSlideImage(banner)}
                  alt=""
                  className={styles.slideImage}
                  style={HERO_MEDIA_STYLE}
                  sizes="100vw"
                  fetchPriority={index === 0 && isActive ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding={index === 0 ? "async" : "async"}
                  onLoad={index === 0 ? () => setHeroMediaReady(true) : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* overlay */}
      <div className={styles.overlay} />

      {/* CONTENT */}
      <div className={styles.content}>
        <div className={styles.inner}>
          {banner.title && (
            <h1 className={styles.title} style={titleStyle}>
              {banner.title}
            </h1>
          )}

          {subtitleText && (
            <p className={styles.subtitle} style={subtitleStyle}>
              {subtitleText}
            </p>
          )}

          <div className={styles.ctaRow}>
            {isInternalHref(resolvedPrimaryUrl) ? (
              <Link
                href={resolvedPrimaryUrl}
                className={`${styles.ctaPrimary} public-hero-cta-primary`}
                style={primaryButtonStyle}
                scroll={false}
                prefetch
              >
                {resolvedPrimaryText}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <a href={resolvedPrimaryUrl} className={`${styles.ctaPrimary} public-hero-cta-primary`} style={primaryButtonStyle}>
                {resolvedPrimaryText}
                <span aria-hidden="true">→</span>
              </a>
            )}

            {isInternalHref(resolvedSecondaryUrl) ? (
              <Link
                href={resolvedSecondaryUrl}
                className={`${styles.ctaSecondary} public-hero-cta-secondary`}
                style={secondaryButtonStyle}
                scroll={false}
                prefetch
              >
                {resolvedSecondaryText}
              </Link>
            ) : (
              <a
                href={resolvedSecondaryUrl}
                className={`${styles.ctaSecondary} public-hero-cta-secondary`}
                style={secondaryButtonStyle}
              >
                {resolvedSecondaryText}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* dots */}
      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, index) => (
            <span
              key={index}
              onClick={() => goToBanner(index)}
              className={`${styles.dot} ${index === current ? " " + styles.active : ""}`}
            />
          ))}
        </div>
      )}
      </div>
      </div>
    </section>
  );
}
