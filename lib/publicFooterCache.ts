import { useSyncExternalStore } from "react";
import type { PublicFooter } from "@/services/publicPageService";
import { getFooter } from "@/services/publicPageService";

export const PUBLIC_FOOTER_STORAGE_KEY = "cms4.publicFooter.v4";

/** Drop legacy cached footers (pre-Executra markup). */
export function isExecutraFooter(footer: PublicFooter | null | undefined): boolean {
  const html = String(footer?.grapes_html || footer?.contents || "");
  return html.includes("exec-footer-top") || html.includes('class="exec-footer"');
}

const LEGACY_FOOTER_KEYS = [
  "cms4.publicFooter.v1",
  "cms4.publicFooter.v2",
  "cms4.publicFooter.v3",
];

export const PUBLIC_FOOTER_UPDATED_EVENT = "cms4:public-footer-updated";

let memoryFooter: PublicFooter | null = null;
let inflight: Promise<PublicFooter | null> | null = null;
let cachedFooterSnapshot: PublicFooter | null = null;
let cachedFooterSnapshotKey = "";

function purgeLegacyFooterStorage() {
  if (typeof window === "undefined") return;
  try {
    LEGACY_FOOTER_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

function readFooterFromSessionStorage(): PublicFooter | null {
  if (typeof window === "undefined") return null;

  purgeLegacyFooterStorage();

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_FOOTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicFooter;
    if (!isExecutraFooter(parsed)) {
      window.sessionStorage.removeItem(PUBLIC_FOOTER_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function computeStoredPublicFooter(): PublicFooter | null {
  if (memoryFooter) {
    if (!isExecutraFooter(memoryFooter)) {
      memoryFooter = null;
      return null;
    }
    return memoryFooter;
  }
  memoryFooter = readFooterFromSessionStorage();
  return memoryFooter;
}

function getPublicFooterSnapshot(): PublicFooter | null {
  const next = computeStoredPublicFooter();
  if (!next) {
    if (cachedFooterSnapshotKey === "empty") return cachedFooterSnapshot;
    cachedFooterSnapshotKey = "empty";
    cachedFooterSnapshot = null;
    return null;
  }

  const nextKey = JSON.stringify({ id: next.id, slug: next.slug, gen: next.grapes_html?.length ?? 0 });
  if (nextKey === cachedFooterSnapshotKey) return cachedFooterSnapshot;

  cachedFooterSnapshotKey = nextKey;
  cachedFooterSnapshot = next;
  return cachedFooterSnapshot;
}

function subscribePublicFooter(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(PUBLIC_FOOTER_UPDATED_EVENT, onStoreChange);
  return () => window.removeEventListener(PUBLIC_FOOTER_UPDATED_EVENT, onStoreChange);
}

export function useStoredPublicFooter(): PublicFooter | null {
  return useSyncExternalStore(subscribePublicFooter, getPublicFooterSnapshot, () => null);
}

export function readStoredPublicFooter(): PublicFooter | null {
  return getPublicFooterSnapshot();
}

export function storePublicFooter(footer: PublicFooter | null) {
  if (footer && !isExecutraFooter(footer)) {
    footer = null;
  }
  memoryFooter = footer;
  cachedFooterSnapshotKey = "";
  if (typeof window === "undefined") return;

  purgeLegacyFooterStorage();

  try {
    if (!footer) window.sessionStorage.removeItem(PUBLIC_FOOTER_STORAGE_KEY);
    else window.sessionStorage.setItem(PUBLIC_FOOTER_STORAGE_KEY, JSON.stringify(footer));
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new Event(PUBLIC_FOOTER_UPDATED_EVENT));
}

export async function getFooterCached(opts?: { force?: boolean }): Promise<PublicFooter | null> {
  const force = opts?.force === true;

  if (!force) {
    const cached = readStoredPublicFooter();
    if (cached && isExecutraFooter(cached)) return cached;
  }

  if (!inflight) {
    inflight = getFooter()
      .then((res) => {
        const footer = res.data?.data ?? null;
        if (footer && isExecutraFooter(footer)) storePublicFooter(footer);
        else storePublicFooter(null);
        return footer && isExecutraFooter(footer) ? footer : null;
      })
      .catch(() => readStoredPublicFooter())
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}
