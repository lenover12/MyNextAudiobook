const regionToStore: Record<string, string> = {
  US: "audible.com",
  UK: "audible.co.uk",
  DE: "audible.de",
  FR: "audible.fr",
  AU: "audible.com.au",
  CA: "audible.ca",
  IN: "audible.in",
  IT: "audible.it",
  JP: "audible.co.jp",
  ES: "audible.es",
};

const AFFILIATE_TAG = "TBD";

export function buildAudibleLink(asin: string, countryCode: string = "us"): string {
  const store = regionToStore[countryCode] || "audible.com";
  return `https://www.${store}/pd/${asin}?ref=${AFFILIATE_TAG}`;
}
