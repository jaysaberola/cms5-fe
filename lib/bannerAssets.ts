import {
  handleCmsStoragePreviewError,
  resolveCmsAdminMediaUrl,
  resolveCmsStoragePreviewFallback,
  resolveStorageAssetUrl,
  type CmsStorageMediaFields,
} from "@/lib/storageAssets";

export type BannerMediaType = "image" | "video";

export const BANNER_IMAGE_RECOMMENDED_WIDTH = 1920;
export const BANNER_IMAGE_RECOMMENDED_HEIGHT = 760;
export const BANNER_MEDIA_MAX_MB = 10;
export const BANNER_MEDIA_MAX_BYTES = BANNER_MEDIA_MAX_MB * 1024 * 1024;
export const BANNER_VIDEO_MAX_BYTES = BANNER_MEDIA_MAX_BYTES;

export const BANNER_IMAGE_REQUIREMENTS_LABEL = `Recommended ${BANNER_IMAGE_RECOMMENDED_WIDTH} × ${BANNER_IMAGE_RECOMMENDED_HEIGHT} px · JPG, PNG, or WebP · max ${BANNER_MEDIA_MAX_MB} MB`;
export const BANNER_VIDEO_REQUIREMENTS_LABEL = `MP4 or WebM · max ${BANNER_MEDIA_MAX_MB} MB per video`;

export function bannerMediaTooLargeMessage(
  fileName: string,
  fileSize: number,
  mediaLabel = "Banner files",
) {
  return `${fileName} is ${formatBannerFileSize(fileSize)}. ${mediaLabel} must be ${BANNER_MEDIA_MAX_MB} MB or smaller.`;
}

export function isVideoAssetUrl(url?: string | null) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(url ?? ""));
}

export function isImageAssetUrl(url?: string | null) {
  return /\.(jpe?g|png|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(String(url ?? ""));
}

function normalizeStoragePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^storage\//, "");
}

export function resolveBannerMediaType(
  banner: {
    image_path?: string | null;
    image_url?: string | null;
    preview?: string | null;
    media_type?: string | null;
    image?: File;
  },
  albumBannerType: BannerMediaType = "image"
): BannerMediaType {
  if (banner.image instanceof File) {
    return banner.image.type.startsWith("video/") ? "video" : "image";
  }

  const candidates = [banner.preview, banner.image_path, banner.image_url].filter(Boolean) as string[];

  if (candidates.some(isVideoAssetUrl)) return "video";
  if (candidates.some(isImageAssetUrl)) return "image";

  if (banner.media_type === "video" || banner.media_type === "image") {
    return banner.media_type;
  }

  return albumBannerType === "video" ? "video" : "image";
}

export function resolveBannerPreviewUrl(
  banner: {
    image_path?: string | null;
    image_url?: string | null;
    preview?: string | null;
  },
  mediaType: BannerMediaType
): string {
  const preview = banner.preview ?? "";
  if (preview.startsWith("blob:") || preview.startsWith("data:")) {
    return preview;
  }

  const raw = banner.image_path || banner.image_url || preview || "";
  if (!raw) return "";

  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const normalized = normalizeStoragePath(raw);
  if (!normalized) return "";

  const absolute = resolveStorageAssetUrl(raw) ?? "";
  if (!absolute) return "";
  if (typeof window !== "undefined" && (mediaType === "video" || mediaType === "image")) {
    return resolveCmsAdminMediaUrl(raw) || absolute;
  }
  return absolute;
}

export function resolveBannerPreviewFallback(
  banner: CmsStorageMediaFields,
  currentSrc: string
): string | null {
  return resolveCmsStoragePreviewFallback(banner, currentSrc);
}

export function handleBannerStoragePreviewError(
  event: { currentTarget: HTMLImageElement },
  banner: CmsStorageMediaFields & { preview?: string | null }
) {
  handleCmsStoragePreviewError(event, banner);
}

export const CMS_STORAGE_LINK_HINT =
  "Deploy latest cms5-be (GET /api/public-disk/…) and ensure the file exists under storage/app/public on the server.";

export function formatBannerFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function bannerMatchesMediaType(
  banner: {
    image_path?: string | null;
    image_url?: string | null;
    preview?: string | null;
    media_type?: string | null;
    image?: File;
  },
  mediaType: BannerMediaType
) {
  return resolveBannerMediaType(banner, mediaType) === mediaType;
}
