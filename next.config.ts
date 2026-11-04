import type { NextConfig } from "next";
import { buildPublicNextRewrites } from "./lib/publicNextRewrites";

const nextConfig: NextConfig = {
  transpilePackages: ['@ray-solutions/react-file-manager'],
  allowedDevOrigins: [
    "127.0.0.1",
    "127.0.0.1:3000",
    "localhost",
    "localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "projects.wsiph2.com",
        pathname: "/webdirectory/cerebro/webfocusph/template/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,  // ✅ temporary until all types are clean
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["grapesjs-preset-webpage", "grapesjs-blocks-basic", "grapesjs-plugin-forms"],
  },
  serverExternalPackages: ["pptxgenjs", "grapesjs", "tesseract.js"],
	devIndicators: false,
  async rewrites() {
    return buildPublicNextRewrites();
  },
  async redirects() {
    return [
      {
        source: "/public/home",
        destination: "/",
        permanent: false,
      },
      {
        source: "/home",
        destination: "/",
        permanent: false,
      },
      {
        source: "/public/about",
        destination: "/about-us",
        permanent: false,
      },
      {
        source: "/about",
        destination: "/about-us",
        permanent: false,
      },
      { source: "/pages", destination: "/manage-pages", permanent: false },
      { source: "/pages/:path*", destination: "/manage-pages/:path*", permanent: false },
      // Legacy CMS news admin URLs only — do not redirect public /news (site News page).
      { source: "/news/create", destination: "/manage-news/create", permanent: false },
      { source: "/news/category_index", destination: "/manage-news/category_index", permanent: false },
      { source: "/news/category_create", destination: "/manage-news/category_create", permanent: false },
      { source: "/news/edit/:path*", destination: "/manage-news/edit/:path*", permanent: false },
      { source: "/news/edit_category/:path*", destination: "/manage-news/edit_category/:path*", permanent: false },
      { source: "/news/preview/:path*", destination: "/manage-news/preview/:path*", permanent: false },
      { source: "/articles", destination: "/news", permanent: false },
      { source: "/articles/:slug", destination: "/news/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
