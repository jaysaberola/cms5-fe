/**
 * Build a storage asset URL that works on localhost and production.
 * Accepts a relative storage path (`banners/foo.jpg`), `/storage/...`, or a full URL
 * from any host and rewrites it using NEXT_PUBLIC_API_URL.
 */
function extractEmbeddedAbsoluteUrl(value: string): string | undefined {
  const match = value.match(/\/storage\/+(https?:\/\/[^\s"']+)/i);
  return match?.[1];
}

export function resolveStorageAssetUrl(pathOrUrl?: string | null): string | undefined {
  const raw = (pathOrUrl ?? "").toString().trim().replace(/\\/g, "/");
  if (!raw) return undefined;
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const embeddedAbsolute = extractEmbeddedAbsoluteUrl(raw);
  if (embeddedAbsolute) return embeddedAbsolute;

  // Pass through non-storage absolute URLs (frontend assets, CDN, etc.)
  if (/^https?:\/\//i.test(raw)) {
    const storageMarker = "/storage/";
    const markerIndex = raw.toLowerCase().indexOf(storageMarker);
    if (markerIndex < 0) return raw;

    const storagePath =
      raw.slice(markerIndex + storageMarker.length).split("?")[0]?.split("#")[0] ?? "";
    if (!storagePath) return undefined;

    const configuredBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const base = configuredBase.endsWith("/api") ? configuredBase.slice(0, -4) : configuredBase;
    if (!base) {
      return typeof window !== "undefined" ? `/storage/${storagePath}` : undefined;
    }
    return `${base}/storage/${storagePath}`;
  }

  let storagePath = raw;

  if (raw.startsWith("storage/")) {
    storagePath = raw.slice("storage/".length);
  } else if (raw.startsWith("/storage/")) {
    storagePath = raw.slice("/storage/".length);
  }

  storagePath = storagePath.replace(/^\/+/, "").split("?")[0]?.split("#")[0] ?? "";
  if (!storagePath) return undefined;

  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const configuredBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const base = configuredBase.endsWith("/api") ? configuredBase.slice(0, -4) : configuredBase;

  if (!base) {
    if (typeof window !== "undefined") {
      return `/storage/${storagePath}`;
    }
    return undefined;
  }
  return `${base}/storage/${storagePath}`;
}

/** Absolute API storage URL for admin UI (never bare /storage on Vercel). */
export function resolveStorageAssetUrlForBrowser(pathOrUrl?: string | null): string {
  return resolveStorageAssetUrl(pathOrUrl) || "";
}

export function resolveStorageAssetUrlWithFallback(
  pathOrUrl?: string | null,
  fallback?: string
): string {
  return resolveStorageAssetUrl(pathOrUrl) || fallback || "";
}
