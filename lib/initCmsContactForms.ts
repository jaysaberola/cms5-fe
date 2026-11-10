import {
  normalizePhMobile,
  phMobileError,
  phMobileLiveError,
  phMobileMaxLength,
  rejectLetterKey,
  sanitizePhMobileInput,
} from "@/lib/phMobile";
import { sendContactMessage } from "@/services/publicPageService";

type InitOptions = {
  root?: ParentNode | null;
  recaptchaSiteKey?: string;
};

type FormState = {
  recaptchaToken: string | null;
  widgetId: number | null;
  submitting: boolean;
};

const boundForms = new WeakMap<HTMLFormElement, FormState>();

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="google.com/recaptcha/api.js"]');
    if (existing) {
      window.__recaptchaOnLoad = () => resolve();
      return;
    }

    window.__recaptchaOnLoad = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });
}

function showAlert(form: HTMLFormElement, kind: "success" | "error", message: string) {
  const alert = form.querySelector("[data-cms-contact-alert]") as HTMLElement | null;
  if (!alert) return;
  alert.classList.remove("is-success", "is-error");
  alert.classList.add(kind === "success" ? "is-success" : "is-error");
  alert.style.display = "block";
  alert.textContent = message;
}

function hideAlert(form: HTMLFormElement) {
  const alert = form.querySelector("[data-cms-contact-alert]") as HTMLElement | null;
  if (!alert) return;
  alert.classList.remove("is-success", "is-error");
  alert.style.display = "none";
}

function resetForm(form: HTMLFormElement, state: FormState) {
  form.reset();
  state.recaptchaToken = null;
  if (state.widgetId !== null && window.grecaptcha) {
    window.grecaptcha.reset(state.widgetId);
  }
  form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-cms-preferred-service]').forEach((el) => {
    el.checked = false;
  });
  const phoneError = form.querySelector("[data-cms-contact-phone-error]") as HTMLElement | null;
  if (phoneError) {
    phoneError.style.display = "none";
    phoneError.textContent = "";
  }
}

function bindPhoneInput(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('input[name="contact_number"]');
  if (!input || input.dataset.cmsPhoneBound === "1") return;
  input.dataset.cmsPhoneBound = "1";

  const errorEl = form.querySelector("[data-cms-contact-phone-error]") as HTMLElement | null;

  input.addEventListener("keydown", rejectLetterKey as any);
  input.addEventListener("input", () => {
    input.value = sanitizePhMobileInput(input.value);
    input.maxLength = phMobileMaxLength(input.value);
    const live = phMobileLiveError(input.value);
    if (errorEl) {
      if (live) {
        errorEl.style.display = "block";
        errorEl.textContent = live;
      } else {
        errorEl.style.display = "none";
        errorEl.textContent = "";
      }
    }
  });
}

function unlockRecaptchaLayout(mount: HTMLElement) {
  const clearSizeLocks = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.removeProperty("height");
    el.style.removeProperty("max-height");
    el.style.removeProperty("overflow");
    el.style.removeProperty("overflow-x");
    el.style.removeProperty("overflow-y");
    el.style.setProperty("height", "auto", "important");
    el.style.setProperty("max-height", "none", "important");
    el.style.setProperty("overflow", "visible", "important");
  };

  clearSizeLocks(mount);
  clearSizeLocks(mount.querySelector<HTMLElement>("[data-cms-recaptcha-host]"));
  clearSizeLocks(mount.querySelector<HTMLElement>(".g-recaptcha"));

  // Consistent gap after Message / before Submit on every contact template.
  mount.style.setProperty("margin-top", "1.25rem", "important");
  mount.style.setProperty("margin-bottom", "1.25rem", "important");

  // Keep Google's private response field hidden (our form CSS can unhide it).
  mount.querySelectorAll<HTMLTextAreaElement>("textarea.g-recaptcha-response").forEach((el) => {
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("height", "1px", "important");
    el.style.setProperty("min-height", "0", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("border", "0", "important");
    el.style.setProperty("margin", "0", "important");
    el.style.setProperty("padding", "0", "important");
  });

  const iframe = mount.querySelector("iframe");
  if (iframe) {
    iframe.style.removeProperty("max-width");
    iframe.style.setProperty("display", "inline-block", "important");
    iframe.style.setProperty("width", "304px", "important");
    iframe.style.setProperty("height", "78px", "important");
    const h = iframe.getBoundingClientRect().height || iframe.offsetHeight || 78;
    mount.style.setProperty("min-height", `${Math.ceil(h)}px`, "important");
  }

  // Grapes sometimes saves fixed height/overflow on the form panel — unlock those too.
  let parent: HTMLElement | null = mount.parentElement;
  while (parent && parent !== document.body) {
    if (
      parent.classList.contains("exec-contact-form-panel") ||
      parent.classList.contains("cms-wsi-contact-form") ||
      parent.classList.contains("cms-contact-form-card")
    ) {
      parent.style.removeProperty("height");
      parent.style.removeProperty("max-height");
      parent.style.setProperty("overflow", "visible", "important");
      parent.style.setProperty("height", "auto", "important");
    }
    if (parent.matches("form[data-cms-contact-form]")) break;
    parent = parent.parentElement;
  }
}

