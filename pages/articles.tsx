import "@/lib/newsPublicStylesSideEffect";
import NewsPage from "./public/news";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import type { ComponentProps } from "react";

function ArticlesPublicPage(props: ComponentProps<typeof NewsPage>) {
  return <NewsPage {...props} />;
}

ArticlesPublicPage.Layout = LandingPageLayout;

export default ArticlesPublicPage;

export { getServerSideProps } from "./public/news";
