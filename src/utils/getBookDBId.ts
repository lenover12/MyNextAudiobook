import type { BookDBEntry } from "../dto/bookDB";

export function getBookDBId(book: BookDBEntry): string | null {
  if (!book) return null;
  return (book.asin ?? book.itunesId)?.toString() ?? null;
}