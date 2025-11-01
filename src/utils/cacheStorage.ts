import { openDB } from "idb";
import type { BookDBEntry } from "../dto/bookDB";
import type { AudiobookDTO } from "../dto/audiobookDTO";

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
  };

  await db.put(STORE_NAME, entry);
}

export async function popCachedBook(lang: string, genre?: string) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.store;

  const all = await store.getAll();
  const unused = all.filter((b: any) => !b.used && (!genre || b.genre === genre));
  if (unused.length === 0) return null;

  const preferred = unused.find((b: any) => b.languages?.[lang]);
  const selected = preferred ?? unused[Math.floor(Math.random() * unused.length)];

  selected.used = true;
  await store.put(selected);

  const langIds = selected.languages?.[lang];
  return {
    ...selected,
    asin: langIds?.asin ?? selected.asin,
    itunesId: langIds?.itunesId ?? selected.itunesId,
  };
}

export async function clearCache() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function getCacheCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}
