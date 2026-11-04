/** Admin sign-in (staff CMS). */
export const ADMIN_LOGIN_PATH = "/login";

/**
 * First URL segments that belong to the CMS/admin app — not CMS Grapes pages.
 * Keep in sync with `pages/` and `middleware.ts`.
 */
export const ADMIN_ROOT_SEGMENTS = new Set([
  "account-management",
  "admin-panel",
  "api",
  "banners",
  "dashboard",
  "files",
  "forgot-password",
  "login",
  "manage-news",
  "manage-pages",
  "menu",
  "public",
  "reset-password",
  "settings",
  "users",
]);

/**
 * Clean URLs with a matching file under `pages/*.tsx` — middleware must not rewrite these
 * to `/public/*` or client navigation loses SSR props.
 */
export const PUBLIC_ROOT_PAGE_PATHS = new Set([
  "/",
  "/about-us",
  "/news",
  "/contact-us",
]);

/** Fixed public routes (not Grapes `[slug]` pages). */
export const PUBLIC_FIXED_PATHS: Record<string, string> = {
  "/contact-us": "/public/contact-us",
  "/search": "/public/search",
  "/events": "/public/events",
  "/careers": "/public/careers",
  "/news": "/public/news",
  "/blog": "/public/blog",
};

/** Public URL for a CMS page slug (no `/public` prefix). */
export function publicPagePath(slugOrPath: string): string {
  const raw = String(slugOrPath ?? "").trim();
  if (!raw || raw === "#") return "/";

  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) {
    try {
      const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
      return publicPagePath(url.pathname);
    } catch {
      return "/";
    }
  }

  let path = raw.startsWith("/") ? raw : `/${raw}`;
  path = path.replace(/^\/public(?=\/|$)/, "") || "/";
  if (path === "/home") return "/";
  if (path === "/about" || path.startsWith("/about/")) {
    return path.replace(/^\/about\b/, "/about-us");
  }
  return path;
}

/** Public news index + article URLs (CMS admin is `/manage-news`). */
export function publicNewsPath(articleSlug?: string | null): string {
  if (!articleSlug) return "/news";
  const clean = String(articleSlug).replace(/^\/+/, "");
  return `/news/${clean}`;
}

export function stripLegacyPublicPrefix(pathname: string): string {
  const path = pathname || "/";
  if (path === "/public" || path === "/public/home") return "/";
  if (path.startsWith("/public/")) {
    return path.slice("/public".length) || "/";
  }
  return path;
}
