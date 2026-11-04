"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PUBLIC_SITE_THEMES,
  applyPublicSiteTheme,
  readPublicSiteTheme,
  type PublicSiteThemeId,
} from "@/lib/publicSiteTheme";
import styles from "@/styles/publicThemeSwitcher.module.css";

type Props = {
  variant?: "header" | "mobileMenu";
  onNavigate?: () => void;
};

export default function PublicThemeSwitcher({ variant = "header", onNavigate }: Props) {
  const [theme, setTheme] = useState<PublicSiteThemeId>("dark");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTheme(readPublicSiteTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectTheme = useCallback(
    (id: PublicSiteThemeId) => {
      applyPublicSiteTheme(id);
      setTheme(id);
      setOpen(false);
      onNavigate?.();
    },
    [onNavigate],
  );

  if (variant === "mobileMenu") {
    return (
      <div className={styles.mobileOnly} role="group" aria-label="Site color theme">
        <p className={styles.panelTitle} style={{ marginBottom: 8 }}>
          Color theme
        </p>
        <div className={styles.mobileRow}>
          {PUBLIC_SITE_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.mobileChip} ${theme === item.id ? styles.mobileChipActive : ""}`}
              aria-pressed={theme === item.id}
              onClick={() => selectTheme(item.id)}
            >
              <span className={styles.swatch} style={{ background: item.swatch, width: 14, height: 14 }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} ${styles.wrapDesktop}`} ref={wrapRef}>
      <button
        type="button"
        className={styles.toggle}
        aria-label="Change site color theme"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Color theme"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>

      {open ? (
        <div className={styles.panel} role="listbox" aria-label="Color theme">
          <p className={styles.panelTitle}>Color theme</p>
          <ul className={styles.list}>
            {PUBLIC_SITE_THEMES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={theme === item.id}
                  className={`${styles.option} ${theme === item.id ? styles.optionActive : ""}`}
                  onClick={() => selectTheme(item.id)}
                >
                  <span className={styles.swatch} style={{ background: item.swatch }} aria-hidden="true" />
                  <span className={styles.optionMeta}>
                    <span className={styles.optionLabel}>{item.label}</span>
                    <span className={styles.optionHint}>{item.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
