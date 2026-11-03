import { getPublicPageBySlug } from "@/services/publicPageService";
import { buildPublicPageHtml, normalizeGrapesPageData } from "@/lib/grapesContent";
import { rewritePublicHtmlHrefs } from "@/lib/publicMenuLinks";
import { resolvePublicPageSlug } from "@/lib/resolvePublicPageSlug";

export async function getPublicPageServerProps(slug: string) {
  const normalizedSlug = resolvePublicPageSlug(slug);

  try {
    const res = await getPublicPageBySlug(normalizedSlug);
    const pageData = normalizeGrapesPageData(res.data);
    const htmlContent =
      rewritePublicHtmlHrefs(buildPublicPageHtml(pageData) ?? "") || "";
    const hideBanner = normalizedSlug !== "home";

    return {
      props: {
        pageData,
        htmlContent,
        layout: { fullWidth: true, hideBanner },
      },
    };
  } catch {
    return { notFound: true };
  }
}