async function mountRecaptcha(form: HTMLFormElement, state: FormState, siteKey: string) {
  const mount = form.querySelector("[data-cms-contact-recaptcha]") as HTMLElement | null;
  if (!mount || mount.dataset.cmsRecaptchaMounted === "1") return;

  if (!siteKey) {
    mount.innerHTML =
      '<p class="exec-contact-recaptcha-msg" style="margin:0;font-size:13px;color:#b45309;">reCAPTCHA is not configured. Contact the site administrator.</p>';
    return;
  }

  try {
    await loadRecaptchaScript();
    if (!window.grecaptcha) return;

    unlockRecaptchaLayout(mount);

    // Replace editor placeholder with a clean host for the live Google widget.
    let host = mount.querySelector<HTMLElement>("[data-cms-recaptcha-host]");
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("data-cms-recaptcha-host", "1");
      mount.replaceChildren(host);
    } else {
      host.replaceChildren();
      host.removeAttribute("style");
    }
    mount.querySelectorAll("[data-cms-recaptcha-placeholder]").forEach((node) => node.remove());

    state.widgetId = window.grecaptcha.render(host, {
      sitekey: siteKey,
      callback: (token) => {
        state.recaptchaToken = token;
      },
      "expired-callback": () => {
        state.recaptchaToken = null;
      },
      "error-callback": () => {
        state.recaptchaToken = null;
      },
    });
    mount.dataset.cmsRecaptchaMounted = "1";

    // Google finishes sizing asynchronously (and error states are taller).
    window.requestAnimationFrame(() => unlockRecaptchaLayout(mount));
    window.setTimeout(() => unlockRecaptchaLayout(mount), 250);
    window.setTimeout(() => unlockRecaptchaLayout(mount), 1000);
  } catch {
    mount.innerHTML =
      '<p style="margin:0;font-size:13px;color:#b45309;">Unable to load reCAPTCHA. Please refresh and try again.</p>';
  }
}

async function handleSubmit(
  event: Event,
  form: HTMLFormElement,
  state: FormState,
  siteKey: string,
) {
  event.preventDefault();
  hideAlert(form);

  if (!siteKey) {
    showAlert(form, "error", "reCAPTCHA is not configured. Please contact the site administrator.");
    return;
  }

  if (!state.recaptchaToken) {
    showAlert(form, "error", "Please complete the reCAPTCHA verification before submitting.");
    return;
  }

  const inquiry_type = (form.querySelector('[name="inquiry_type"]') as HTMLSelectElement)?.value?.trim() ?? "";
  const first_name = (form.querySelector('[name="first_name"]') as HTMLInputElement)?.value?.trim() ?? "";
  const last_name = (form.querySelector('[name="last_name"]') as HTMLInputElement)?.value?.trim() ?? "";
  const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim() ?? "";
  const contact_number = (form.querySelector('[name="contact_number"]') as HTMLInputElement)?.value?.trim() ?? "";
  const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement)?.value?.trim() ?? "";

  const phoneError = phMobileError(contact_number, true);
  if (phoneError) {
    showAlert(form, "error", phoneError);
    return;
  }

  const preferred_services = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[data-cms-preferred-service]:checked'),
  ).map((el) => el.value);

  if (state.submitting) return;
  state.submitting = true;
  const submitBtn = form.querySelector<HTMLButtonElement>("[data-cms-contact-submit]");
  const prevLabel = submitBtn?.textContent ?? "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
  }

  try {
    await sendContactMessage({
      inquiry_type,
      first_name,
      last_name,
      email,
      contact_number: normalizePhMobile(contact_number),
      message,
      preferred_services: preferred_services.length ? preferred_services : undefined,
      recaptcha_token: state.recaptchaToken,
    });
    showAlert(form, "success", "Thank you! Your message has been sent successfully.");
    resetForm(form, state);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || "Something went wrong. Please try again later.";
    showAlert(form, "error", msg);
    if (state.widgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(state.widgetId);
    }
    state.recaptchaToken = null;
  } finally {
    state.submitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel || "Submit Message";
    }
  }
}

export function initCmsContactForms(options: InitOptions = {}) {
  if (typeof document === "undefined") return () => {};

  const root = options.root ?? document;
  const siteKey = options.recaptchaSiteKey ?? "";

  const forms = Array.from(root.querySelectorAll<HTMLFormElement>('form[data-cms-contact-form="1"]'));

  forms.forEach((form) => {
    if (form.dataset.cmsContactBound === "1") return;
    form.dataset.cmsContactBound = "1";

    const state: FormState = { recaptchaToken: null, widgetId: null, submitting: false };
    boundForms.set(form, state);
    bindPhoneInput(form);
    void mountRecaptcha(form, state, siteKey);

    form.addEventListener("submit", (event) => {
      void handleSubmit(event, form, state, siteKey);
    });
  });

  return () => {
    forms.forEach((form) => {
      delete form.dataset.cmsContactBound;
      form.querySelector("[data-cms-contact-recaptcha]")?.removeAttribute("data-cms-recaptcha-mounted");
      boundForms.delete(form);
    });
  };
}
