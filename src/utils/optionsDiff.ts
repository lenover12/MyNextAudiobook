import type { Options } from "../utils/optionsStorage";

export type OptionsDelta = {
  toggles?: Array<{ key: string; to: boolean }>;
  genres?: { added: string[]; removed: string[] };
  socials?: { enabled: string[]; disabled: string[] };
  selects?: Array<{ key: "countryCode" | "languageCode"; to: string | undefined }>;
};

export function diffOptions(prev: Options, next: Options): OptionsDelta | null {
  const togglesList = ["allowExplicit", "allowFallback", "useQRCode", "allowNavigatorShare", "bookIdsInDomain", "mustHaveAudible"] as const;

  const toggles: OptionsDelta["toggles"] = [];
  for (const k of togglesList) {
    if (prev[k] !== next[k]) toggles.push({ key: k, to: Boolean(next[k]) });
  }

  //genres
  const prevG = new Set(prev.enabledGenres || []);
  const nextG = new Set(next.enabledGenres || []);
  const added = [...nextG].filter(g => !prevG.has(g));
  const removed = [...prevG].filter(g => !nextG.has(g));

  //socials
  const enabled: string[] = [];
  const disabled: string[] = [];
  for (const k of Object.keys(next.socialsOptions || {})) {
    const nk = k as keyof Options["socialsOptions"];
    if ((prev.socialsOptions?.[nk] ?? false) !== (next.socialsOptions?.[nk] ?? false)) {
      (next.socialsOptions?.[nk] ? enabled : disabled).push(k);
    }
  }

  //selects
  const selects: OptionsDelta["selects"] = [];
  if (prev.countryCode !== next.countryCode) selects.push({ key: "countryCode", to: next.countryCode });
  if (prev.languageCode !== next.languageCode) selects.push({ key: "languageCode", to: next.languageCode });

  const has =
    (toggles.length > 0) ||
    (added.length > 0 || removed.length > 0) ||
    (enabled.length > 0 || disabled.length > 0) ||
    (selects.length > 0);

  if (!has) return null;

  return {
    toggles: toggles.length ? toggles : undefined,
    genres: (added.length || removed.length) ? { added, removed } : undefined,
    socials: (enabled.length || disabled.length) ? { enabled, disabled } : undefined,
    selects: selects.length ? selects : undefined,
  };
}
