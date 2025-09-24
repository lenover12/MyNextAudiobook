export const countryOptions = [
  { code: "us", label: "United States" },
  { code: "uk", label: "United Kingdom" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "au", label: "Australia" },
  { code: "ca", label: "Canada" },
  { code: "in", label: "India" },
  { code: "it", label: "Italy" },
  { code: "jp", label: "Japan" },
  { code: "es", label: "Spain" },
] as const;

export type CountryCode = (typeof countryOptions)[number]["code"];

export const regionToStore: Record<CountryCode, string> = {
  us: "audible.com",
  uk: "audible.co.uk",
  de: "audible.de",
  fr: "audible.fr",
  au: "audible.com.au",
  ca: "audible.ca",
  in: "audible.in",
  it: "audible.it",
  jp: "audible.co.jp",
  es: "audible.es",
};
