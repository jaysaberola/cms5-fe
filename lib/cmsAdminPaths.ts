/** CMS admin UI routes (not public site, not Laravel API). */
export const CMS_MANAGE_PAGES_PREFIX = "/manage-pages";
export const CMS_MANAGE_NEWS_PREFIX = "/manage-news";

export function cmsManagePagesPath(suffix = ""): string {
  if (!suffix) return CMS_MANAGE_PAGES_PREFIX;
  return suffix.startsWith("/")
    ? `${CMS_MANAGE_PAGES_PREFIX}${suffix}`
    : `${CMS_MANAGE_PAGES_PREFIX}/${suffix}`;
}

export function cmsManageNewsPath(suffix = ""): string {
  if (!suffix) return CMS_MANAGE_NEWS_PREFIX;
  return suffix.startsWith("/")
    ? `${CMS_MANAGE_NEWS_PREFIX}${suffix}`
    : `${CMS_MANAGE_NEWS_PREFIX}/${suffix}`;
}
