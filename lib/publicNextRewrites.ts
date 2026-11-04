import { ADMIN_ROOT_SEGMENTS } from "./publicPaths";

type RewriteRule = { source: string; destination: string };

/**
 * Rewrites for CMS URLs. Dynamic slug → `/public/:slug` runs in **afterFiles** so
 * real files like `pages/about-us.tsx` win for client-side navigation + data requests.
 */
export function buildPublicNextRewrites(): {
  beforeFiles: RewriteRule[];
  afterFiles: RewriteRule[];
} {
  const beforeFiles: RewriteRule[] = [
    { source: "/news/:slug", destination: "/public/news/:slug" },
    { source: "/articles/:slug", destination: "/public/news/:slug" },
    { source: "/blog/:path*", destination: "/public/blog/:path*" },
  ];

  const exclude = Array.from(ADMIN_ROOT_SEGMENTS)
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const afterFiles: RewriteRule[] = [
    {
      source: `/:slug((?!${exclude})[a-zA-Z0-9_-]+)`,
      destination: "/public/:slug",
    },
  ];

  return { beforeFiles, afterFiles };
}
