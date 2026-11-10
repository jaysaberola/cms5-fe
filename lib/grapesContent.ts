import {
  getCanvas7PreviewBootstrap,
  getCanvas7StylesheetMarkup,
  htmlNeedsCanvas7Assets,
} from "@/lib/canvasTemplateCatalog";
import { rewritePublicHtmlHrefs } from "@/lib/publicMenuLinks";

export type EditorContentType = "tiny" | "grapes";

export type GrapesParts = {
  grapes_html: string;
  grapes_css: string;
  grapes_js: string;
};

export type GrapesPageLike = {
  content?: string | null;
  /** Admin API field — full Grapes export (html + style + script). */
  contents?: string | null;
  content_type?: string | null;
  grapes_html?: string | null;
  grapes_css?: string | null;
  grapes_js?: string | null;
};

/** Full editor blob from admin (`contents`) or public API (`content`). */
export function pageEditorPayload(page: Pick<GrapesPageLike, "content" | "contents">): string {
  return String(page.contents ?? page.content ?? "").trim();
}

/**
 * Prefer HTML/CSS/JS parsed from `contents`/`content` — that field is updated on every save.
 * Stale `grapes_*` columns on production must not override fresh link URLs in `contents`.
 */
export function resolveGrapesPartsFromPage(page: GrapesPageLike): GrapesParts {
  const payload = pageEditorPayload(page);
  const parsed = extractGrapesParts(payload);
  const fromPayload = Boolean(payload);

  return {
    grapes_html: (fromPayload ? parsed.grapes_html : "") || String(page.grapes_html ?? "").trim(),
    grapes_css: (fromPayload ? parsed.grapes_css : "") || String(page.grapes_css ?? "").trim(),
    grapes_js: (fromPayload ? parsed.grapes_js : "") || String(page.grapes_js ?? "").trim(),
  };
}

/** Normalize CRLF/CR to LF so SSR and client hydration match on Windows. */
export function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function normalizeGrapesPageData<T extends GrapesPageLike>(page: T): T {
  const payload = pageEditorPayload(page);
  return {
    ...page,
    content: normalizeLineEndings(page.content || payload),
    contents: normalizeLineEndings(page.contents || payload),
    grapes_html: normalizeLineEndings(page.grapes_html || ""),
    grapes_css: normalizeLineEndings(page.grapes_css || ""),
    grapes_js: normalizeLineEndings(page.grapes_js || ""),
  };
}

/** Grapes sometimes saves full document fragments; strip wrappers that break public layout. */
export function sanitizeGrapesPublicHtml(html: string): string {
  let out = normalizeLineEndings((html || "").trim());
  if (!out) return out;

  out = out.replace(/<!DOCTYPE[^>]*>/gi, "");
  out = out.replace(/<\/?html[^>]*>/gi, "");
  out = out.replace(/<\/?head[^>]*>[\s\S]*?(<\/head>|$)/gi, "");
  out = out.replace(/<\/?body[^>]*>/gi, "");

  // Editor-only notes (banner tips, etc.) must not appear on the live site.
  out = out.replace(/<[^>]+data-cms-editor-only[^>]*>[\s\S]*?<\/[^>]+>/gi, "");
  out = out.replace(/<[^>]+class="[^"]*\bcms-editor-only\b[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");
  out = out.replace(
    /\s*(?:Hero image|Sub-banner) above is managed in(?:\s|<[^>]+>)*?(?:Manage Banner)[\s\S]*?(?:Sub Banner\.?|<\/strong>\.?)/gi,
    "",
  );

  return out.trim();
}

/** Same HTML pipeline as live public pages (home, /about-us, etc.). */
export function buildRenderedPublicPageHtml(pageData: GrapesPageLike): string {
  return rewritePublicHtmlHrefs(buildPublicPageHtml(pageData) ?? "");
}

export function buildPublicPageHtml(pageData: GrapesPageLike): string {
  const hasGrapesFields = Boolean(pageData?.grapes_html || pageData?.grapes_css || pageData?.grapes_js);
  const isGrapes = pageData?.content_type === "grapes" || hasGrapesFields;

  if (!isGrapes) return normalizeLineEndings(pageEditorPayload(pageData));

  const parts = resolveGrapesPartsFromPage(pageData);
  const grapesHtml = sanitizeGrapesPublicHtml(normalizeLineEndings(parts.grapes_html));

  return composeContentFromGrapes({
    grapes_html: grapesHtml,
    grapes_css: normalizeLineEndings(parts.grapes_css),
    grapes_js: normalizeLineEndings(parts.grapes_js),
  });
}

export const extractGrapesParts = (content: string): GrapesParts => {
  const raw = normalizeLineEndings(content || "");

  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const grapes_css = (styleMatch?.[1] || "").trim();
  const grapes_js = (scriptMatch?.[1] || "").trim();

  let grapes_html = raw;
  if (styleMatch?.[0]) {
    grapes_html = grapes_html.replace(styleMatch[0], "");
  }
  if (scriptMatch?.[0]) {
    grapes_html = grapes_html.replace(scriptMatch[0], "");
  }

  return {
    grapes_html: grapes_html.trim(),
    grapes_css,
    grapes_js,
  };
};

export const composeContentFromGrapes = (parts: Partial<GrapesParts>) => {
  const html = normalizeLineEndings((parts.grapes_html || "").trim());
  const css = normalizeLineEndings((parts.grapes_css || "").trim());
  const js = normalizeLineEndings((parts.grapes_js || "").trim());

  const cssTag = css ? `\n<style>${css}</style>` : "";
  const jsTag = js ? `\n<script>${js}</script>` : "";
  const canvas7Tag = htmlNeedsCanvas7Assets(html)
    ? `\n${getCanvas7StylesheetMarkup()}\n${getCanvas7PreviewBootstrap()}`
    : "";

  return normalizeLineEndings(`${canvas7Tag}${html}${cssTag}${jsTag}`.trim());
};
