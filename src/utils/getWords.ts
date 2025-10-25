import { loadOptions } from "../utils/optionsStorage";

const cachedWordLists: Record<string, string[] | null> = {};

export async function getWords(): Promise<string[]> {
  const { languageCode } = loadOptions(); 
  const lang = languageCode ?? "en";

  if (cachedWordLists[lang]) {
    return cachedWordLists[lang]!;
  }

  try {
    /* @vite-ignore */
    const fileName = `../assets/wordlist/searchableWords_${lang}.json`;
    const { default: words } = await import(fileName);
    cachedWordLists[lang] = words;
    return words;
  } catch (err) {
    console.warn(`No word list for lang=${lang}, falling back to English`);
    const { default: words } = await import("../assets/wordlist/searchableWords_en.json");
    cachedWordLists[lang] = words;
    return words;
  }
}
