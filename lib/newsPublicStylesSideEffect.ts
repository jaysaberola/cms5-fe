/**
 * Keep news listing CSS modules in the main client bundle (see publicShellStyleSideEffects.ts).
 */
import FeaturedNewsItem from "@/components/News/NewsItem";
import NewsList from "@/components/News/NewsList";
import LeftSidebar from "@/components/News/LeftSidebar";
import NewsPagination from "@/components/News/NewsPagination";
import NewsReveal from "@/components/News/NewsReveal";

export const NEWS_PUBLIC_STYLE_IMPORTS = {
  FeaturedNewsItem,
  NewsList,
  LeftSidebar,
  NewsPagination,
  NewsReveal,
} as const;
