/**
 * Build a storage asset URL that works on localhost and production (admin on Vercel + API on Laravel).
 * Accepts a relative storage path (`banners/foo.jpg`), `/storage/...`, or a full URL from any host.
 */
function extractEmbeddedAbsoluteUrl(value: string): string | undefined {
  const match = value.match(/\/storage\/+(https?:\/\/[^\s"']+)/i);
  return match?.[1];
}

export function storageApiBase(): string {
  const configuredBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!configuredBase) return "";
  return configuredBase.endsWith("/api") ? configuredBase.slice(0, -4) : configuredBase;
}

function buildPublicStorageUrl(storagePath: string): string | undefined {
  const path = storagePath.replace(/^\/+/, "").split("?")[0]?.split("#")[0] ?? "";
  if (!path) return undefined;

  const base = storageApiBase();
  if (base) {
    return `${base}/storage/${path}`;
  }

  // Local dev fallback only — admin on Vercel must set NEXT_PUBLIC_API_URL.
  if (typeof window === "undefined") return undefined;
  return `/storage/${path}`;
}

export function resolveStorageAssetUrl(pathOrUrl?: string | null): string | undefined {
  const raw = (pathOrUrl ?? "").toString().trim().replace(/\\/g, "/");
  if (!raw) return undefined;
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const embeddedAbsolute = extractEmbeddedAbsoluteUrl(raw);
  if (embeddedAbsolute) return embeddedAbsolute;

  if (/^https?:\/\//i.test(raw)) {
    const storageMarker = "/storage/";
    const markerIndex = raw.toLowerCase().indexOf(storageMarker);
    if (markerIndex < 0) return raw;

    const storagePath =
      raw.slice(markerIndex + storageMarker.length).split("?")[0]?.split("#")[0] ?? "";
    return buildPublicStorageUrl(storagePath);
  }

  let storagePath = raw;
  if (raw.startsWith("storage/")) {
    storagePath = raw.slice("storage/".length);
  } else if (raw.startsWith("/storage/")) {
    storagePath = raw.slice("/storage/".length);
  }

  return buildPublicStorageUrl(storagePath);
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
