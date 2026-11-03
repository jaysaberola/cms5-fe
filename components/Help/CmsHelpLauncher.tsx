"use client";

import { useCmsHelp } from "@/lib/cmsHelp/CmsHelpContext";
import CmsHelpGuideAvatar from "@/components/Help/CmsHelpGuideAvatar";
export default function CmsHelpLauncher() {
  const { mode, openBrowse } = useCmsHelp();

  if (mode !== "closed") return null;

  return (
    <button
      type="button"
      className="cms-help-launcher"
      aria-label="Open CMS guide library"
      title="CMS guide library"
      onClick={() => openBrowse()}
    >
      <CmsHelpGuideAvatar size="sm" />
    </button>
  );
}
