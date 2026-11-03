import type { ComponentProps } from "react";
import PublicPageView from "@/components/Public/PublicPageView";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageServerProps } from "@/lib/getPublicPageServerProps";

function DynamicPublicPage(props: ComponentProps<typeof PublicPageView>) {
  return <PublicPageView {...props} />;
}

DynamicPublicPage.Layout = LandingPageLayout;

export default DynamicPublicPage;

export async function getServerSideProps(context: { params?: { page?: string } }) {
  const { page } = context.params ?? {};
  return getPublicPageServerProps(String(page || ""));
}
