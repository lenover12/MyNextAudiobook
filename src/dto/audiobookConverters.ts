import type { AudiobookDTO } from "./audiobookDTO";
import type { BookDBEntry } from "./bookDB";

//convert BookDBEntry into AudiobookDTO
export function dbEntryToAudiobookDTO(entry: BookDBEntry): AudiobookDTO {
  return {
    asin: entry.asin ?? null,
    isbn: null,
    itunesId: entry.itunesId,
    title: entry.title,
    subtitle: null,
    censored_title: entry.title,
    authors: entry.authors ?? [],
    narrators: [],
    publisher: null,
    audiblePageUrl: entry.audiblePageUrl,
    itunesPageUrl: null,
    audioPreviewUrl: entry.audioPreviewUrl,
    itunesImageUrl: entry.itunesImageUrl ?? entry.thumbnailData ?? null,
    audibleImageUrl: null,
    description: null,
    summary: null,
    genre: entry.genre ?? null,
    genres: entry.genre ? [entry.genre] : [],
    seriesList: [],
    releaseDate: null,
    rating: null,
    lengthMinutes: null,
    durationMinutes: null,
    bookFormat: null,
    language: null,
    explicit: null,
    region: null,
    regions: [],
    _fallback: false,
  };
}

//convert AudiobookDTO into BookDBEntry
export function audiobookDTOToDbEntry(dto: AudiobookDTO): BookDBEntry {
  return {
    asin: dto.asin ?? null,
    itunesId: dto.itunesId,
    title: dto.title,
    authors: dto.authors ?? [],
    audiblePageUrl: dto.audiblePageUrl,
    audioPreviewUrl: dto.audioPreviewUrl,
    itunesImageUrl: dto.itunesImageUrl ?? null,
    genre: dto.genre ?? null,
    timestamp: Date.now(),
  };
}
