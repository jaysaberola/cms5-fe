export const PUBLIC_SITE_THEME_STORAGE_KEY = "webfocus.publicSiteTheme.v1";

export type PublicSiteThemeId = "dark" | "light" | "ocean" | "emerald" | "violet";

export type PublicSiteThemeOption = {
  id: PublicSiteThemeId;
  label: string;
  swatch: string;
  description: string;
};

export const PUBLIC_SITE_THEMES: PublicSiteThemeOption[] = [
  { id: "dark", label: "Dark", swatch: "#eb5124", description: "Default Executra (orange accent)" },
  { id: "light", label: "Light", swatch: "#f97316", description: "Bright layout with dark text" },
  { id: "ocean", label: "Ocean", swatch: "#0ea5e9", description: "Deep navy with sky blue accent" },
  { id: "emerald", label: "Emerald", swatch: "#10b981", description: "Dark green with mint accent" },
  { id: "violet", label: "Violet", swatch: "#a78bfa", description: "Dark plum with purple accent" },
];

/** Themes shown in the header / mobile theme picker (legacy themes remain in CSS only). */
export const PUBLIC_SITE_THEME_PICKER_IDS: PublicSiteThemeId[] = ["dark", "light"];

export const PUBLIC_SITE_THEME_PICKER_OPTIONS = PUBLIC_SITE_THEMES.filter((t) =>
  PUBLIC_SITE_THEME_PICKER_IDS.includes(t.id),
);

const VALID = new Set<string>(PUBLIC_SITE_THEMES.map((t) => t.id));
const PICKER_IDS = new Set<string>(PUBLIC_SITE_THEME_PICKER_IDS);

export const PUBLIC_THEME_BOOT_BG: Record<PublicSiteThemeId, string> = {
  dark: "#050505",
  light: "#f1f5f9",
  ocean: "#0b1220",
  emerald: "#061510",
  violet: "#120a1a",
};

export function isPublicSiteThemeId(value: string | null | undefined): value is PublicSiteThemeId {
  return Boolean(value && VALID.has(value));
}

export function readPublicSiteTheme(): PublicSiteThemeId {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem(PUBLIC_SITE_THEME_STORAGE_KEY);
    if (!isPublicSiteThemeId(raw)) return "dark";
    if (!PICKER_IDS.has(raw)) return "dark";
    return raw;
  } catch {
    return "dark";
  }
}

export function applyPublicSiteTheme(themeId: PublicSiteThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-public-theme", themeId);
  const bootBg = PUBLIC_THEME_BOOT_BG[themeId] || PUBLIC_THEME_BOOT_BG.dark;
  document.documentElement.style.background = bootBg;
  document.body.style.background = bootBg;
  try {
    localStorage.setItem(PUBLIC_SITE_THEME_STORAGE_KEY, themeId);
  } catch {
    // ignore
  }
}
