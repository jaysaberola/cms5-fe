/**
 * Imported from `_app.tsx` so topbar/hero/footer CSS modules stay in the main
 * client bundle. The home route (`/`) must not rely on a lazy page chunk for layout CSS.
 */
import LandingTopbar from "@/components/Layout/_Topbar";
import LandingFooter from "@/components/Layout/_Footer";
import LandingBanner from "@/components/Layout/_Banner";
import MainBanner from "@/components/Layout/MainBanner";
import SignInDropdown from "@/components/Auth/SignInDropdown";
import { NEWS_PUBLIC_STYLE_IMPORTS } from "@/lib/newsPublicStylesSideEffect";

export const PUBLIC_SHELL_STYLE_IMPORTS = {
  LandingTopbar,
  LandingFooter,
  LandingBanner,
  MainBanner,
  SignInDropdown,
  ...NEWS_PUBLIC_STYLE_IMPORTS,
} as const;
