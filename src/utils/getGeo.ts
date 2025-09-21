import { loadOptions, saveOptions } from "./optionsStorage";
import { countryOptions, type CountryCode } from "../dto/countries";

let cachedCountry: string | null = null;

export async function getCountryCode(): Promise<CountryCode> {
  const options = loadOptions();
  if (options.countryCode) return options.countryCode as CountryCode;
  if (cachedCountry) return cachedCountry as CountryCode;
  try {
    const res = await fetch('https://ipapi.co/json');
    const data = await res.json();
    const country = data.country?.toLowerCase() as CountryCode | undefined;

    if (country && countryOptions.some((c) => c.code === country)) {
      cachedCountry = country;
      saveOptions({ ...options, countryCode: country });
      return country;
    } else {
      return 'us'
    }
  } catch (e) {
    console.warn('Failed to fetch country code:', e);
    return 'us';
  }
}
