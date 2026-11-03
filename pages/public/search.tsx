import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { publicPagePath } from "@/lib/publicPaths";
import { searchSite, SearchSiteResponse } from "@/services/searchService";

export default function PublicSearchPage() {
  const router = useRouter();
  const qRaw = router.query.q;
  const q = Array.isArray(qRaw) ? qRaw.join(" ") : (qRaw || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchSiteResponse | null>(null);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);

    if (!q || typeof q !== "string" || q.trim() === "") {
      setResults(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    searchSite(q)
      .then((res) => {
        if (!mounted) return;
        setResults(res);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError("Failed to fetch search results.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q]);

  return (
    <div className="executra-public-shell" style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Search</p>
      <h1 style={{ margin: "0 0 1.5rem", fontFamily: "Outfit, system-ui, sans-serif", fontWeight: 400, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#fff" }}>Search results</h1>

      {!q || q.toString().trim() === "" ? (
        <div className="alert alert-info">Enter a search query in the topbar.</div>
      ) : (
        <>
          <p className="text-muted">Results for <strong>{q}</strong></p>

          {loading && <div className="mb-3">Loading results...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && results && (
            <div>
              <section className="mb-4">
                <h5>Pages</h5>
                {results.pages.length === 0 ? (
                  <div className="text-muted">No pages found.</div>
                ) : (
                  <ul className="list-group">
                    {results.pages.map((p) => {
                      const href = p.url || (p.slug ? publicPagePath(p.slug) : "#");
                      const fullHref = href.startsWith("http") || !origin ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                      return (
                        <li key={p.id ?? p.slug} className="list-group-item">
                          <Link href={href}>{p.title || p.slug}</Link>
                          <div className="small text-muted">
                            <a href={fullHref} target="_blank" rel="noopener noreferrer">{fullHref}</a>
                          </div>
                          {p.excerptHtml ? (
                            <div className="text-muted small" dangerouslySetInnerHTML={{ __html: p.excerptHtml }} />
                          ) : (
                            p.excerpt && <div className="text-muted small">{p.excerpt}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="mb-4">
                <h5>Articles</h5>
                {results.articles.length === 0 ? (
                  <div className="text-muted">No articles found.</div>
                ) : (
                  <ul className="list-group">
                    {results.articles.map((a) => {
                      const href = a.url || (a.slug ? `/news/${a.slug}` : "#");
                      const fullHref = href.startsWith("http") || !origin ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                      return (
                        <li key={a.id ?? a.slug} className="list-group-item">
                          <Link href={href}>{a.title}</Link>
                          <div className="small text-muted">
                            <a href={fullHref} target="_blank" rel="noopener noreferrer">{fullHref}</a>
                          </div>
                          {a.excerptHtml ? (
                            <div className="text-muted small" dangerouslySetInnerHTML={{ __html: a.excerptHtml }} />
                          ) : (
                            a.excerpt && <div className="text-muted small">{a.excerpt}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* "Other results" removed per request */}
            </div>
          )}
        </>
      )}
    </div>
  );
}

PublicSearchPage.Layout = LandingPageLayout;

export async function getServerSideProps() {
  return {
    props: {
      pageData: { slug: "search", title: "Search" },
      layout: { fullWidth: true, hideBanner: true },
    },
  };
}
