export interface AudiobookDTO {
  asin: string | null;
  isbn: string | null;
  itunesId: number | null;
  
  title: string;
  subtitle: string | null;
  censored_title: string | null;
  
  authors: string[] | null;
  narrators: string[] | null;
  publisher: string | null;
  
  audiblePageUrl: string | null;
  itunesPageUrl: string | null;
  audioPreviewUrl: string | null;
  itunesImageUrl: string | null;
  audibleImageUrl: string | null;
  
  description: string | null;
  summary: string | null;
  genre: string | null;
  genres: string[] | null;
  seriesList: { name: string; position: string | null }[] | null;
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
  __fromCache?: boolean; //from chache storage
  __isPlaceholder?: boolean; //loading image on first page visit
}

export function mergeAudiobookDTOs(a: AudiobookDTO, b: AudiobookDTO): AudiobookDTO {
  if (a.__isPlaceholder && !b.__isPlaceholder) return { ...b, __isPlaceholder: false };
  if (b.__isPlaceholder && !a.__isPlaceholder) return { ...a, __isPlaceholder: false };
  
  const mergeStringArray = (
    arr1: string[] = [],
    arr2: string[] = []
  ): string[] =>
    [...new Set([...(arr1 ?? []), ...(arr2 ?? [])])];

  const mergeSeriesList = (
    list1: { name: string; position: string | null }[] = [],
    list2: { name: string; position: string | null }[] = []
  ): { name: string; position: string | null }[] => {
    const merged: { [name: string]: string | null } = {};

    for (const s of (list1 ?? [])) merged[s.name] = s.position;
    for (const s of (list2 ?? [])) {
      if (!(s.name in merged)) merged[s.name] = s.position;
    }

    return Object.entries(merged).map(([name, position]) => ({ name, position }));
  };

  return {
    asin: a.asin ?? b.asin,
    isbn: a.isbn ?? b.isbn,
    itunesId: a.itunesId ?? b.itunesId,

    title: a.title || b.title,
    subtitle: a.subtitle ?? b.subtitle,
    censored_title: a.censored_title ?? b.censored_title,

    authors: mergeStringArray(a.authors ?? [], b.authors ?? []),
    narrators: mergeStringArray(a.narrators ?? [], b.narrators ?? []),
    publisher: a.publisher ?? b.publisher,

    audiblePageUrl: a.audiblePageUrl ?? b.audiblePageUrl,
    itunesPageUrl: a.itunesPageUrl ?? b.itunesPageUrl,
    audioPreviewUrl: a.audioPreviewUrl ?? b.audioPreviewUrl,
    itunesImageUrl: a.itunesImageUrl ?? b.itunesImageUrl,
    audibleImageUrl: a.audibleImageUrl ?? b.audibleImageUrl,

    description: a.description ?? b.description,
    summary: a.summary ?? b.summary,

    genre: a.genre ?? b.genre,
    genres: mergeStringArray(a.genres ?? [], b.genres ?? []),

    seriesList: mergeSeriesList(a.seriesList ?? [], b.seriesList ?? []),

    releaseDate: a.releaseDate ?? b.releaseDate,
    rating: a.rating ?? b.rating,

    lengthMinutes: a.lengthMinutes ?? b.lengthMinutes,
    durationMinutes: a.durationMinutes ?? b.durationMinutes,
    bookFormat: a.bookFormat ?? b.bookFormat,
    language: a.language ?? b.language,
    explicit: a.explicit ?? b.explicit,
    region: a.region ?? b.region,
    regions: mergeStringArray(a.regions ?? [], b.regions ?? []),

    _fallback: a._fallback && b._fallback,
    __fromCache: a.__fromCache || b.__fromCache,
    __isPlaceholder: a.__isPlaceholder && b.__isPlaceholder,
  };
}
