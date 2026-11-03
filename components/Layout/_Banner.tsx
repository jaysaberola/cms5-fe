import { PublicAlbum } from "@/services/publicPageService";
import MainBanner from "./MainBanner";

interface BannerProps {
  title?: string;
  album?: PublicAlbum | null;
}

/** Homepage hero only; inner pages use Grapes section heroes (no sub-banner). */
export default function Banner({ album }: BannerProps) {
  if (album?.type !== "main_banner") return null;
  return <MainBanner album={album} />;
}
