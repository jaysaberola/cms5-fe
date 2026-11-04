
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Menu from "./_Menu";
import HeaderSearch from "./HeaderSearch";
import PublicThemeSwitcher from "./PublicThemeSwitcher";
import SignInDropdown from "@/components/Auth/SignInDropdown";
import styles from "@/styles/_topbar.module.css";
import { useStoredPublicAuthState } from "@/lib/publicAuthState";
import { CORE_PUBLIC_ROUTES, prefetchPublicRoutes } from "@/lib/prefetchPublicRoute";

const LOGO_SRC = "/images/webfocus-logo.png";

export default function LandingTopbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminUser } = useStoredPublicAuthState();
  const isStaffLoggedIn = Boolean(adminUser);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    prefetchPublicRoutes(router, CORE_PUBLIC_ROUTES);
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 991) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      return;
    }

    const scrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header
      className={`public-site-header ${scrolled ? "public-site-header-scrolled" : ""} ${styles.header} ${scrolled ? styles.scrolled : ""} ${mobileOpen ? styles.menuOpen : ""}`}
    >
      <div className={styles.headerAccent} aria-hidden="true" />
      <div className={styles["topbar-inner"]}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand} onClick={closeMobileMenu} aria-label="WebFocus CMS Demo" prefetch scroll={false}>
            {!logoFailed ? (
              <img
                src={LOGO_SRC}
                alt="WebFocus Solutions, Inc."
                className={styles["logo-img-full"]}
                width={130}
                height={30}
                decoding="async"
                fetchPriority="high"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className={styles.wordmark}>
                <span className={styles["wordmark-row"]}>
                  <span className={styles["wordmark-web"]}>Web</span>
                  <span className={styles["wordmark-focus-block"]}>
                    <span className={styles["wordmark-focus"]}>Focus</span>
                    <span className={styles["wordmark-sub"]}>Solutions, Inc.</span>
                  </span>
                </span>
              </span>
            )}
          </Link>
          <span className={styles.brandBadge}>CMS Demo</span>
        </div>

        <nav
          id="landing-topbar-nav"
          className={`public-site-nav ${styles["nav-wrap"]} ${mobileOpen ? styles["nav-wrap-open"] : ""}`}
          aria-label="Main navigation"
        >
          <div className={styles["mobile-utilities"]}>
            <Link href="/search" className={styles["mobile-utility-link"]} onClick={closeMobileMenu} prefetch scroll={false}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              Search
            </Link>
            {!isStaffLoggedIn ? (
              <SignInDropdown variant="menuTile" onNavigate={closeMobileMenu} />
            ) : null}
          </div>
          <ul className={styles["nav-list"]}>
            <Menu isMobile={mobileOpen} onNavigate={closeMobileMenu} />
          </ul>
          <PublicThemeSwitcher variant="mobileMenu" onNavigate={closeMobileMenu} />
        </nav>

        <div className={styles.actions}>
          <HeaderSearch />

          <Link href="/contact-us" className={`${styles["demo-btn"]} public-demo-cta`} prefetch scroll={false}>
            Book a call
          </Link>

          <PublicThemeSwitcher />

          {!isStaffLoggedIn ? (
            <>
              <div className={styles.actionsDivider} aria-hidden="true" />
              <div className={styles["icon-group"]}>
                <div className={styles.headerAccount}>
                  <SignInDropdown
                    buttonClassName={styles["portal-btn"]}
                    chevronClassName={styles["portal-chevron"]}
                  />
                </div>
              </div>
            </>
          ) : null}

          <Link href="/search" className={styles["search-mobile-btn"]} aria-label="Search" title="Search" prefetch scroll={false}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </Link>

          <button
            type="button"
            className={styles["mobile-toggle"]}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="landing-topbar-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
    </header>
  );
}
