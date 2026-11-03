import { resolveStorageAssetUrl } from "@/lib/storageAssets";

const CATEGORY_COLORS = [
  { bg: "rgba(235, 81, 36, 0.16)", text: "#ffb89a", accent: "#eb5124" },
  { bg: "rgba(255, 255, 255, 0.08)", text: "rgba(255, 255, 255, 0.88)", accent: "#ffffff" },
  { bg: "rgba(235, 81, 36, 0.1)", text: "#fca183", accent: "#f97316" },
  { bg: "rgba(148, 163, 184, 0.14)", text: "#cbd5e1", accent: "#94a3b8" },
  { bg: "rgba(255, 255, 255, 0.06)", text: "rgba(255, 255, 255, 0.75)", accent: "#eb5124" },
];

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop stop-color='%230a0a0a'/%3E%3Cstop offset='1' stop-color='%23181818'/%3E%3C/linearGradient%3E%3CradialGradient id='o' cx='80%25' cy='20%25' r='55%25'%3E%3Cstop stop-color='rgba(235,81,36,0.35)'/%3E%3Cstop offset='1' stop-color='rgba(235,81,36,0)'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Crect width='1200' height='675' fill='url(%23o)'/%3E%3C/svg%3E";

function cleanStoragePath(path: string) {
  return path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^storage\//, "");
}

/** Same URL pattern used in admin news edit screens. */
export function buildArticleStorageUrl(pathOrUrl?: string | null): string {
  const raw = String(pathOrUrl ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  if (/^https?:\/\//i.test(raw)) {
    const storageMarker = "/storage/";
    const markerIndex = raw.toLowerCase().indexOf(storageMarker);
    if (markerIndex < 0) return raw;
    const storagePath = raw.slice(markerIndex + storageMarker.length);
    return resolveStorageAssetUrl(storagePath) || raw;
  }

  // Static assets served by the Next.js public folder — keep relative so localhost/127.0.0.1 both work
  if (raw.startsWith("/images/")) {
    return raw;
  }

  const resolved = resolveStorageAssetUrl(raw);
  if (resolved) return resolved;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const path = cleanStoragePath(raw);
  if (!path) return "";

  return apiBase ? `${apiBase}/storage/${path}` : `/storage/${path}`;
}

export function extractFirstContentImage(html?: string | null): string {
  if (!html) return "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return "";
  return buildArticleStorageUrl(match[1]) || match[1];
}

export function getArticleImageCandidates(article: {
  thumbnail_url?: string | null;
  image_url?: string | null;
  contents?: string | null;
}) {
  const candidates: string[] = [];
  const add = (value?: string | null) => {
    const url = buildArticleStorageUrl(value);
    if (url && !candidates.includes(url)) candidates.push(url);
  };

  // Prefer full image over thumbnail for detail view
  add(article.image_url);
  add(article.thumbnail_url);

  const contentImage = extractFirstContentImage(article.contents);
  if (contentImage && !candidates.includes(contentImage)) {
    candidates.push(contentImage);
  }

  return candidates;
}

export function hasArticleImage(article: {
  thumbnail_url?: string | null;
  image_url?: string | null;
  contents?: string | null;
}) {
  return getArticleImageCandidates(article).length > 0;
}

export function getArticleImageUrl(article: {
  thumbnail_url?: string | null;
  image_url?: string | null;
  contents?: string | null;
}) {
  return getArticleImageCandidates(article)[0] || "";
}

export function getArticleCardImageUrl(article: {
  thumbnail_url?: string | null;
  image_url?: string | null;
  contents?: string | null;
}) {
  return getArticleImageUrl(article) || PLACEHOLDER_IMAGE;
}

export function getArticleHeroFallback(category?: { name?: string } | null) {
  return PLACEHOLDER_IMAGE;
}

export function getAuthorInitials(user?: {
  fname?: string;
  lname?: string;
  name?: string;
} | null) {
  const full = getAuthorName(user);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return full.slice(0, 2).toUpperCase();
}

export function getAuthorName(user?: {
  fname?: string;
  lname?: string;
  name?: string;
} | null) {
  if (!user) return "WebFocus Team";
  const full = [user.fname, user.lname].filter(Boolean).join(" ").trim();
  return full || user.name || "WebFocus Team";
}

export function formatArticleDate(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatArticleDateShort(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getCategoryStyle(category?: { id?: number; name?: string } | null) {
  const index = Math.abs(Number(category?.id || 0)) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

export function estimateReadingTime(html?: string | null) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
