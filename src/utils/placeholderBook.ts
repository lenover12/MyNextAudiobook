import type { AudiobookDTO } from "../dto/audiobookDTO";
import { getRandomLoadingImage } from "./loadingImages";

export const PLACEHOLDER_BOOK: AudiobookDTO = {
    __isPlaceholder: true,

    itunesId: -1,
    asin: "-1",

    title: "Loading…",
    authors: [],
    genre: null,

    audiblePageUrl: null,
    audioPreviewUrl: null,
    itunesImageUrl: getRandomLoadingImage(),
    
    __fromCache: false,

    isbn: null,
    subtitle: null,
    censored_title: null,
    narrators: null,
    publisher: null,
    itunesPageUrl: null,
    audibleImageUrl: null,
    description: null,
    summary: null,
    genres: null,
    seriesList: null,
    releaseDate: null,
    rating: null,
    lengthMinutes: null,
    durationMinutes: null,
    bookFormat: null,
    language: null,
    explicit: null,
    region: null,
    regions: null,
    _fallback: false
};
