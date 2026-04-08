import type { FetchOptions } from './itunesAPI';
import { fetchRandomBatch as fetchItunesRandomBatch, searchBooks as searchItunesBooks, fetchByItunesId } from './itunesAPI';
import { fetchRandomBatch as fetchAudibleRandomBatch, searchBooks as searchAudibleBooks, fetchByAsin, shouldSkipAudibleRequest } from './audibleAPI';
import { mergeAudiobookDTOs, type AudiobookDTO } from '../dto/audiobookDTO';
import { addCacheEntry } from "../utils/cacheStorage";

type Source = 'audible' | 'itunes';
const FUZZY_THE_BACKLOG = true;
const NUM_CACHE_TO_FUZ = 1
const ITUNES_FIRST = true;
let audibleWaitoutUntil: number = 0;
const WAITOUT_AUDIBLE = 1000 * 60 * 1; //1 minutes

function normalize(str: string): string {
  return str
    ?.trim()
    .toLowerCase()
    .normalize("NFKD")  //proper unicode normalization
    .replace(/[\p{Diacritic}]/gu, '') //strip diacritics but keep characters
    .replace(/[^\p{L}\p{N}]+/gu, ''); //keep letters/numbers in ANY language
}


export function compareBooksFuzzy(a: AudiobookDTO, b: AudiobookDTO): boolean {
  const titleA = normalize(a.title);
  const titleB = normalize(b.title);
  const authorA = normalize(a.authors?.[0] ?? '');
  const authorB = normalize(b.authors?.[0] ?? '');

  return titleA.includes(titleB) || titleB.includes(titleA)
    || (titleA === titleB && authorA === authorB);
}

//search Audible for a match and merge with the given iTunes book.
//returns null if no match found or Audible is unavailable.
export async function enrichBookWithAudible(book: AudiobookDTO): Promise<AudiobookDTO | null> {
  if (shouldSkipAudibleRequest()) return null;
  try {
    const searchTerm = `${book.title} ${book.authors?.[0] ?? ''}`;
    const results = await searchAudibleBooks(searchTerm);
    if (!Array.isArray(results) || results.length === 0) return null;
    const bestMatch = results.find(b => compareBooksFuzzy(book, b));
    if (!bestMatch) return null;
    return mergeAudiobookDTOs(book, bestMatch);
  } catch {
    return null;
  }
}

export async function fetchRandom(options?: FetchOptions, source: Source = (ITUNES_FIRST ? 'itunes' : 'audible')): Promise<AudiobookDTO | null> {
  const batch = source === 'itunes'
    ? await fetchItunesRandomBatch(options)
    : await fetchAudibleRandomBatch(options);

  //if audible marked down/rate-limited, force itunes
  if (!ITUNES_FIRST && source === 'audible') {
    if (Date.now() < audibleWaitoutUntil || shouldSkipAudibleRequest()) {
      source = 'itunes';
    }
  }

  if ((!batch || batch.length === 0) && source === 'audible') {
    console.warn("[AudiobookAPI] Audible unavailable, falling back to iTunes.");
    audibleWaitoutUntil = Date.now() + WAITOUT_AUDIBLE;
    return await fetchRandom(options, 'itunes');
  }

  if (!batch || batch.length === 0) return null;

  const mainIndex = Math.floor(Math.random() * batch.length);
  const primaryBook = batch.splice(mainIndex, 1)[0];
  if (!primaryBook) return null;

  if (source === 'itunes') {
    //return iTunes book immediately — caller handles Audible enrichment in background
    if (FUZZY_THE_BACKLOG) {
      const extras = batch.slice(0, NUM_CACHE_TO_FUZ);
      void (async () => {
        for (const extra of extras) {
          try {
            await addCacheEntry(extra, extra.language ?? "unknown");
            console.log("Cache stored: " + extra.title);
          } catch (err) {
            console.warn("Cache add failed:", err);
          }
        }
      })();
    }
    return primaryBook;
  }

  //source === 'audible': need to fuzzy-merge with iTunes before returning
  async function fuzzyMergeWithItunes(book: AudiobookDTO): Promise<AudiobookDTO | null> {
    try {
      const searchTerm = `${book.title} ${book.authors?.[0] ?? ''}`;
      const results = await searchItunesBooks(searchTerm);
      const arr = Array.isArray(results) ? results : [];
      const bestMatch = arr.find(b => compareBooksFuzzy(book, b));
      if (bestMatch) return mergeAudiobookDTOs(bestMatch, book);
      return null;
    } catch {
      return null;
    }
  }

  if (FUZZY_THE_BACKLOG) {
    const subset = [primaryBook, ...batch.slice(0, NUM_CACHE_TO_FUZ)];
    const allMerged = await Promise.allSettled(subset.map(fuzzyMergeWithItunes));
    const mergedBooks = allMerged
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((b): b is AudiobookDTO => !!b);

    if (mergedBooks.length === 0) return null;

    const enriched = mergedBooks.find(b => b.asin && b.itunesId);
    const result = enriched ?? mergedBooks[0] ?? primaryBook;

    void (async () => {
      const extras = mergedBooks.filter(b => b !== result).slice(0, NUM_CACHE_TO_FUZ);
      for (const extra of extras) {
        try {
          await addCacheEntry(extra, extra.language ?? "unknown");
          console.log("Cache stored: " + extra.title);
        } catch (err) {
          console.warn("Cache add failed:", err);
        }
      }
    })();

    return result;
  }

  return await fuzzyMergeWithItunes(primaryBook) ?? null;
}

export async function fetchBookByIds(params: { itunesId?: string | null; asin?: string | null }): Promise<AudiobookDTO | null> {
  const { itunesId, asin } = params;

  if (!itunesId && !asin) return null;
  if (itunesId === "-1") return null; //could cause issues if changing reliance on itunes later

  if (!itunesId && !asin) {
    throw new Error("fetchBookByIds: must provide at least one of itunesId or asin");
  }

  const [itunesBook, audibleBook] = await Promise.all([
    itunesId ? fetchByItunesId(itunesId) : Promise.resolve(null),
    asin ? fetchByAsin(asin) : Promise.resolve(null),
  ]);

  if (itunesBook && audibleBook) {
    return mergeAudiobookDTOs(itunesBook, audibleBook);
  }

  return itunesBook ?? audibleBook ?? null;
}
