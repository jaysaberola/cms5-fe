"use client";

type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  speaking?: boolean;
  className?: string;
};

const PX: Record<Size, number> = {
  sm: 32,
  md: 42,
  lg: 72,
};

const ICON_RATIO: Record<Size, number> = {
  sm: 0.5,
  md: 0.48,
  lg: 0.44,
};

export default function CmsHelpGuideAvatar({ size = "md", speaking = false, className }: Props) {
  const px = PX[size];
  const iconPx = Math.max(14, Math.round(px * ICON_RATIO[size]));

  return (
    <span
      className={["cms-help-avatar", "cms-help-avatar--book", speaking ? "is-speaking" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: px,
        height: px,
        background: "linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)",
        color: "#ffffff",
        fontSize: iconPx,
      }}
      aria-hidden="true"
    >
      <i className="fa-solid fa-book-open" aria-hidden="true" />
    </span>
  );
}
