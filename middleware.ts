import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ROOT_SEGMENTS,
  PUBLIC_FIXED_PATHS,
  PUBLIC_ROOT_PAGE_PATHS,
  stripLegacyPublicPrefix,
} from "@/lib/publicPaths";

/** Set on rewrite requests so we do not redirect `/public/*` → clean URL again (infinite loop). */
const PUBLIC_INTERNAL_REWRITE_HEADER = "x-webfocus-public-rewrite";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isInternalPublicRewrite =
    request.headers.get(PUBLIC_INTERNAL_REWRITE_HEADER) === "1";

  if (pathname.startsWith("/public")) {
    if (isInternalPublicRewrite) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = stripLegacyPublicPrefix(pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  if (PUBLIC_ROOT_PAGE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/home" || pathname === "/home/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname === "/about" || pathname === "/about/") {
    const url = request.nextUrl.clone();
    url.pathname = "/about-us";
    return NextResponse.redirect(url);
  }

  const rewriteToPublic = (internalPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(PUBLIC_INTERNAL_REWRITE_HEADER, "1");
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  };

  const fixedTarget = PUBLIC_FIXED_PATHS[pathname];
  if (fixedTarget) {
    return rewriteToPublic(fixedTarget);
  }

  // Article detail uses `pages/articles/[slug].tsx` (clean URL + client `_next/data` props).
  if (pathname.startsWith("/articles/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/blog/")) {
    const rest = pathname.slice("/blog/".length);
    if (rest) {
      return rewriteToPublic(`/public/blog/${rest}`);
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    const slug = segments[0].toLowerCase();
    if (!ADMIN_ROOT_SEGMENTS.has(slug)) {
      return rewriteToPublic(`/public/${slug}`);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ico|map)$).*)",
  ],
};
