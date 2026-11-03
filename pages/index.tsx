import type { ComponentProps } from "react";
import PublicPageView from "@/components/Public/PublicPageView";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageServerProps } from "@/lib/getPublicPageServerProps";

function HomePublicPage(props: ComponentProps<typeof PublicPageView>) {
  return <PublicPageView {...props} />;
}

HomePublicPage.Layout = LandingPageLayout;

export default HomePublicPage;

export async function getServerSideProps() {
  return getPublicPageServerProps("home");
}
