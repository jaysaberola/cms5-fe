/** Canonical CMS page slugs (URL segment → API slug). */
const SLUG_ALIASES: Record<string, string> = {
  about: "about-us",
};

export function resolvePublicPageSlug(slug: string): string {
  const key = String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
  if (!key) return "home";
  return SLUG_ALIASES[key] ?? key;
}
