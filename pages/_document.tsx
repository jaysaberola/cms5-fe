import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { ADMIN_FONT_HREF, ADMIN_STYLESHEETS, isAdminSiteRoute } from "@/lib/adminRoute";
import { isPublicSiteRoute } from "@/lib/publicSiteRoute";

type CustomDocumentProps = DocumentInitialProps & {
  isPublicRoute: boolean;
  isAdminRoute: boolean;
};

export default function CustomDocument({ isPublicRoute, isAdminRoute }: CustomDocumentProps) {
  return (
    <Html lang="en">
      <Head>
        {isPublicRoute && (
          <>
            <style
              dangerouslySetInnerHTML={{
                __html: `html.public-booting{background:#050505}html.public-booting body{margin:0;background:#050505;overflow-x:hidden;color:rgba(255,255,255,.72)}html.public-booting .public-site-shell--executra,html.public-booting .public-site-shell--executra .public-site-main{background:#050505}.public-site-shell .brand img,img[src="/images/webfocus-logo.png"]{display:block;height:30px!important;width:auto!important;max-width:130px!important;object-fit:contain}.public-site-header [class*="topbar-inner"]{display:flex!important;align-items:center;justify-content:space-between;gap:12px;min-height:74px}.public-site-header .public-site-nav{display:flex;align-items:center;justify-content:center;flex:1 1 auto;min-width:0}.public-site-header .public-site-nav [class*="nav-list"],.public-site-header .nav-list,.public-site-header ul[class*="nav-list"]{display:flex!important;flex-direction:row!important;align-items:center;gap:4px;margin:0;padding:0;list-style:none}.public-site-header .menu-link,.public-site-header a.menu-link{color:rgba(255,255,255,.78)!important;text-decoration:none;font-weight:600;font-size:.875rem;padding:9px 14px;white-space:nowrap}.public-site-header .menu-item.current>.menu-row>.menu-link,.public-site-header .menu-item.current>.menu-link{color:#fff!important}[data-public-news-page]{background:#050505;color:rgba(255,255,255,.72)}[data-public-news-page] .public-news-hero{background:#0a0a0a}[data-public-hero]{position:relative;min-height:min(88vh,820px);overflow:hidden;background:#0a0a0a}[data-public-hero-strip]{position:absolute;inset:0;overflow:hidden;background:#0a0a0a}[data-public-hero-strip] img,[data-public-hero-strip] video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;display:block!important}.public-page-content img{max-width:100%;height:auto}`,
              }}
            />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=optional"
              rel="stylesheet"
            />
            <link rel="stylesheet" href="/css/public-boot.css" />
            <link rel="stylesheet" href="/css/public-site-header.css" />
            <link rel="stylesheet" href="/css/public-news-boot.css" />
            <link rel="stylesheet" href="/css/executra-cms-theme.css" />
            <link rel="stylesheet" href="/css/executra-footer.css" />
            <link rel="stylesheet" href="/css/public-css.css" />
            <link rel="stylesheet" href="/css/custom.css" />
            <link rel="stylesheet" href="/css/product.css" />
            <link rel="stylesheet" href="/css/banner.css" />
            <link rel="stylesheet" href="/css/navigation.css" />
            <link rel="stylesheet" href="/css/public-overrides.css" />
            <link rel="stylesheet" href="/css/executra-public-pages.css" />
            <link rel="stylesheet" href="/css/cms-studio-buttons.css" />
          </>
        )}
        {isAdminRoute && (
          <>
            {ADMIN_STYLESHEETS.map((href) => (
              <link key={href} rel="stylesheet" href={href} />
            ))}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={ADMIN_FONT_HREF} rel="stylesheet" />
          </>
        )}
      </Head>
      <body>
        {isPublicRoute ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{document.documentElement.classList.add("public-booting");if(localStorage.getItem("webfocus.publicConsent.v1")!=="1"){document.documentElement.classList.add("needs-privacy-consent");}}catch(e){}})();`,
            }}
          />
        ) : null}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function r(){try{document.querySelectorAll("style").forEach(function(n){var t=(n.textContent||"").replace(/\\s/g,"");if(t.indexOf("body{display:none}")!==-1)n.remove();});if(document.body){document.body.style.removeProperty("display");document.body.style.removeProperty("visibility");document.body.classList.add("page-loaded");}var h=document.documentElement;h.classList.add("page-loaded");h.classList.remove("public-booting");}catch(e){}}r();document.addEventListener("DOMContentLoaded",r);window.addEventListener("load",r);setTimeout(r,120);})();`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

function getDocumentPathname(ctx: DocumentContext): string {
  const raw = ctx.req?.url?.split("?")[0];
  if (raw && raw.startsWith("/")) {
    return raw;
  }
  return ctx.pathname || "/";
}

CustomDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await Document.getInitialProps(ctx);
  const pathname = getDocumentPathname(ctx);

  return {
    ...initialProps,
    isPublicRoute: isPublicSiteRoute(pathname),
    isAdminRoute: isAdminSiteRoute(pathname),
  };
};
