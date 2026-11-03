export function isPublicSiteRoute(pathname: string) {
  return (
    pathname.startsWith("/public") ||
    pathname.startsWith("/news/preview") ||
    pathname.startsWith("/pages/preview")
  );
}
