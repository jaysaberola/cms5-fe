import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/_topbar.module.css";

type Props = {
  variant?: "desktop" | "mobile";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function HeaderSearch({ variant = "desktop", open: openProp, onOpenChange }: Props) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputId = useId();
  const [query, setQuery] = useState("");
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);

  const isMobile = variant === "mobile";
  const mobileOpen = openProp ?? mobileOpenInternal;

  const setMobileOpen = (value: boolean) => {
    onOpenChange?.(value);
    if (openProp === undefined) setMobileOpenInternal(value);
  };

  useEffect(() => {
    if (isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDesktopOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") {
        setDesktopOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile]);

  useEffect(() => {
    if (!desktopOpen || isMobile) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        if (!query.trim()) setDesktopOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [desktopOpen, query, isMobile]);

  useEffect(() => {
    if (!mobileOpen || !isMobile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, isMobile]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = query.trim();
    if (isMobile) setMobileOpen(false);
    else setDesktopOpen(false);
    if (!value) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const searchIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className={styles["search-mobile-btn"]}
          aria-label="Search site"
          title="Search"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          {searchIcon}
        </button>

        {mobileOpen ? (
          <div className={styles.searchMobilePanel} role="dialog" aria-label="Search site">
            <form className={styles.searchMobileForm} onSubmit={submit} role="search">
              <label className={styles.searchLabel} htmlFor={mobileInputId}>
                Search site
              </label>
              <input
                id={mobileInputId}
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={styles.searchMobileField}
                placeholder="Pages, news, topics…"
                aria-label="Search site"
              />
              <button type="submit" className={styles.searchMobileSubmit}>
                Go
              </button>
              <button
                type="button"
                className={styles.searchMobileClose}
                aria-label="Close search"
                onClick={() => setMobileOpen(false)}
              >
                ×
              </button>
            </form>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div
      ref={shellRef}
      className={`public-header-search ${styles.searchShell} ${desktopOpen ? styles.searchShellOpen : ""}`}
    >
      <button
        type="button"
        className={`public-header-search-toggle ${styles.searchToggle}`}
        onClick={() => {
          setDesktopOpen(true);
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label="Open search"
        aria-expanded={desktopOpen}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>

      <form className={styles.searchForm} onSubmit={submit} role="search">
        <label className={styles.searchLabel} htmlFor="public-header-search">
          Search site
        </label>
        <input
          id="public-header-search"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.searchField}
          placeholder="Pages, news, topics…"
          aria-label="Search site"
        />
        <button type="submit" className={styles.searchSubmit}>
          Go
        </button>
      </form>
    </div>
  );
}
