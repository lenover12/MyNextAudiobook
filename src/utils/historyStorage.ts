import { openDB } from "idb";
import type { BookHistoryEntry } from "../dto/bookHistory";

const DB_NAME = "tokbooka-history";
const STORE_NAME = "books";
//TODO: add cap limit for history

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

export async function addHistoryEntry( //TODO: remove after cap level
    entry: Omit<BookHistoryEntry, "timestamp" | "thumbnailData">
) {
    const db = await getDB();

    const id = entry.asin ?? entry.itunesId;
    if (!id) throw new Error("BookHistoryEntry must have either asin or itunesId");

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


export async function getHistory(limit = 50): Promise<BookHistoryEntry[]> { //TODO: update limit
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.store.index("timestamp");

    const results: BookHistoryEntry[] = [];
    let cursor = await index.openCursor(null, "prev");

    while (cursor && results.length < limit) {
        results.push(cursor.value as BookHistoryEntry);
        cursor = await cursor.continue();
    }

    return results;
}

export async function removeHistoryEntry(asinOrItunesId: string | number) {
    const db = await getDB();
    await db.delete(STORE_NAME, asinOrItunesId);
}

export async function clearHistory() {
    const db = await getDB();
    await db.clear(STORE_NAME);
}
