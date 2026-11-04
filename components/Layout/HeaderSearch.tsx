import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/_topbar.module.css";

export default function HeaderSearch() {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        if (!query.trim()) setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, query]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = query.trim();
    if (!value) {
      router.push("/search");
      setOpen(false);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
    setOpen(false);
  };

  const openSearch = () => {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
      ref={shellRef}
      className={`public-header-search ${styles.searchShell} ${open ? styles.searchShellOpen : ""}`}
    >
      <button
        type="button"
        className={`public-header-search-toggle ${styles.searchToggle}`}
        onClick={openSearch}
        aria-label="Open search"
        aria-expanded={open}
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
