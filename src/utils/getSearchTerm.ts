import { getWords } from './getWords';

export async function getSearchTerm(options?: {
  term?: string;
  authorHint?: string;
}): Promise<string> {
  if (options?.term || options?.authorHint) {
    return options.term || options.authorHint  || '';
  }

  const words = await getWords();
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}