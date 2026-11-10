import { initCmsContactForms } from "@/lib/initCmsContactForms";
import { websiteService } from "@/services/websiteService";
import { useEffect, useState } from "react";

type Props = {
  recaptchaSiteKey?: string;
  rootRef?: React.RefObject<HTMLElement | null>;
};

export default function CmsPublicContactForms({ recaptchaSiteKey = "", rootRef }: Props) {
  const [siteKey, setSiteKey] = useState(recaptchaSiteKey);

  useEffect(() => {
    if (recaptchaSiteKey) {
      setSiteKey(recaptchaSiteKey);
      return;
    }

    let alive = true;
    websiteService
      .getPublicBranding()
      .then((branding) => {
        if (!alive) return;
        setSiteKey(branding?.google_recaptcha_sitekey ?? "");
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [recaptchaSiteKey]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const bind = () => {
      if (cancelled) return;
      const root = rootRef?.current ?? document;
      cleanup?.();
      cleanup = initCmsContactForms({ root, recaptchaSiteKey: siteKey });
    };

    bind();
    const t1 = window.setTimeout(bind, 100);
    const t2 = window.setTimeout(bind, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      cleanup?.();
    };
  }, [siteKey, rootRef]);

  return null;
}
