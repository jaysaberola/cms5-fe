import type { ComponentProps } from "react";
import PublicPageView from "@/components/Public/PublicPageView";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageServerProps } from "@/lib/getPublicPageServerProps";

function AboutUsPublicPage(props: ComponentProps<typeof PublicPageView>) {
  return <PublicPageView {...props} />;
}

AboutUsPublicPage.Layout = LandingPageLayout;

export default AboutUsPublicPage;

export async function getServerSideProps() {
  return getPublicPageServerProps("about-us");
}
