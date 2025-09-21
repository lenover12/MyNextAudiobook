import { regionToStore, type CountryCode } from "../dto/countries";

const AFFILIATE_TAG = "TBD";

export function buildAudibleLink(asin: string, countryCode: CountryCode = "us"): string {
  const store = regionToStore[countryCode] || "audible.com";
  return `https://www.${store}/pd/${asin}?ref=${AFFILIATE_TAG}`;
}
