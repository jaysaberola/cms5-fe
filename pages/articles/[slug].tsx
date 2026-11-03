/**
 * Clean URL `/articles/:slug` — must exist as a page file so client `_next/data` requests
 * receive SSR props (rewrites alone are not enough for client navigation).
 */
export { default, getServerSideProps } from "../public/news/[slug]";
