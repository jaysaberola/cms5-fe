export function isContactUsPageSlug(slug?: string | null) {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  return normalized === "contact-us" || normalized === "contact";
}

export function isContactUsPage(input?: {
  slug?: string | null;
  name?: string | null;
  label?: string | null;
  title?: string | null;
}) {
  if (isContactUsPageSlug(input?.slug)) return true;
  const text = `${input?.name || ""} ${input?.label || ""} ${input?.title || ""}`
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");
  return text === "contact" || /\bcontact us\b/.test(text);
}
