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

export async function fetchRandom(options?: FetchOptions): Promise<any | null> {
  const maxRetries = options?.genre ? 7 : 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const PRUNE_RETRY_THRESHOLD = 3;

      let term = await getSearchTerm(options);
      if (attempt >= PRUNE_RETRY_THRESHOLD) {
        term = pruneString(term);
      }
      
      const offset = Math.floor(Math.random() * 200);
      const limit = Math.min(25, 200 - offset);
      const explicitParam = options?.allowExplicit ? 'yes' : 'no';

      console.log(term);
      
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
      );

      if (results.length > 0) {
        return results[Math.floor(Math.random() * results.length)];
      }
    } catch (e) {
      await delay(500);
    }
  }
  return null;
}