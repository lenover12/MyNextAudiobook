let cachedWords: string[] | null = null;

export async function getWords(): Promise<string[]> {
  if (!cachedWords) {
    const { default: words } = await import('../assets/searchableWords.json');
    cachedWords = words;
  }
  return cachedWords;
}
