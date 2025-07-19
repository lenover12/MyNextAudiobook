export interface AudiobookDTO {
  asin: string | null;
  isbn: string | null;
  itunesId: number | null;
  
  title: string;
  subtitle: string | null;
  censored_title: string | null;
  
  authors: string[];
  narrators: string[];
  publisher: string | null;
  
  audiblePageUrl: string | null;
  itunesPageUrl: string | null;
  audioPreviewUrl: string | null;
  itunesImageUrl: string | null;
  audibleImageUrl: string | null;
  
  description: string | null;
  summary: string | null;
  genre: string | null;
  series: string | null;
  seriesPosition: string | null;
  releaseDate: string | null;
  rating: string | null;
  
  lengthMinutes: string | null;
  durationMinutes: number | null;
  bookFormat: string | null;
  language: string | null;
  explicit: string | null;
  region: string | null;
  regions: string[] | null;
  _fallback: boolean;
}

export function mergeAudiobookDTOs(a: AudiobookDTO, b: AudiobookDTO): AudiobookDTO {
  const mergeStringArray = (arr1: string[] = [], arr2: string[] = []) =>
    [...new Set([...arr1, ...arr2])];

  return {
    asin: a.asin ?? b.asin,
    isbn: a.isbn ?? b.isbn,
    itunesId: a.itunesId ?? b.itunesId,

    title: a.title || b.title,
    subtitle: a.subtitle ?? b.subtitle,
    censored_title: a.censored_title ?? b.censored_title,

    authors: mergeStringArray(a.authors, b.authors),
    narrators: mergeStringArray(a.narrators, b.narrators),
    publisher: a.publisher ?? b.publisher,

    audiblePageUrl: a.audiblePageUrl ?? b.audiblePageUrl,
    itunesPageUrl: a.itunesPageUrl ?? b.itunesPageUrl,
    audioPreviewUrl: a.audioPreviewUrl ?? b.audioPreviewUrl,
    itunesImageUrl: a.itunesImageUrl ?? b.itunesImageUrl,
    audibleImageUrl: a.audibleImageUrl ?? b.audibleImageUrl,

    description: a.description ?? b.description,
    summary: a.summary ?? b.summary,
    genre: a.genre ?? b.genre,
    series: a.series ?? b.series,
    seriesPosition: a.seriesPosition ?? b.seriesPosition,
    releaseDate: a.releaseDate ?? b.releaseDate,
    rating: a.rating ?? b.rating,

    lengthMinutes: a.lengthMinutes ?? b.lengthMinutes,
    durationMinutes: a.durationMinutes ?? b.durationMinutes,
    bookFormat: a.bookFormat ?? b.bookFormat,
    language: a.language ?? b.language,
    explicit: a.explicit ?? b.explicit,
    region: a.region ?? b.region,
    regions: a.regions ?? b.regions,

    _fallback: a._fallback && b._fallback,
  };
}
