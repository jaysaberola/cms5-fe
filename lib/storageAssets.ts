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

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase() === "localhost" ? "127.0.0.1" : hostname.toLowerCase();
}

/** True when the URL points at this app's Laravel public disk (not CDN/external). */
export function isApiHostedStorageAbsoluteUrl(absolute: string): boolean {
  if (!/^https?:\/\//i.test(absolute)) return false;
  if (!absolute.toLowerCase().includes("/storage/")) return false;

  const base = storageApiBase();
  if (!base) return true;

  try {
    const url = new URL(absolute);
    const allowed = new URL(base);
    return normalizeHostname(url.hostname) === normalizeHostname(allowed.hostname);
  } catch {
    return false;
  }
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

/**
 * CMS admin previews: absolute URL; API `/storage/` assets go through Next image-proxy on the client.
 * External URLs (e.g. Unsplash) are left direct.
 */
export function resolveCmsAdminMediaUrl(pathOrUrl?: string | null): string {
  const absolute = resolveStorageAssetUrl(pathOrUrl) || "";
  if (!absolute) return "";
  if (absolute.startsWith("blob:") || absolute.startsWith("data:")) return absolute;
  if (typeof window === "undefined") return absolute;
  if (isApiHostedStorageAbsoluteUrl(absolute)) {
    return `/api/image-proxy?url=${encodeURIComponent(absolute)}`;
  }
  return absolute;
}

/** Absolute API storage URL for admin UI (never bare /storage on Vercel). */
export function resolveStorageAssetUrlForBrowser(pathOrUrl?: string | null): string {
  return resolveCmsAdminMediaUrl(pathOrUrl);
}

export function resolveStorageAssetUrlWithFallback(
  pathOrUrl?: string | null,
  fallback?: string
): string {
  return resolveStorageAssetUrl(pathOrUrl) || fallback || "";
}

/** @deprecated Use resolveCmsAdminMediaUrl */
export function resolveAdminStorageMediaUrl(pathOrUrl?: string | null): string {
  return resolveCmsAdminMediaUrl(pathOrUrl);
}

export type CmsStorageMediaFields = {
  image_path?: string | null;
  image_url?: string | null;
};

export function resolveCmsStoragePreviewFallback(
  fields: CmsStorageMediaFields,
  currentSrc: string
): string | null {
  const candidates = [fields.image_path, fields.image_url].filter(Boolean) as string[];
  const tried = new Set<string>([currentSrc]);

  for (const raw of candidates) {
    const direct = resolveStorageAssetUrl(raw);
    if (direct && !tried.has(direct)) {
      return direct;
    }
    if (direct) tried.add(direct);

    if (typeof window !== "undefined") {
      const proxied = resolveCmsAdminMediaUrl(raw);
      if (proxied && !tried.has(proxied)) {
        return proxied;
      }
      if (proxied) tried.add(proxied);
    }
  }

  return null;
}

export function handleCmsStoragePreviewError(
  event: { currentTarget: HTMLImageElement },
  fields: CmsStorageMediaFields
) {
  const img = event.currentTarget;
  if (img.dataset.storageFallbackApplied === "1") return;

  const fallback = resolveCmsStoragePreviewFallback(fields, img.src);
  if (fallback) {
    img.dataset.storageFallbackApplied = "1";
    img.src = fallback;
  }
}
