import { getSearchTerm } from '../utils/getSearchTerm';

interface FetchOptions {
  term?: string;
  genre?: string;
  authorHint?: string;
  // limit?: number;
  // country?: string;
  // lang?: string;
  allowExplicit?: boolean;
}

export async function fetchRandom(options?: FetchOptions): Promise<any | null> {
  const term = await getSearchTerm(options);
  console.log(term);

  const offset = Math.floor(Math.random() * 200);
  const limit = Math.min(25, 200 - offset);
  const url = `https://itunes.apple.com/search?term=${term}&media=audiobook&limit=${limit}`
  const response = await fetch(url);
  const data = await response.json();
  const results = data.results.filter((item: any) => item.previewUrl);
  if (results.length === 0) return null;
  return results[Math.floor(Math.random() * results.length)];
}