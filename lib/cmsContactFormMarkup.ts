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
      <span class="exec-label">Preferred services <span style="font-weight:500;color:var(--exec-muted)">(optional)</span></span>
      <div class="exec-preferred-grid">${items}</div>
    </div>`;
}

/** Live Contact Us form — field names match POST /api/contact. Styled for Executra / exec-tpl. */
export function buildCmsContactFormMarkup(options?: { title?: string; hint?: string }) {
  const title = options?.title ?? "Send a message";
  const hint =
    options?.hint ?? "Fields marked with * are required. Our team will respond as soon as possible.";

  return `
<form data-cms-contact-form="1" class="cms-wsi-contact-form" novalidate>
  <h2 class="exec-form-title">${title}</h2>
  <p class="exec-form-hint">${hint}</p>
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
      <label class="exec-label" for="cms_contact_number">Mobile number <span class="exec-label-required">*</span></label>
      <input id="cms_contact_number" name="contact_number" type="tel" inputmode="numeric" autocomplete="tel" placeholder="e.g. 09171234567" required class="exec-input" data-cms-ph-mobile="1" />
      <div data-cms-contact-phone-error style="display:none;margin-top:6px;font-size:12px;color:#ffb4a0;"></div>
    </div>
  </div>
  <div class="exec-field exec-field--full">
    <label class="exec-label" for="cms_message">Message <span class="exec-label-required">*</span></label>
    <textarea id="cms_message" name="message" rows="5" required class="exec-input"></textarea>
  </div>
  ${preferredServices()}
  <div class="exec-contact-recaptcha" data-cms-contact-recaptcha="1"></div>
  <button type="submit" data-cms-contact-submit="1" class="exec-btn exec-btn--primary exec-btn--no-arrow">Send message</button>
</form>`;
}
