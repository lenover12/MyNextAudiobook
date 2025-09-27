import { getSearchTerm } from './getSearchTerm';
import type { FetchOptions } from './itunesAPI';
import type { AudiobookDTO } from '../dto/audiobookDTO';
import { getCountryCode } from './getGeo';

const BASE_URL = 'https://audimeta.de/search';
const supportedRegions = ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'];

export async function fetchRandom(options?: FetchOptions): Promise<AudiobookDTO | null> {
  // const offset = Math.floor(Math.random() * 200);
  const limit = 50;

  const userCountryCode = (await getCountryCode()).toLowerCase();
  const region = supportedRegions.includes(userCountryCode) ? userCountryCode : 'us';

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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audimeta error: ${res.status}`);
    const json = await res.json();
    const filtered = json?.filter((item: any) => item.isListenable && item.imageUrl);
    if (!filtered || filtered.length === 0) return null;

    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return mapAudimetaToDTO(random);
  } catch (e) {
    console.error('Failed to fetch from Audimeta', e);
    return null;
  }
}

export function mapAudimetaToDTO(item: any): AudiobookDTO {
  const authors = item.authors?.map((a: any) => a.name) ?? [];
  const narrators = item.narrators?.map((n: any) => n.name) ?? [];

  const genres = item.genres?.map((g: any) => g.name).filter(Boolean) ?? null;

  const seriesList = item.series?.map((s: any) => ({
    name: s.name ?? 'Unknown',
    position: s.position ?? null,
  })) ?? null;

  return {
    asin: item.asin ?? null,
    isbn: item.isbn ?? null,
    itunesId: null,

    title: item.title,
    subtitle: item.subtitle ?? null,
    censored_title: null,

    authors: authors.length > 0 ? authors : null,
    narrators: narrators.length > 0 ? narrators : null,
    publisher: item.publisher ?? null,

    audiblePageUrl: item.link ?? null,
    itunesPageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: null,
    audibleImageUrl: item.imageUrl ?? null,

    description: item.description ?? null,
    summary: item.summary ?? null,
    genre: item.genres?.[0]?.name ?? null,
    genres,
    seriesList,
    releaseDate: item.releaseDate ?? null,
    rating: item.rating ?? null,

    lengthMinutes: item.lengthMinutes?.toString() ?? null,
    durationMinutes: item.lengthMinutes ?? null,
    bookFormat: item.bookFormat ?? null,
    language: item.language ?? null,
    explicit: item.explicit?.toString() ?? null,
    region: item.region ?? null,
    regions: item.regions ?? null,

    _fallback: false,
  };
}

export async function searchBooks(query: string): Promise<AudiobookDTO[]> {

  const userCountryCode = (await getCountryCode()).toLowerCase();
  const region = supportedRegions.includes(userCountryCode) ? userCountryCode : 'us';

  const url = `https://audimeta.de/search?keywords=${encodeURIComponent(query)}&region=${region}&limit=50&page=0&products_sort_by=Relevance&cache=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json
      .filter((item: any) => item.isListenable && item.imageUrl)
      .map(mapAudimetaToDTO);
  } catch {
    return [];
  }
}

export async function fetchByAsin(asin: string): Promise<AudiobookDTO | null> {
  const url = `https://audimeta.de/book/${encodeURIComponent(asin)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Audimeta fetchByAsin failed: HTTP ${res.status}`);
      return null;
    }

    const item = await res.json();
    if (!item || !item.asin) {
      return null;
    }

    return mapAudimetaToDTO(item);
  } catch (e) {
    console.error("fetchByAsin error:", e);
    return null;
  }
}
