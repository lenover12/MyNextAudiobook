// src/utils/audimetaAPI.ts
import { getSearchTerm } from './getSearchTerm';
import type { FetchOptions } from './itunesAPI';
import type { AudiobookDTO } from '../dto/audiobookDTO';

const BASE_URL = 'https://audimeta.de/search';

export async function fetchAudimetaRandom(options?: FetchOptions): Promise<AudiobookDTO | null> {
  const offset = Math.floor(Math.random() * 200);
  const limit = 25;

  const term = await getSearchTerm(options);

  const query = new URLSearchParams({
    keywords: term,
    region: 'us',
    limit: limit.toString(),
    page: Math.floor(offset / limit).toString(),
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