import { getSearchTerm } from './getSearchTerm';
import { pruneString } from './pruneString';
import type { AudiobookEntry, FallbackBook, FallbackBooksByGenre } from '../types/itunesTypes';

interface FetchOptions {
  term?: string;
  genre?: string;
  authorHint?: string;
  // limit?: number;
  // country?: string;
  // lang?: string;
  allowExplicit?: boolean;
  allowFallback?: boolean;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractBookFields(item: any): AudiobookEntry {
  return {
    collectionId: item.collectionId,
    collectionName: item.collectionName,
    artistName: item.artistName,
    previewUrl: item.previewUrl,
    artworkUrl600: item.artworkUrl600 || item.artworkUrl100?.replace("100x100bb", "600x600bb"),
    primaryGenreName: item.primaryGenreName,
    releaseDate: item.releaseDate,
    description: item.description,
    _fallback: !!item._fallback,
  };
}

let cachedFallbackBooks: FallbackBooksByGenre | null = null;

async function getFallbackBook(genre?: string): Promise<FallbackBook & { _fallback: true }> {
  if (!cachedFallbackBooks) {
    const { default: books } = await import('../assets/fallbackBooks.json');
    cachedFallbackBooks = books;
  }

  let genreKey = genre && cachedFallbackBooks[genre] ? genre : null;

  if (!genreKey) {
    const genres = Object.keys(cachedFallbackBooks);
    genreKey = genres[Math.floor(Math.random() * genres.length)];
  }

  const booksForGenre = cachedFallbackBooks[genreKey];
  if (!booksForGenre || booksForGenre.length === 0) {
    throw new Error(`No fallback books available for enre "${genreKey}"`);
  }

  const book = booksForGenre[Math.floor(Math.random() * booksForGenre.length)];
  return {
    ...book,
    _fallback: true,
  };
}

export async function fetchRandom(options?: FetchOptions): Promise<AudiobookEntry | null> {
  let maxRetries: number;
  if (options?.allowFallback) {
    maxRetries = options?.genre ? 7 : 5;
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

      
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=audiobook&limit=${limit}&explicit=${explicitParam}`;
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
      const results = data.results.filter((item: any) =>
        item.previewUrl &&
        (!options?.genre || item.primaryGenreName === options.genre)
      )
      .map((item: any) => extractBookFields({
        ...item,
        artworkUrl600: item.artworkUrl100?.replace("100x100bb", "600x600bb")
      }));

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
    return extractBookFields(await getFallbackBook(options.genre));
  }

  return null;
}