export type Options = {
  allowExplicit: boolean;
  allowFallback: boolean;
  countryCode?: string;
  languageCode?: string;
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
  enabledGenres: [],
  mustHaveAudible: false,
  preloadAhead: 1,
};

export function loadOptions(): Options {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultOptions;

  try {
    const parsed = JSON.parse(raw) as DeepPartial<Options>;
    return {
      ...defaultOptions,
      ...parsed,
      socialsOptions: {
        ...defaultOptions.socialsOptions,
        ...(parsed.socialsOptions ?? {}),
      },
      enabledGenres: (parsed.enabledGenres ?? defaultOptions.enabledGenres).filter(
        (g): g is string => !!g
      ),
    };
  } catch {
    return defaultOptions;
  }
}

export function saveOptions(options: Options) {
  const diff: DeepPartial<Options> = {};

  for (const key in options) {
    const k = key as keyof Options;
    const value = options[k];
    const defaultValue = defaultOptions[k];

    if (typeof value === "object" && value !== null) {
      const nestedDiff: Record<string, unknown> = {};
      for (const nestedKey in value as object) {
        const v = (value as any)[nestedKey];
        const dv = (defaultValue as any)[nestedKey];
        if (v !== dv) {
          nestedDiff[nestedKey] = v;
        }
      }
      if (Object.keys(nestedDiff).length > 0) {
        (diff as any)[k] = nestedDiff;
      }
    } else {
      if (value !== defaultValue) {
        (diff as any)[k] = value;
      }
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(diff));
}
