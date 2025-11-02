import { getSearchTerm } from './getSearchTerm';
import type { FetchOptions } from './itunesAPI';
import type { AudiobookDTO } from '../dto/audiobookDTO';
import { getCountryCode } from './getGeo';
import { loadOptions } from './optionsStorage';
import { audimetaRegionMap } from '../dto/countries';

const BASE_URL = 'https://audimeta.de/search';

let audimetaDownUntil: number | null = null;
let audimetaRateLimitedUntil: number | null = null;
const API_TIMEOUT = 2 * 60 * 1000; //2 minutes
const API_WAIT_TIME = 18000; //18 seconds
const DEFAULT_RATE_LIMIT_WAIT = 60 * 1000; //1 minute

export function isAudiMetaDown(): boolean {
  return audimetaDownUntil != null && Date.now() < audimetaDownUntil;
}

function isAudiMetaRateLimited(): boolean {
  return audimetaRateLimitedUntil != null && Date.now() < audimetaRateLimitedUntil;
}

function shouldSkipAudiMetaRequest(): boolean {
  if (audimetaDownUntil && Date.now() < audimetaDownUntil) {
    console.warn("AudiMeta marked as down, skipping request.");
    return true;
  }
  if (audimetaRateLimitedUntil && Date.now() < audimetaRateLimitedUntil) {
    console.warn("AudiMeta temporarily rate-limited, skipping request.");
    return true;
  }
  return false;
}

function isAudiMetaResponseValid(payload: any): boolean {
  if (!payload || typeof payload !== "object") return true;

  if (
    payload.status === 404 ||
    payload.name === "NotFoundException" ||
    payload.code === "E_NOT_FOUND"
  ) {
    console.warn(`[AudiMeta] Not found: ${payload.message ?? "Unknown reason"}`);
    return false;
  }

  if (payload.status === 429 || payload.code === "E_RATE_LIMIT") {
    console.warn(`[AudiMeta] Rate limit hit`);
    return false;
  }

  return true;
}

function handleRateLimitResponse(res: Response): boolean {
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : DEFAULT_RATE_LIMIT_WAIT;
    audimetaRateLimitedUntil = Date.now() + waitMs;
    console.warn(`[AudiMeta] Rate limited. Waiting for ${(waitMs / 1000).toFixed(1)}s`);
    return true;
  }
  return false;
}

function safeParseArray(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.results && Array.isArray(payload.results)) return payload.results;
  if (payload.items && Array.isArray(payload.items)) return payload.items;

  if (typeof payload === 'object' && (payload.title || payload.asin || payload.imageUrl)) {
    return [payload];
  }

  console.warn('audimeta: unexpected JSON shape - returning empty array', payload);
  return [];
}


