import type { CountryCode } from "../dto/countries";
import type { LanguageCode } from "../dto/languages";

export type Options = {
  allowExplicit: boolean;
  allowFallback: boolean;
  countryCode?: CountryCode;
  languageCode?: LanguageCode;
  useQRCode: boolean;
  allowNavigatorShare: boolean;
  socialsOptions: {
    twitter: boolean;
    facebook: boolean;
    linkedin: boolean;
    goodreads: boolean;
    instagram: boolean;
    pinterest: boolean;
    whatsapp: boolean;
    telegram: boolean;
  };
  bookIdsInDomain: boolean;
  enabledGenres: string[];
  mustHaveAudible: boolean;
  preloadAhead: number;
  enableCookies: boolean;
};

const STORAGE_KEY = "mynextaudiobook-options";

//helper to make all nested fields optional too
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const defaultOptions: Options = {
  allowExplicit: false,
  allowFallback: true,
  useQRCode: true,
  allowNavigatorShare: false,
  socialsOptions: {
    twitter: true,
    facebook: true,
    linkedin: true,
    goodreads: true,
    instagram: true,
    pinterest: false,
    whatsapp: true,
    telegram: false,
  },
  bookIdsInDomain: true,
  enabledGenres: [
    "Arts & Entertainment" ,"Biographies & Memoirs" ,"Business & Personal Finance" ,"Children & Teens" ,"Classics" ,"Comedy" ,"Drama & Poetry" ,"Fiction" ,"History" ,"Mysteries & Thrillers" ,"Nonfiction" ,"Romance" ,"Sci-Fi & Fantasy" ,"Science & Nature" ,"Self-Development" ,"Sports & Outdoors" , "Travel & Adventure"
  ],
  mustHaveAudible: false,
  preloadAhead: 1,
  enableCookies: false,
};

export function loadOptions(): Options {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultOptions;

  try {
    const parsed = JSON.parse(raw) as DeepPartial<Options>;

    const socialsOptions = {
      ...defaultOptions.socialsOptions,
      ...(parsed.socialsOptions ?? {}),
    };

    const parsedEnabled = (parsed.enabledGenres ?? defaultOptions.enabledGenres) as any;
    const enabledGenres = Array.isArray(parsedEnabled)
      ? parsedEnabled.filter((g: unknown): g is string => typeof g === "string" && g.length > 0)
      : defaultOptions.enabledGenres;

    return {
      ...defaultOptions,
      ...parsed,
      socialsOptions,
      enabledGenres,
    };
  } catch {
    return defaultOptions;
  }
}

export function saveOptions(options: Options) {
  const diff: DeepPartial<Options> = {};

  for (const key in options) {
    const k = key as keyof Options;
    const value = options[k] as any;
    const def = defaultOptions[k] as any;

    if (Array.isArray(value)) {
      if (JSON.stringify(value) !== JSON.stringify(def)) {
        (diff as any)[k] = value;
      }
      continue;
    }

    if (value && typeof value === "object") {
      const nestedDiff: Record<string, unknown> = {};
      for (const nk in value) {
        const v = value[nk];
        const dv = def?.[nk];
        if (JSON.stringify(v) !== JSON.stringify(dv)) {
          nestedDiff[nk] = v;
        }
      }
      if (Object.keys(nestedDiff).length > 0) {
        (diff as any)[k] = nestedDiff;
      }
    } else {
      if (value !== def) {
        (diff as any)[k] = value;
      }
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(diff));
}
