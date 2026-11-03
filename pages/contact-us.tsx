import ContactUsPage from "./public/contact-us";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import type { ComponentProps } from "react";

function ContactUsPublicPage(props: ComponentProps<typeof ContactUsPage>) {
  return <ContactUsPage {...props} />;
}

ContactUsPublicPage.Layout = LandingPageLayout;

export default ContactUsPublicPage;

export { getServerSideProps } from "./public/contact-us";