export async function fetchRandomBatch(options?: FetchOptions): Promise<AudiobookDTO[]> {
  //skip if audimeta is down or rate-limited
  if (shouldSkipAudiMetaRequest()) return [];

  // const offset = Math.floor(Math.random() * 200);
  const limit = 50;

  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = audimetaRegionMap[countryc.toLowerCase()] ?? "us";

  const term = await getSearchTerm(options);

  const query = new URLSearchParams({
    keywords: term,
    region,
    limit: limit.toString(),
    // page: Math.floor(offset / limit).toString(),
    page: '0',
    products_sort_by: 'Relevance',
    cache: 'true',
  });

  const url = `${BASE_URL}?${query.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return [];

    if (!res.ok) throw new Error(`Audimeta error: ${res.status}`);

    const json = await res.json();
    
    if (!isAudiMetaResponseValid(json)) return [];

    let items = safeParseArray(json);
    let filtered = (items || []).filter((item: any) => item && item.isListenable && item.imageUrl);

    const { languageCode } = loadOptions();
    if (languageCode) {
      filtered = filtered.filter((item: any) =>
        typeof item.language === 'string' &&
        item.language.toLowerCase().startsWith(languageCode.toLowerCase())
      );
    }
    if (!filtered || filtered.length === 0) return [];

    // const random = filtered[Math.floor(Math.random() * filtered.length)];
    // return mapAudimetaToDTO(random);
    return filtered.map(mapAudimetaToDTO);
  } catch (e) {
    console.error('Failed to fetch from Audimeta (fetchRandomBatch)', e);
    audimetaDownUntil = Date.now() + API_TIMEOUT
    return [];
  }
}

export function mapAudimetaToDTO(item: any): AudiobookDTO {
  const authors = (item?.authors && Array.isArray(item.authors))
    ? item.authors.map((a: any) => a?.name).filter(Boolean)
    : [];

  const narrators = (item?.narrators && Array.isArray(item.narrators))
    ? item.narrators.map((n: any) => n?.name).filter(Boolean)
    : [];

  const genres = (item?.genres && Array.isArray(item.genres))
    ? item.genres.map((g: any) => g?.name).filter(Boolean)
    : null;

  const seriesList = (item?.series && Array.isArray(item.series))
    ? item.series.map((s: any) => ({
        name: s?.name ?? 'Unknown',
        position: s?.position ?? null,
      }))
    : null;

  return {
    asin: item?.asin ?? null,
    isbn: item?.isbn ?? null,
    itunesId: null,

    title: item?.title ?? null,
    subtitle: item.subtitle ?? null,
    censored_title: null,

    authors: authors.length > 0 ? authors : null,
    narrators: narrators.length > 0 ? narrators : null,
    publisher: item?.publisher ?? null,

    audiblePageUrl: item?.link ?? null,
    itunesPageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: null,
    audibleImageUrl: item?.imageUrl ?? null,

    description: item?.description ?? null,
    summary: item?.summary ?? null,
    genre: item?.genres?.[0]?.name ?? null,
    genres,
    seriesList,
    releaseDate: item?.releaseDate ?? null,
    rating: item?.rating ?? null,

    lengthMinutes: item?.lengthMinutes != null ? item.lengthMinutes.toString() : null,
    durationMinutes: item?.lengthMinutes ?? null,
    bookFormat: item?.bookFormat ?? null,
    language: item?.language ?? null,
    explicit: item?.explicit?.toString() ?? null,
    region: item?.region ?? null,
    regions: item?.regions ?? null,

    _fallback: false,
  };
}

export async function searchBooks(query: string): Promise<AudiobookDTO[]> {
  //skip if audimeta is down or rate-limited
  if (shouldSkipAudiMetaRequest()) return [];

  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = audimetaRegionMap[countryc.toLowerCase()] ?? "us";
  
  const url = `https://audimeta.de/search?keywords=${encodeURIComponent(query)}&region=${region}&limit=50&page=0&products_sort_by=Relevance&cache=true`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return [];
    
    if (!res.ok) throw new Error(`AudiMeta error: ${res.status}`);
    const json = await res.json();
    
    if (!isAudiMetaResponseValid(json)) return [];
    
    const items = safeParseArray(json);

    const filtered = (items || [])
      .filter((item: any) => item && item.isListenable && item.imageUrl)
      .map(mapAudimetaToDTO);

    return filtered;
  } catch (e) {
    console.error('Failed to fetch from Audimeta (searchBooks)', e);
    audimetaDownUntil = Date.now() + API_TIMEOUT
    return [];
  }
}

export async function fetchByAsin(asin: string): Promise<AudiobookDTO | null> {
  //skip if audimeta is down or rate-limited
  if (shouldSkipAudiMetaRequest()) return null;
  
  const opts = loadOptions();
  const countryc = opts.countryCode ?? (await getCountryCode());
  const region = audimetaRegionMap[countryc.toLowerCase()] ?? "us";
  
  const url = `https://audimeta.de/book/${encodeURIComponent(asin)}?region=${region}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_WAIT_TIME);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (handleRateLimitResponse(res)) return null;

    if (!res.ok) {
      console.error(`Audimeta error: ${res.status}`);
      return null;
    }

    const item = await res.json();
    
    if (!isAudiMetaResponseValid(item)) return null;

    if (!item || !item.asin) {
      return null;
    }

    return mapAudimetaToDTO(item);
  } catch (e) {
    console.error('Failed to fetch from Audimeta (fetchByAsin)', e);
    audimetaDownUntil = Date.now() + API_TIMEOUT
    return null;
  }
}
