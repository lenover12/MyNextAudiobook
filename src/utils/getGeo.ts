import { loadOptions, saveOptions } from "./optionsStorage";
import { mapCountryToAudibleRegion, type CountryCode } from "../dto/countries";

let cachedCountry: CountryCode | null = null;

export async function getCountryCode(): Promise<CountryCode> {
  const options = loadOptions();
  if (options.countryCode) return options.countryCode as CountryCode;
  if (cachedCountry) return cachedCountry;

  try {
    const res = await fetch('https://ipapi.co/json');
    const data = await res.json();
    const iso = data.country?.toLowerCase() as string | undefined;

    const region = iso ? mapCountryToAudibleRegion(iso) : "us";
    cachedCountry = region;
    saveOptions({ ...options, countryCode: region });
    return region;
  } catch (e) {
    console.warn('Failed to fetch country code:', e);
    return 'us';
  }
}
