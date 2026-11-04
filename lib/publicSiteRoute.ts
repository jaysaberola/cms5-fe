import { ADMIN_ROOT_SEGMENTS, PUBLIC_FIXED_PATHS } from "@/lib/publicPaths";

export function isPublicSiteRoute(pathname: string) {
  const path = (pathname || "/").split("?")[0];

  if (path.startsWith("/public")) return true;
  if (
    path.startsWith("/manage-news/preview") ||
    path.startsWith("/manage-pages/preview")
  ) {
    return true;
  }

  if (path === "/") return true;
  if (PUBLIC_FIXED_PATHS[path]) return true;
  if (path.startsWith("/articles")) return true;
  if (path.startsWith("/blog")) return true;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1 && !ADMIN_ROOT_SEGMENTS.has(segments[0].toLowerCase())) {
    return true;
  }

  return false;
}
