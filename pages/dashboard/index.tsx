import type { GetServerSideProps } from "next";

export default function DashboardLegacyRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/admin-panel",
    permanent: false,
  },
});
