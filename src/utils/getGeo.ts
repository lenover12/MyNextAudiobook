import { loadOptions, saveOptions } from "./optionsStorage";

let cachedCountry: string | null = null;

export async function getCountryCode(): Promise<string> {
  const options = loadOptions();
  if (options.countryCode) return options.countryCode.toLowerCase();
  if (cachedCountry) return cachedCountry;
  try {
    const res = await fetch('https://ipapi.co/json');
    const data = await res.json();
    const country = data.country?.toLowerCase();

    if (country) {
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
