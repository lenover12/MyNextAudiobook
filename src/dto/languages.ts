export const languageOptions = [
  { code: "en", label: "🇬🇧 English" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "pt", label: "🇵🇹 Português" },
  { code: "ru", label: "🇷🇺 Русский" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "hi", label: "🇮🇳 हिन्दी" },
] as const;

export type LanguageCode = (typeof languageOptions)[number]["code"];

export const countryToLanguage: Record<string, LanguageCode> = {
  us: "en",
  uk: "en",
  au: "en",
  ca: "en",
  fr: "fr",
  de: "de",
  es: "es",
  it: "it",
  kr: "ko",
  jp: "ja",
  cn: "zh",
  in: "hi",
  br: "pt",
  ru: "ru",
};
