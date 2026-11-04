import React from "react";
import { CMS_STORAGE_LINK_HINT, handleBannerStoragePreviewError } from "@/lib/bannerAssets";
import type { CmsStorageMediaFields } from "@/lib/storageAssets";

type CommonProps = {
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
};

type CmsStorageImageProps = CommonProps & {
  src?: string | null;
  alt?: string;
  fallbackFields?: CmsStorageMediaFields;
  missingClassName?: string;
  inlineMissing?: boolean;
};

export function CmsStorageImage({
  src,
  alt = "",
  fallbackFields,
  className,
  style,
  missingClassName = "cms-storage-media-missing",
  inlineMissing = false,
  ...rest
}: CmsStorageImageProps) {
  if (!src) {
    if (inlineMissing) {
      return (
        <div className={`home-banner-empty home-banner-empty--inline ${missingClassName}`}>
          <p>{CMS_STORAGE_LINK_HINT}</p>
        </div>
      );
    }
    return (
      <div className={missingClassName} title={CMS_STORAGE_LINK_HINT}>
        <i className="fa fa-image" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={
        fallbackFields
          ? (e) => handleBannerStoragePreviewError(e, fallbackFields)
          : undefined
      }
      {...rest}
    />
  );
}

type CmsStorageVideoProps = CommonProps & {
  src?: string | null;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "" | "none" | "metadata" | "auto";
  videoKey?: string;
};

export function CmsStorageVideo({
  src,
  className,
  style,
  controls,
  muted,
  loop,
  playsInline,
  preload,
  videoKey,
  ...rest
}: CmsStorageVideoProps) {
  if (!src) {
    return (
      <div className="home-banner-empty home-banner-empty--inline">
        <p>{CMS_STORAGE_LINK_HINT}</p>
      </div>
    );
  }

  return (
    <video
      key={videoKey}
      src={src}
      className={className}
      style={style}
      controls={controls}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      {...rest}
    />
  );
}
