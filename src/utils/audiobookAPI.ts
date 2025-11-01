import type { FetchOptions } from './itunesAPI';
import { fetchRandomBatch as fetchItunesRandomBatch, searchBooks as searchItunesBooks, fetchByItunesId } from './itunesAPI';
import { fetchRandomBatch as fetchAudimetaRandomBatch, searchBooks as searchAudimetaBooks, fetchByAsin } from './audimetaAPI';
import { mergeAudiobookDTOs, type AudiobookDTO } from '../dto/audiobookDTO';
import { addCacheEntry } from "../utils/cacheStorage";

type Source = 'audimeta' | 'itunes';
const FUZZY_THE_BACKLOG = true;
const NUM_CACHE_TO_FUZ = 1


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


export async function fetchRandom(options?: FetchOptions, source: Source = 'itunes'): Promise<AudiobookDTO | null> {
  const batch = source
    === 'itunes'
      ? await fetchItunesRandomBatch(options)
      : await fetchAudimetaRandomBatch(options);

  if (!batch || batch.length === 0) return null;

  const mainIndex = Math.floor(Math.random() * batch.length);
  let primaryBook = batch.splice(mainIndex, 1)[0];
  if (!primaryBook) return null;

  //helps the fuz
  async function fuzzyMerge(book: AudiobookDTO): Promise<AudiobookDTO> {
    try {
      const searchTerm = `${book.title} ${book.authors?.[0] ?? ''}`;
      const secondaryResultsRaw = source === 'itunes'
        ? await searchAudimetaBooks(searchTerm)
        : await searchItunesBooks(searchTerm);

      const secondaryResults = Array.isArray(secondaryResultsRaw) ? secondaryResultsRaw : [];
      const bestMatch = secondaryResults.find(b => compareBooksFuzzy(book, b));

      if (bestMatch && typeof bestMatch === 'object') {
        return source === 'itunes'
          ? mergeAudiobookDTOs(book, bestMatch)
          : mergeAudiobookDTOs(bestMatch, book);
      }
      return book;
    } catch {
      return book;
    }
  }

  //retrieve rich data for every book (shown and cached)
  if (FUZZY_THE_BACKLOG) {
    const allMerged = await Promise.allSettled(batch.map(fuzzyMerge));
    const mergedBooks = allMerged
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((b): b is AudiobookDTO => !!b);

    const enriched = mergedBooks.find(b => b.asin && b.itunesId);
    if (enriched) primaryBook = enriched;

    //return an enriched book immediately
    void (async () => {
      //cache the rest
      const extras = mergedBooks.filter(b => b !== primaryBook).slice(0, NUM_CACHE_TO_FUZ);
      for (const extra of extras) {
        try {
          await addCacheEntry(extra, extra.language ?? "unknown");
          console.log("Cache stored: " + extra.title);
        } catch (err) {
          console.warn("Cache add failed:", err);
        }
      }
    })();

    return primaryBook;
  }

  //retrieve rich data for shown book only, cache the rest
  primaryBook = await fuzzyMerge(primaryBook);
  void (async () => {
    const extras = batch.filter(b => b !== primaryBook).slice(0, NUM_CACHE_TO_FUZ);
    for (const extra of extras) {
      try {
        await addCacheEntry(extra, extra.language ?? "unknown");
      } catch (err) {
        console.warn("Cache add failed:", err);
      }
    }
  })();

  return primaryBook;
}

export async function fetchBookByIds(params: { itunesId?: string | null; asin?: string | null }): Promise<AudiobookDTO | null> {
  const { itunesId, asin } = params;

  if (!itunesId && !asin) {
    throw new Error("fetchBookByIds: must provide at least one of itunesId or asin");
  }

  const [itunesBook, audimetaBook] = await Promise.all([
    itunesId ? fetchByItunesId(itunesId) : Promise.resolve(null),
    asin ? fetchByAsin(asin) : Promise.resolve(null),
  ]);

  if (itunesBook && audimetaBook) {
    return mergeAudiobookDTOs(itunesBook, audimetaBook);
  }

  return itunesBook ?? audimetaBook ?? null;
}
