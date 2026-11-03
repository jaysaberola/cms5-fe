import type { PublicMenuItem } from "@/services/publicPageService";
import { publicNewsPath, publicPagePath } from "@/lib/publicPaths";

/** Known dev/prod hosts saved in menu/footer targets — strip to pathname at render time. */
const KNOWN_PUBLIC_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "cms4-nextjs.vercel.app",
  "webfocus-fe.vercel.app",
]);

const SKIP_HREF_PREFIX =
  /^(#|mailto:|tel:|sms:|javascript:|data:|blob:)/i;

/**
 * Normalize CMS / Grapes / menu URLs so they work on any host (no `/public` prefix).
 */
export function normalizePublicHref(href: string): string {
  const target = String(href ?? "").trim();
  if (!target) return "#";
  if (SKIP_HREF_PREFIX.test(target)) return target;

  if (target.startsWith("/") && !target.startsWith("//")) {
    const pathOnly = target.split("?")[0];
    if (pathOnly === "/news" || pathOnly.startsWith("/public/news")) {
      const slug = pathOnly.replace(/^\/public\/news\/?/, "").replace(/^\/news\/?/, "");
      const qs = target.includes("?") ? target.slice(target.indexOf("?")) : "";
      return `${publicNewsPath(slug || undefined)}${qs}`;
    }
    return normalizePublicPath(target);
  }

  if (target.startsWith("//")) {
    try {
      return normalizeParsedUrl(new URL(`https:${target}`), `https:${target}`);
    } catch {
      return target;
    }
  }

  try {
    return normalizeParsedUrl(new URL(target), target);
  } catch {
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)/i.test(target)) {
      try {
        return normalizeParsedUrl(new URL(`https://${target}`), `https://${target}`);
      } catch {
        // fall through
      }
    }

    if (target.startsWith("public/")) {
      return publicPagePath(target);
    }

    const clean = target.replace(/^\/+/, "");
    if (clean && !clean.includes("://") && !clean.startsWith("?")) {
      if (clean === "news" || clean.startsWith("news/")) {
        const slug = clean.replace(/^news\/?/, "");
        return publicNewsPath(slug || undefined);
      }
      return publicPagePath(clean);
    }

    return publicPagePath(clean);
  }
}

function normalizePublicPath(path: string): string {
  const withQuery = path.split("?")[0];
  if (withQuery.startsWith("/public/news")) {
    const slug = withQuery.replace(/^\/public\/news\/?/, "");
    const qs = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${publicNewsPath(slug || undefined)}${qs}`;
  }
  if (withQuery === "/public/news") {
    const qs = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `${publicNewsPath()}${qs}`;
  }
  return publicPagePath(path);
}

function normalizeParsedUrl(url: URL, fallback: string): string {
  const host = url.hostname.toLowerCase();
  const isKnownHost = KNOWN_PUBLIC_HOSTS.has(host);
  const isPublicPath =
    url.pathname === "/" ||
    url.pathname.startsWith("/public/") ||
    url.pathname.startsWith("/articles");

  if (isKnownHost || isPublicPath) {
    const normalized = normalizePublicHref(`${url.pathname}${url.search}${url.hash}`);
    return normalized;
  }

  if (/^https?:$/i.test(url.protocol)) {
    return fallback.startsWith("http") ? fallback : url.toString();
  }

  return normalizePublicHref(`${url.pathname}${url.search}${url.hash}`);
}

export function resolvePublicMenuHref(item: Pick<PublicMenuItem, "type" | "target">): string {
  const target = String(item.target ?? "").trim();
  if (!target) return "#";
  return normalizePublicHref(target);
}

/** Prefer relative paths when saving menu page items. */
export function buildPublicPageMenuTarget(slug: string): string {
  return publicPagePath(slug);
}

/** Full public URL for admin display (Manage Pages, tooltips, copy). */
export function buildPublicPageFullUrl(slug: string, frontendBase?: string | null): string {
  const path = buildPublicPageMenuTarget(slug);
  const base = (frontendBase || process.env.NEXT_PUBLIC_FRONTEND_URL || "")
    .trim()
    .replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/** Rewrite every href in Grapes/HTML content to a host-safe public path. */
export function rewritePublicHtmlHrefs(html: string): string {
  if (!html) return "";

  return html.replace(
    /href\s*=\s*(["'])(.*?)\1/gi,
    (_match, quote: string, rawHref: string) => {
      const next = normalizePublicHref(rawHref);
      return `href=${quote}${next}${quote}`;
    }
  );
}
