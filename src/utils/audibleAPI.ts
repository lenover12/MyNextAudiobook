import { getSearchTerm } from './getSearchTerm';
import type { FetchOptions } from './itunesAPI';
import type { AudiobookDTO } from '../dto/audiobookDTO';
import { getCountryCode } from './getGeo';
import { loadOptions } from './optionsStorage';
import { mapCountryToAudibleRegion, regionToStore } from '../dto/countries';

// Set VITE_AUDIBLE_WORKER_URL in .env.local (dev) or Cloudflare Pages env vars (prod)
// e.g. VITE_AUDIBLE_WORKER_URL=https://audible-proxy.YOUR_NAME.workers.dev
const WORKER_URL = (import.meta.env.VITE_AUDIBLE_WORKER_URL as string | undefined)?.replace(/\/$/, '');

let audibleDownUntil: number | null = null;
let audibleRateLimitedUntil: number | null = null;
const API_TIMEOUT = 2 * 60 * 1000;   // 2 minutes
const API_WAIT_TIME = 5000;           // 5 seconds
const DEFAULT_RATE_LIMIT_WAIT = 60 * 1000; // 1 minute

export function shouldSkipAudibleRequest(): boolean {
  if (!WORKER_URL) {
    console.warn("[Audible] VITE_AUDIBLE_WORKER_URL not set — skipping.");
    return true;
  }
  if (audibleDownUntil && Date.now() < audibleDownUntil) {
    console.warn("[Audible] Marked as down, skipping request.");
    return true;
  }
  if (audibleRateLimitedUntil && Date.now() < audibleRateLimitedUntil) {
    console.warn("[Audible] Rate limited, skipping request.");
    return true;
  }
  return false;
}

function handleRateLimitResponse(res: Response): boolean {
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : DEFAULT_RATE_LIMIT_WAIT;
    audibleRateLimitedUntil = Date.now() + waitMs;
    console.warn(`[Audible] Rate limited. Waiting ${(waitMs / 1000).toFixed(1)}s`);
    return true;
  }
  return false;
}

// Audible raw product → AudiobookDTO
// _region is injected by callers so we can construct the correct store URL
export function mapAudibleToDTO(item: any): AudiobookDTO {
  const authors = Array.isArray(item?.authors)
    ? item.authors.map((a: any) => a?.name).filter(Boolean)
    : [];

  const narrators = Array.isArray(item?.narrators)
    ? item.narrators.map((n: any) => n?.name).filter(Boolean)
    : [];

  // category_ladders: [{ ladder: [{ name: "Fiction" }, { name: "Thriller" }] }]
  const allGenreNames: string[] = [];
  if (Array.isArray(item?.category_ladders)) {
    for (const entry of item.category_ladders) {
      for (const rung of (entry?.ladder ?? [])) {
        if (rung?.name && !allGenreNames.includes(rung.name)) {
          allGenreNames.push(rung.name);
        }
      }
    }
  }
  const genres = allGenreNames.length > 0 ? allGenreNames : null;

  // series: [{ title: "...", sequence: "3", asin: "..." }]
  const seriesList = Array.isArray(item?.series)
    ? item.series.map((s: any) => ({
        name: s?.title ?? 'Unknown',
        position: s?.sequence ?? null,
      }))
    : null;

  const imageUrl =
    item?.product_images?.['500'] ??
    item?.product_images?.['2400'] ??
    null;

  const region = item?._region as string | undefined;
  const storeHost = region
    ? (regionToStore[region as keyof typeof regionToStore] ?? 'audible.com')
    : 'audible.com';
  const audiblePageUrl = item?.asin ? `https://www.${storeHost}/pd/${item.asin}` : null;

  return {
    asin: item?.asin ?? null,
    isbn: item?.isbn ?? null,
    itunesId: null,

    title: item?.title ?? null,
    subtitle: item?.subtitle ?? null,
    censored_title: null,

    authors: authors.length > 0 ? authors : null,
    narrators: narrators.length > 0 ? narrators : null,
    publisher: item?.publisher_name ?? null,

    audiblePageUrl,
    itunesPageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: null,
    audibleImageUrl: imageUrl,

    description: item?.merchandising_summary ?? null,
    summary: item?.publisher_summary ?? null,
    genre: genres?.[0] ?? null,
    genres,
    seriesList,
    releaseDate: item?.release_date ?? null,
    rating: item?.rating?.overall_distribution?.average_rating ?? null,

    lengthMinutes: item?.runtime_length_min != null ? String(item.runtime_length_min) : null,
    durationMinutes: item?.runtime_length_min ?? null,
    bookFormat: item?.format_type ?? null,
    language: item?.language ?? null,
    explicit: item?.is_adult_product?.toString() ?? null,
    region: region ?? null,
    regions: null,

    _fallback: false,
  };
}

export async function fetchRandomBatch(options?: FetchOptions): Promise<AudiobookDTO[]> {
  if (shouldSkipAudibleRequest()) return [];

  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = mapCountryToAudibleRegion(countryc);
  const term = await getSearchTerm(options);

  const params = new URLSearchParams({ keywords: term, region, limit: '50' });
  const url = `${WORKER_URL}/search?${params}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return [];
    if (!res.ok) throw new Error(`Audible error: ${res.status}`);

    const json = await res.json();
    let items: any[] = json?.products ?? [];

    let filtered = items.filter((item: any) => item?.is_listenable && item?.product_images);

    const { languageCode } = loadOptions();
    if (languageCode) {
      filtered = filtered.filter((item: any) =>
        typeof item.language === 'string' &&
        item.language.toLowerCase().startsWith(languageCode.toLowerCase())
      );
    }

    if (filtered.length === 0) return [];
    return filtered.map((item: any) => mapAudibleToDTO({ ...item, _region: region }));
  } catch (e) {
    console.error('[Audible] Failed to fetch random batch', e);
    audibleDownUntil = Date.now() + API_TIMEOUT;
    return [];
  }
}

export async function searchBooks(query: string): Promise<AudiobookDTO[]> {
  if (shouldSkipAudibleRequest()) return [];

  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = mapCountryToAudibleRegion(countryc);

  const params = new URLSearchParams({ keywords: query, region, limit: '50' });
  const url = `${WORKER_URL}/search?${params}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return [];
    if (!res.ok) throw new Error(`Audible error: ${res.status}`);

    const json = await res.json();
    const items: any[] = json?.products ?? [];

    return items
      .filter((item: any) => item?.is_listenable && item?.product_images)
      .map((item: any) => mapAudibleToDTO({ ...item, _region: region }));
  } catch (e) {
    console.error('[Audible] Failed to search books', e);
    audibleDownUntil = Date.now() + API_TIMEOUT;
    return [];
  }
}

export async function fetchByAsin(asin: string): Promise<AudiobookDTO | null> {
  if (shouldSkipAudibleRequest()) return null;

  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = mapCountryToAudibleRegion(countryc);

  const params = new URLSearchParams({ region });
  const url = `${WORKER_URL}/book/${encodeURIComponent(asin)}?${params}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return null;
    if (!res.ok) {
      console.error(`[Audible] Error fetching ASIN ${asin}: ${res.status}`);
      return null;
    }

    const json = await res.json();
    const item = json?.product ?? null;
    if (!item?.asin) return null;

    return mapAudibleToDTO({ ...item, _region: region });
  } catch (e) {
    console.error('[Audible] Failed to fetch by ASIN', e);
    audibleDownUntil = Date.now() + API_TIMEOUT;
    return null;
  }
}
