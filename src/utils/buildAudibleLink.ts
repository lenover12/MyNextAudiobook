import { regionToStore, type CountryCode } from "../dto/countries";

const AFFILIATE_TAG = "mynextaudiobo-20";

export function buildAudibleLink(asin: string, countryCode: CountryCode = "us"): string {
  const store = regionToStore[countryCode] || "audible.com";
  return `https://www.${store}/pd/${asin}?tag=${AFFILIATE_TAG}`;
}
