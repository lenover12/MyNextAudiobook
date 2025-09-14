import { openDB } from "idb";
import type { BookDBEntry } from "../dto/bookDB";

const DB_NAME = "tokbooka-favourites";
const STORE_NAME = "books";
//TODO: add cap limit for favourites

async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("timestamp", "timestamp");
            }
        },
    });
}

async function resizeImageToBase64(blob: Blob, size = 100): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas context failed");

            ctx.drawImage(img, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };

        img.onerror = (e) => reject(e);
        img.src = url;
    });
}

export async function addFavouritesEntry(
    entry: Omit<BookDBEntry, "timestamp" | "thumbnailData">
) {
    const db = await getDB();

    const id = (entry.asin ?? entry.itunesId)?.toString();
    if (!id) throw new Error("BookDBEntry must have either asin or itunesId");

    const existing = await db.get(STORE_NAME, id);
    if (existing) {
        return;
    }

    let thumbnailData: string | null = null;

    try {
        if (entry.itunesImageUrl) {
            const smallUrl = entry.itunesImageUrl.replace(
                /\/\d+x\d+bb\./,
                "/100x100bb."
            );

            try {
                const res = await fetch(smallUrl);
                if (!res.ok) throw new Error("Failed to fetch 100x100");
                const blob = await res.blob();
                thumbnailData = await blobToBase64(blob);
            } catch {
                const res = await fetch(entry.itunesImageUrl);
                if (!res.ok) throw new Error("Failed to fetch full-size");
                const blob = await res.blob();
                thumbnailData = await resizeImageToBase64(blob, 100);
            }
        }
    } catch (err) {
        console.warn("Failed to create thumbnail:", err);
    }

    await db.put(STORE_NAME, {
        ...entry,
        id,
        thumbnailData,
        timestamp: Date.now(),
    });
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


export async function getFavourites(limit = 50): Promise<BookDBEntry[]> { //TODO: update limit
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.store.index("timestamp");

    const results: BookDBEntry[] = [];
    let cursor = await index.openCursor(null, "prev");

    while (cursor && results.length < limit) {
        results.push(cursor.value as BookDBEntry);
        cursor = await cursor.continue();
    }

    return results;
}

export async function removeFavouritesEntry(id: string) {
    const db = await getDB();
    await db.delete(STORE_NAME, id.toString());
}

export async function clearFavourites() {
    const db = await getDB();
    await db.clear(STORE_NAME);
}
