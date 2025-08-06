import type { FetchOptions } from './itunesAPI';
import { fetchRandom as fetchItunesRandom, searchBooks as searchItunesBooks } from './itunesAPI';
import { fetchRandom as fetchAudimetaRandom, searchBooks as searchAudimetaBooks } from './audimetaAPI';
import { mergeAudiobookDTOs, type AudiobookDTO } from '../dto/audiobookDTO';

type Source = 'audimeta' | 'itunes';


function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
  const primaryBook = source === 'itunes'
    ? await fetchItunesRandom(options)
    : await fetchAudimetaRandom(options);

  if (!primaryBook) return null;

  const searchTerm = `${primaryBook.title} ${primaryBook.authors?.[0] ?? ''}`;
  const secondaryResults = source === 'itunes'
    ? await searchAudimetaBooks(searchTerm)
    : await searchItunesBooks(searchTerm);

  const bestMatch = secondaryResults.find(b => compareBooksFuzzy(primaryBook, b));

  if (!bestMatch || typeof bestMatch !== 'object') return primaryBook;

  return bestMatch
    ? (source === 'itunes' ? mergeAudiobookDTOs(primaryBook, bestMatch) : mergeAudiobookDTOs(bestMatch, primaryBook))
    : primaryBook;
}