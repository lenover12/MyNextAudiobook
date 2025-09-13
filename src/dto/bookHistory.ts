export type BookHistoryEntry = {
  asin: string | null;
  itunesId: number | null;
  title: string;
  authors: string[];
  audiblePageUrl: string | null;
  audioPreviewUrl: string | null;
  itunesImageUrl: string | null;
  genre: string | null;
  thumbnailData?: string | null;
  timestamp: number;
};
