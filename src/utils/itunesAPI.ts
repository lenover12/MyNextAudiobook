import { getSearchTerm } from './getSearchTerm';
import { pruneString } from './pruneString';

interface FetchOptions {
  term?: string;
  genre?: string;
  authorHint?: string;
  // limit?: number;
  // country?: string;
  // lang?: string;
  allowExplicit?: boolean;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface FallbackBook {
  collectionId: number;
  collectionName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl600: string;
  primaryGenreName: string;
}

interface FallbackBooksByGenre {
  [genre: string]: FallbackBook[];
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

export async function fetchRandom(options?: FetchOptions): Promise<any | null> {
  const maxRetries = options?.genre ? 7 : 5;
  // const maxRetries = options?.genre ? 1 : 1;
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
          break;
        }
        await delay(500);
        continue;
      }

      const data = await response.json();
      const results = data.results.filter((item: any) =>
        item.previewUrl &&
        (!options?.genre || item.primaryGenreName === options.genre)
      )
      .map((item: any) => ({
        ...item,
        artworkUrl600: item.artworkUrl100?.replace("100x100bb", "600x600bb")
      }));

      if (results.length > 0) {
        return results[Math.floor(Math.random() * results.length)];
      }
    } catch (e) {
      console.error(`Error on attempt ${attempt}:`, e);
      await delay(500);
    }
  }
  return await getFallbackBook(options?.genre);
}