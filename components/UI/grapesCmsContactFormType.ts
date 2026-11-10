/**
 * Keep the live CMS contact form as one editable unit in GrapesJS so
 * plugin-forms / canvas grid rules don't scatter fields or open huge drop gaps.
 */
export function registerCmsContactFormComponentType(editor: any) {
  const domc = editor?.DomComponents;
  if (!domc?.addType) return;
  if (domc.getType?.("cms-wsi-contact-form")) return;

  domc.addType("cms-wsi-contact-form", {
    isComponent: (el: HTMLElement) =>
      Boolean(
        el?.getAttribute?.("data-cms-contact-form") === "1" ||
          el?.classList?.contains?.("cms-wsi-contact-form"),
      ),
    model: {
      defaults: {
        tagName: "form",
        name: "Contact Form",
        droppable: false,
        highlightable: true,
        attributes: {
          "data-cms-contact-form": "1",
          class: "cms-wsi-contact-form",
          novalidate: true,
        },
        styles: `
          form.cms-wsi-contact-form {
            display: block !important;
          }
          form.cms-wsi-contact-form .exec-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
          form.cms-wsi-contact-form .exec-field {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-bottom: 1rem;
          }
          form.cms-wsi-contact-form textarea.exec-input {
            min-height: 140px;
          }
          form.cms-wsi-contact-form .exec-contact-recaptcha {
            margin: 1.25rem 0;
          }
        `,
      },
    },
  });

  domc.addType("cms-contact-recaptcha", {
    isComponent: (el: HTMLElement) =>
      Boolean(el?.getAttribute?.("data-cms-contact-recaptcha") === "1"),
    model: {
      defaults: {
        name: "reCAPTCHA",
        droppable: false,
        editable: false,
        highlightable: true,
        attributes: {
          "data-cms-contact-recaptcha": "1",
          class: "exec-contact-recaptcha",
        },
      },
    },
  });
}
