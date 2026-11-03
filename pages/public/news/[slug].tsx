import Head from "next/head";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import NewsArticleView from "@/components/News/NewsArticleView";
import { usePublicPageAutoRecover } from "@/lib/usePublicPageAutoRecover";
import { usePublicRouteTransition } from "@/lib/usePublicRouteTransition";
import { getArticleBySlug } from "@/services/articleService";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { getMenuById } from "@/services/menuService";
import styles from "@/styles/news.module.css";
import { useRouter } from "next/router";

type Props = {
  pageData: any;
  article: any;
};

export default function NewsDetailPage({ article, pageData }: Props) {
  const router = useRouter();
  const isRouteTransitioning = usePublicRouteTransition();
  usePublicPageAutoRecover(article ?? pageData, { isRouteTransitioning });

  if (!article && (!router.isReady || isRouteTransitioning)) {
    return (
      <div className={styles.page} data-public-news-page="" aria-busy="true">
        <div className={styles.shell}>
          <p className={styles.pageLead}>Loading article…</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={styles.page} data-public-news-page="">
        <div className={styles.shell}>
          <p className={styles.pageLead}>Article not found.</p>
        </div>
      </div>
    );
  }

  const title = article.meta_title || article.name || "News";
  const description = article.meta_description || article.teaser || "";

  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>

      <div className={styles.page} data-public-news-page="">
        <NewsArticleView article={article} />
      </div>
    </>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const slug = String(params?.slug ?? "").trim();
    if (!slug) {
      return { notFound: true };
    }

    const res = await getArticleBySlug(slug);
    const payload = res.data?.data ?? res.data;
    if (!payload || typeof payload !== "object") {
      return { notFound: true };
    }

    let article = payload as Record<string, unknown>;
    let contents = String(article.contents || "");

    const matches = Array.from(contents.matchAll(/<!--\s*CMS_MENU:(\d+)\s*-->/g));
    const menuIds = [...new Set(matches.map((m) => Number((m as RegExpMatchArray)[1])))] as number[];

    for (const mid of menuIds) {
      try {
        const mres: any = await getMenuById(mid);
        const menu = mres?.data?.data ?? mres?.data ?? null;
        if (!menu) continue;

        const renderItems = (items: any[]): string => {
          if (!Array.isArray(items) || !items.length) return "";
          let html = '<ul class="cms-menu">';
          for (const it of items) {
            const label = it.title || it.name || it.label || it.text || "Untitled";
            const href = it.url || it.link || it.path || (it.page ? `/pages/${it.page.slug || it.page.id}` : "#");
            const openInNewTabValue =
              it?.openInNewTab ??
              it?.open_in_new_tab ??
              it?.newTab ??
              it?.targetBlank ??
              it?.target_blank ??
              it?.targetAttr ??
              it?.target_attr;
            const openInNewTab =
              openInNewTabValue === true ||
              openInNewTabValue === 1 ||
              ["true", "1", "yes", "_blank"].includes(String(openInNewTabValue ?? "").trim().toLowerCase()) ||
              /^https?:\/\//i.test(String(href || ""));
            const targetAttrs = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
            html += `<li><a href="${href}"${targetAttrs}>${label}</a>`;
            const children = it.children || it.items || it.child || [];
            if (Array.isArray(children) && children.length) {
              html += renderItems(children);
            }
            html += `</li>`;
          }
          html += "</ul>";
          return html;
        };

        const menuHtml = `<nav class="cms-menu-root"><h4>${menu.name || "Menu"}</h4>${renderItems(Array.isArray(menu.items) ? menu.items : [])}</nav>`;

        const token = new RegExp(`<!--\\s*CMS_MENU:${mid}\\s*-->`, "g");
        contents = contents.replace(token, menuHtml);
      } catch {
        // ignore failed menu fetches
      }
    }

    article = { ...article, contents } as typeof article;

    let newsPageMeta: any = { slug: "news", title: "News" };
    try {
      const newsPageRes = await getPublicPageBySlug("news");
      newsPageMeta = newsPageRes.data;
    } catch {
      // keep fallback
    }

    return {
      props: {
        pageData: {
          ...newsPageMeta,
          title: (article.name as string) || "News",
          meta: {
            title: (article.meta_title as string) || (article.name as string) || "News",
            description: (article.meta_description as string) || (article.teaser as string) || null,
          },
        },
        layout: { fullWidth: true, hideBanner: true },
        article,
      },
    };
  } catch {
    return { notFound: true };
  }
}

NewsDetailPage.Layout = LandingPageLayout;
