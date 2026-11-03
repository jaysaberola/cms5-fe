import { buildCmsContactFormMarkup } from "@/lib/cmsContactFormMarkup";

export function registerCmsContactFormBlock(editor: any) {
  const bm = editor?.BlockManager;
  if (!bm || bm.get("cms-wsi-contact-form-block")) return;

  bm.add("cms-wsi-contact-form-block", {
    label: "WebFocus Contact Form",
    category: "CMS Forms",
    attributes: { class: "fa fa-envelope" },
    content: `<div class="exec-tpl exec-contact"><div class="exec-container exec-reveal"><div class="exec-contact-form-panel">${buildCmsContactFormMarkup()}</div></div></div>`,
  });
}
