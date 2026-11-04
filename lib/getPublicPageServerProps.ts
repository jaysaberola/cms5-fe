import { getPublicPageBySlug } from "@/services/publicPageService";
import { buildRenderedPublicPageHtml, normalizeGrapesPageData } from "@/lib/grapesContent";
import { resolvePublicPageSlug } from "@/lib/resolvePublicPageSlug";

export async function getPublicPageServerProps(slug: string) {
  const normalizedSlug = resolvePublicPageSlug(slug);

  try {
    const res = await getPublicPageBySlug(normalizedSlug);
    const pageData = normalizeGrapesPageData({
      ...res.data,
      contents: res.data.content,
    });
    const htmlContent = buildRenderedPublicPageHtml(pageData) || "";
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
