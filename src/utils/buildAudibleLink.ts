import { regionToStore, type CountryCode } from "../dto/countries";
import { affiliateTags } from "../dto/affiliateTag";

export function buildAudibleLink(asin: string, countryCode: CountryCode = "us"): string {
  const store = regionToStore[countryCode] || "audible.com";
  const tag = affiliateTags[countryCode] || affiliateTags.us;
  return `https://www.${store}/pd/${asin}?tag=${tag}`;
}