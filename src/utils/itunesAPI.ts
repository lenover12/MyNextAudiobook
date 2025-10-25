import { getSearchTerm } from './getSearchTerm';
import { pruneString } from './pruneString';
import type { AudiobookDTO } from '../dto/audiobookDTO';
import type { Genre } from "../dto/genres";
import { getCountryCode } from "./getGeo";

export interface FetchOptions {
  term?: string;
  genres?: Genre[];
  authorHint?: string;
  // limit?: number;
  // country?: string;
  // lang?: string;
  allowExplicit?: boolean;
  allowFallback?: boolean;
}

export interface FallbackBooksByGenre {
  [genre: string]: AudiobookDTO[];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapItunesToDTO(item: any): AudiobookDTO {
  const authors: string[] = item.artistName ? [item.artistName] : [];
  const narrators: string[] = [];
  
  return {

    asin: null,
    isbn: null,
    itunesId: item.collectionId ?? null,

    title: item.collectionName,
    subtitle: null,
    censored_title: item.collectionCensoredName ?? null,

    authors,
    narrators,
    publisher: null,

    audiblePageUrl: null,
    itunesPageUrl: item.collectionViewUrl ?? null,
    audioPreviewUrl: item.previewUrl ?? null,
    itunesImageUrl: (item.artworkUrl600 || item.artworkUrl100?.replace("100x100bb", "600x600bb")) ?? '../assets/loading_img/action.jpg', //change to default_img/no_image.jpg
    audibleImageUrl: null,

    description: item.description ?? null,
    summary: null,
    genre: item.primaryGenreName ?? null,
    genres: null,
    seriesList: null,
    releaseDate: item.releaseDate ?? null,
    rating: null,

    lengthMinutes: null,
    durationMinutes: null,
    bookFormat: null,
    language: null,
    explicit: item.collectionExplicitness ?? null,
    region: null,
    regions: null,
    _fallback: !!item._fallback,
  };
}

let cachedFallbackBooks: FallbackBooksByGenre | null = null;

async function getFallbackBook(genres?: string[]): Promise<AudiobookDTO & { _fallback: true }> {
  if (!cachedFallbackBooks) {
    const { default: rawBooks } = await import('../assets/fallbackBooks.json');
    cachedFallbackBooks = JSON.parse(JSON.stringify(rawBooks)) as FallbackBooksByGenre;
  }

  let candidateGenres: string[];

  if (genres && genres.length > 0) {
    candidateGenres = genres.filter(g => cachedFallbackBooks![g]);
  } else {
    candidateGenres = Object.keys(cachedFallbackBooks!);
  }

  if (candidateGenres.length === 0) {
    candidateGenres = Object.keys(cachedFallbackBooks!);
  }

  const genreKey = candidateGenres[Math.floor(Math.random() * candidateGenres.length)];
  const booksForGenre = cachedFallbackBooks![genreKey];

  if (!booksForGenre || booksForGenre.length === 0) {
    throw new Error(`No fallback books available for genre "${genreKey}"`);
  }

  const book = booksForGenre[Math.floor(Math.random() * booksForGenre.length)];
  return {
    ...book,
    _fallback: true,
  };
}

export async function fetchRandom(options?: FetchOptions): Promise<AudiobookDTO | null> {
  let maxRetries: number;
  if (options?.allowFallback) {
    maxRetries = options?.genres && options.genres.length > 0 ? 7 : 5;
  } else {
    maxRetries = Infinity;
  }
  const PRUNE_RETRY_THRESHOLD = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {

      let term = await getSearchTerm(options);
      console.log(term);

      if (attempt >= PRUNE_RETRY_THRESHOLD) {
        term = pruneString(term);
      }
      
      const offset = Math.floor(Math.random() * 200);
      const limit = Math.min(25, 200 - offset);
      const explicitParam = options?.allowExplicit ? 'yes' : 'no';
      
      const country = await getCountryCode();
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&media=audiobook&limit=${limit}&explicit=${explicitParam}&country=${country}`;

      const response = await fetch(url);

      if (!response.ok){
        if (response.status === 403) {
          console.log("403: max retries")
          await delay(5000 * Math.pow(1.5, attempt));
        } else {
          await delay(500 * Math.pow(1.5, attempt));
        }
        continue;
      }

      const data = await response.json();
      const resultsArray = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      if (!Array.isArray(resultsArray)) {
        console.warn('itunes: unexpected search response shape, treating as empty', data);
      }
      const results = (resultsArray || [])
        .filter((item: any) => {
          if (!item?.previewUrl) return false;
          if (!options?.genres || options.genres.length === 0) return true;
          return options.genres.includes(item.primaryGenreName as Genre);
        })
        .map((item: any) => mapItunesToDTO(item));

      if (results.length > 0) {
        return results[Math.floor(Math.random() * results.length)];
      }
    } catch (e) {
      console.error(`Error on attempt ${attempt}:`, e);
      await delay(500 * Math.pow(1.5, attempt));
    }
  }
  console.log("FALLBACK")

  if (options?.allowFallback) {
    return await getFallbackBook(options.genres);
  }

  return null;
}

export async function searchBooks(query: string): Promise<AudiobookDTO[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=audiobook&limit=25&explicit=yes`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const resultsArray = Array.isArray(json?.results) ? json.results : [];
  return resultsArray
    .filter((item: any) => item.previewUrl)
    .map(mapItunesToDTO);
}

export async function fetchByItunesId(itunesId: string): Promise<AudiobookDTO | null> {
  try {
    const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(itunesId)}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`fetchByItunesId failed: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const item = data.results[0];
    return mapItunesToDTO(item);
  } catch (e) {
    console.error("fetchByItunesId error:", e);
    return null;
  }
}
