import {
  CMS_INQUIRY_TYPE_OPTIONS,
  CMS_PREFERRED_SERVICE_OPTIONS,
} from "@/lib/cmsContactFormConstants";

function inquirySelect() {
  const options = ['<option value="">Select inquiry type</option>']
    .concat(CMS_INQUIRY_TYPE_OPTIONS.map((o) => `<option value="${o}">${o}</option>`))
    .join("");
  return `
    <div class="exec-field exec-field--full">
      <label class="exec-label" for="cms_inquiry_type">Inquiry type <span class="exec-label-required">*</span></label>
      <select id="cms_inquiry_type" name="inquiry_type" required>
        ${options}
      </select>
    </div>`;
}

function preferredServices() {
  const items = CMS_PREFERRED_SERVICE_OPTIONS.map(
    (service) => `
      <label>
        <input type="checkbox" name="preferred_services" value="${service}" data-cms-preferred-service="1" />
        ${service}
      </label>`,
  ).join("");
  return `
    <div class="exec-field exec-field--full" data-cms-contact-preferred-services="1">
      <span class="exec-label">Preferred services <span class="exec-label-optional">(optional)</span></span>
      <div class="exec-preferred-grid">${items}</div>
    </div>`;
}

/** Live Contact Us form — field names match POST /api/contact. Styled for Executra / exec-tpl. */
export function buildCmsContactFormMarkup(options?: {
  title?: string;
  hint?: string | null;
  includePreferredServices?: boolean;
  mobileLabel?: string;
}) {
  const title = options?.title ?? "Send a message";
  const hint =
    options?.hint === null
      ? ""
      : (options?.hint ?? "Fields marked with * are required. Our team will respond as soon as possible.");
  const includePreferred = options?.includePreferredServices !== false;
  const mobileLabel = options?.mobileLabel ?? "Mobile number";

  return `
<form data-cms-contact-form="1" class="cms-wsi-contact-form" novalidate>
  <h2 class="exec-form-title">${title}</h2>
  ${hint ? `<p class="exec-form-hint">${hint}</p>` : ""}
  <div data-cms-contact-alert class="exec-contact-alert"></div>
  ${inquirySelect()}
  <div class="exec-form-grid">
    <div class="exec-field">
      <label class="exec-label" for="cms_first_name">First name <span class="exec-label-required">*</span></label>
      <input id="cms_first_name" name="first_name" type="text" required autocomplete="given-name" class="exec-input" />
    </div>
    <div class="exec-field">
      <label class="exec-label" for="cms_last_name">Last name <span class="exec-label-required">*</span></label>
      <input id="cms_last_name" name="last_name" type="text" required autocomplete="family-name" class="exec-input" />
    </div>
    <div class="exec-field">
      <label class="exec-label" for="cms_email">Email <span class="exec-label-required">*</span></label>
      <input id="cms_email" name="email" type="email" required autocomplete="email" class="exec-input" />
    </div>
    <div class="exec-field">
      <label class="exec-label" for="cms_contact_number">${mobileLabel} <span class="exec-label-required">*</span></label>
      <input id="cms_contact_number" name="contact_number" type="tel" inputmode="numeric" autocomplete="tel" placeholder="e.g. 09171234567" required class="exec-input" data-cms-ph-mobile="1" />
      <div data-cms-contact-phone-error style="display:none;margin-top:6px;font-size:12px;color:#ffb4a0;"></div>
    </div>
  </div>
  <div class="exec-field exec-field--full">
    <label class="exec-label" for="cms_message">Message <span class="exec-label-required">*</span></label>
    <textarea id="cms_message" name="message" rows="5" required class="exec-input"></textarea>
  </div>
  ${includePreferred ? preferredServices() : ""}
  <div class="exec-contact-recaptcha" data-cms-contact-recaptcha="1" style="margin:1.25rem 0;">
    <div data-cms-recaptcha-host="1" style="min-height:78px;display:flex;align-items:center;justify-content:flex-start;">
      <span data-cms-recaptcha-placeholder="1" style="display:inline-flex;align-items:center;gap:10px;min-width:304px;min-height:78px;padding:0 12px;border:1px solid #d3d3d3;border-radius:3px;background:#f9f9f9;color:#555;font:400 14px Roboto,Helvetica,Arial,sans-serif;box-sizing:border-box;">
        <span style="width:24px;height:24px;border:2px solid #c1c1c1;border-radius:2px;background:#fff;flex:0 0 auto;"></span>
        I'm not a robot
      </span>
    </div>
  </div>
  <button type="submit" data-cms-contact-submit="1" class="exec-btn exec-btn--primary exec-btn--no-arrow">Send message</button>
</form>`;
}
