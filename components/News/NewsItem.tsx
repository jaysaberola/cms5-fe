import Link from "next/link";
import styles from "@/styles/news.module.css";
import {
  estimateReadingTime,
  formatArticleDate,
  formatArticleDateShort,
  getArticleCardImageUrl,
  getAuthorName,
  getCategoryStyle,
} from "@/lib/articleDisplay";
import { publicNewsPath } from "@/lib/publicPaths";

type Props = {
  article: any;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function FeaturedNewsItem({ article }: Props) {
  const categoryStyle = getCategoryStyle(article.category);
  const href = publicNewsPath(article.slug);
  const readingTime = estimateReadingTime(article.teaser || article.contents);

  return (
    <Link href={href} className={`${styles.featured} public-news-featured`}>
      <div className={styles.featuredMedia}>
        <img src={getArticleCardImageUrl(article)} alt={article.name} loading="lazy" decoding="async" />
        <span className={styles.mediaScrim} aria-hidden="true" />
        <span className={styles.featuredBadge}>Featured</span>
      </div>
      <div className={styles.featuredBody}>
        {article.category?.name && (
          <span
            className={styles.categoryBadge}
            style={{ background: categoryStyle.bg, color: categoryStyle.text }}
          >
            {article.category.name}
          </span>
        )}
        <h2 className={styles.featuredTitle}>{article.name}</h2>
        <div className={styles.meta}>
          <span className={styles.metaItem}>{formatArticleDate(article.date)}</span>
          <span className={`${styles.metaItem} ${styles.metaDot}`}>
            {getAuthorName(article.user)}
          </span>
          <span className={`${styles.metaItem} ${styles.metaDot}`}>{readingTime} min read</span>
        </div>
        {article.teaser && <p className={styles.excerpt}>{article.teaser}</p>}
        <span className={styles.readMore}>
          Read full article
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

export function NewsCard({ article, delay = 0 }: Props & { delay?: number }) {
  const categoryStyle = getCategoryStyle(article.category);
  const href = publicNewsPath(article.slug);
  const readingTime = estimateReadingTime(article.teaser || article.contents);

  return (
    <Link
      href={href}
      className={`${styles.card} public-news-card`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      <div className={styles.cardMedia}>
        <img src={getArticleCardImageUrl(article)} alt={article.name} loading="lazy" decoding="async" />
        <span className={styles.mediaScrim} aria-hidden="true" />
        <span className={styles.cardDatePill}>{formatArticleDateShort(article.date)}</span>
      </div>
      <div className={styles.cardBody}>
        {article.category?.name && (
          <span
            className={styles.categoryBadge}
            style={{ background: categoryStyle.bg, color: categoryStyle.text }}
          >
            {article.category.name}
          </span>
        )}
        <h3 className={styles.cardTitle}>{article.name}</h3>
        {article.teaser && <p className={styles.cardExcerpt}>{article.teaser}</p>}
        <div className={styles.cardFooter}>
          <span className={styles.cardMetaLine}>
            {getAuthorName(article.user)}
            <span className={styles.cardMetaDot} aria-hidden="true">
              ·
            </span>
            {readingTime} min
          </span>
          <span className={styles.readMore}>
            Read
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
