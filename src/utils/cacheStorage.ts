import { openDB } from "idb";
import type { BookDBEntry } from "../dto/bookDB";
import type { AudiobookDTO } from "../dto/audiobookDTO";
import { loadOptions } from "./optionsStorage";

const DB_NAME = "mynextaudiobook-cache";
const STORE_NAME = "books";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
        store.createIndex("used", "used");
        store.createIndex("genre", "genre");
      }
    },
  });
}

export async function seedFallbackBooksIfEmpty() {
  const db = await getDB();
  const count = await db.count(STORE_NAME);
  if (count > 0) return;

  const { default: fallback } = await import("../assets/fallbackBooks.json");

  const entries: (BookDBEntry & {
    used: boolean;
    languages: Record<string, { asin?: string | null; itunesId?: number | null }>;
  })[] = Object.values(fallback)
    .flat()
    .map((b: any) => ({
      id: (b.asin ?? b.itunesId)?.toString() ?? crypto.randomUUID(),
      asin: b.asin ?? null,
      itunesId: b.itunesId ?? null,
      title: b.title ?? "Untitled",
      authors: b.authors ?? [],
      audiblePageUrl: b.audiblePageUrl ?? null,
      audioPreviewUrl: b.audioPreviewUrl ?? null,
      itunesImageUrl: b.itunesImageUrl ?? null,
      genre: b.genre ?? null,
      timestamp: Date.now(),
      used: false,
      languages: {
        en: {
          asin: b.asin ?? null,
          itunesId: b.itunesId ?? null,
        },
      },
      lastUsedAt: null,
    }));

  for (const entry of entries) {
    await db.put(STORE_NAME, entry);
  }
  console.log(`[Cache] Seeded ${entries.length} fallback books`);
}

export async function addCacheEntry(book: AudiobookDTO, lang: string) {
  if (!book) return;
  const db = await getDB();

  const id = (book.asin ?? book.itunesId)?.toString();
  if (!id) return;

  const existing = await db.get(STORE_NAME, id);
  if (existing) return;

  const entry: BookDBEntry & {
    used: boolean;
    languages: Record<string, { asin?: string | null; itunesId?: number | null }>;
  } = {
    id,
    asin: book.asin ?? null,
    itunesId: book.itunesId ?? null,
    title: book.title,
    authors: book.authors ?? [],
    audiblePageUrl: book.audiblePageUrl ?? null,
    audioPreviewUrl: book.audioPreviewUrl ?? null,
    itunesImageUrl: book.itunesImageUrl ?? null,
    genre: book.genre ?? null,
    timestamp: Date.now(),
    used: false,
    languages: {
      [lang]: {
        asin: book.asin ?? null,
        itunesId: book.itunesId ?? null,
      },
    },
    lastUsedAt: null,
  };

  await db.put(STORE_NAME, entry);
}

export async function popCachedBook(
  lang: string,
  used: boolean = false,
  currentIds: Set<string> = new Set()
) {
  const MIN_USED_BEFORE_REUSE = 40;
  const { enabledGenres } = loadOptions();
  
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.store;

  const all = await store.getAll();

  //prevent duplicates and skip any book already in sliding window
  function isDuplicate(b: any) {
    const id = (b.asin ?? b.itunesId)?.toString();
    if (!id) return false;
    return currentIds.has(id);
  }

  const totalUsed = all.filter(b => b.used === true).length;
  const totalUnused = all.filter(b => b.used === false).length;

  console.log(
    `%c[Cache] popCachedBook request used=${used} → usedCount=${totalUsed}, unusedCount=${totalUnused}`,
    "color:#e67e22;font-weight:bold"
  );

  const allowUsed = used && totalUsed >= MIN_USED_BEFORE_REUSE;

  function finalize(selected: any) {
    if (!allowUsed) {
      selected.used = true;
      selected.lastUsedAt = Date.now();
      store.put(selected);
    }
    if (allowUsed) {
      selected.lastUsedAt = Date.now();
      store.put(selected);
    }
    const langIds = selected.languages?.[lang];
    return {
      ...selected,
      asin: langIds?.asin ?? selected.asin,
      itunesId: langIds?.itunesId ?? selected.itunesId,
      __fromCache: true
    };
  }

  const pick = (list: any[]) => {
    if (list.length === 0) return null;
    
    //filter duplicates by asin/itunesId
    const filtered = list.filter(b => !isDuplicate(b));
    if (filtered.length === 0) return null;

    //pick oldest used book
    if (allowUsed) {
      const sorted = [...filtered].sort((a, b) => {
        const ta = a.lastUsedAt ?? 0;
        const tb = b.lastUsedAt ?? 0;
        return ta - tb;
      });
      return sorted[0];
    }
    const preferred = filtered.find(b => b.languages?.[lang]);
    return preferred ?? filtered[Math.floor(Math.random() * filtered.length)];
  };

  //cached books by language and genre list choice with fallbacks
  //genre + lang
  let candidates = all.filter(b =>
    (allowUsed ? b.used : !b.used) &&
    enabledGenres.includes(b.genre) &&
    b.languages?.[lang]
  );
  let selected = pick(candidates);
  if (selected) return finalize(selected);
  //genre only
  candidates = all.filter(b =>
    (allowUsed ? b.used : !b.used) &&
    enabledGenres.includes(b.genre)
  );
  selected = pick(candidates);
  if (selected) return finalize(selected);
  //lang only
  candidates = all.filter(b =>
    (allowUsed ? b.used : !b.used) &&
    b.languages?.[lang]
  );
  selected = pick(candidates);
  if (selected) return finalize(selected);
  //any match (last fallback)
  candidates = all.filter(b =>
    (allowUsed ? b.used : !b.used)
  );
  selected = pick(candidates);
  if (selected) return finalize(selected);

  return null;
}


export async function clearCache() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getCacheCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}
