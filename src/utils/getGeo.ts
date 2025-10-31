import { loadOptions, saveOptions } from "./optionsStorage";
import { mapCountryToAudibleRegion, type CountryCode } from "../dto/countries";

let cachedCountry: CountryCode | null = null;
let cachedAt: number | null = null;

const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; //24 hours

export async function getCountryCode(): Promise<CountryCode> {
  const options = loadOptions();

  //use in-memory cache
  if (cachedCountry && cachedAt && Date.now() - cachedAt < GEO_CACHE_TTL) {
    return cachedCountry;
  }
  //fallback use stored option
  if (options.countryCode) {
    cachedCountry = options.countryCode as CountryCode;
    cachedAt = Date.now();
    return cachedCountry;
  }
  //fallback detect immediately
  const region = await detectAndUpdateCountry(options);
  return region;
}

export async function refreshCountryIfChanged(): Promise<CountryCode> {
  const options = loadOptions();
  const previous = options.countryCode ?? cachedCountry ?? "us";
  return await detectAndUpdateCountry(options, previous);
}

async function detectAndUpdateCountry(options: any, previous?: string): Promise<CountryCode> {
  let iso: string | undefined;

  //ipapi
  try {
    const res = await fetch('https://ipapi.co/json', { cache: 'no-store' });
    const data = await res.json();
    iso = data?.country?.toLowerCase();
  } catch (err) {
    // console.warn("ipapi.co failed:", err);
  }
  //fallback using navigator (formatted)
  if (!iso && typeof navigator !== "undefined") {
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    if (lang && lang.includes("-")) {
      iso = lang.split("-")[1].toLowerCase(); //e.g. "en-US" to "us"
    }
  }
  //fallback using timezone heuristic
  if (!iso && Intl && Intl.DateTimeFormat) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

      if (tz.includes("Australia")) iso = "au";
      else if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal")) iso = "ca";
      else if (tz.includes("Kolkata") || tz.includes("Delhi")) iso = "in";
      else if (tz.includes("Rome")) iso = "it";
      else if (tz.includes("Tokyo")) iso = "jp";
      else if (tz.includes("Madrid")) iso = "es";
      else if (tz.includes("Berlin")) iso = "de";
      else if (tz.includes("Paris")) iso = "fr";
      else if (tz.includes("London")) iso = "uk";
      else if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles")) iso = "us";
    } catch {
      // ignore
    }
  }
  //fallback
  if (!iso) iso = "us";
  
  const region = mapCountryToAudibleRegion(iso);
  cachedCountry = region;
  cachedAt = Date.now();

  if (previous && previous !== region) {
    // console.log(`country changed: ${previous} to ${region}`);
    saveOptions({ ...options, countryCode: region });
  }

  return region;
}
