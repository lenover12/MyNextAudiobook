export interface AudiobookEntry {
  collectionId: number;
  collectionName: string; //book title
  collectionCensoredName?: string;
  artistName: string;     //author of the book (not the narrator)
  previewUrl: string;     //audio sample
  artworkUrl600: string;  //audiobook cover image
  primaryGenreName: string;
  releaseDate?: string;
  description?: string;
  _fallback?: boolean;    //fallback flag
}

export interface FallbackBook {
  collectionId: number;
  collectionName: string;
  collectionCensoredName?: string;
  artistName: string;
  previewUrl: string;
  artworkUrl600: string;
  primaryGenreName: string;
  releaseDate?: string;
  description?: string;
}

export interface FallbackBooksByGenre {
  [genre: string]: FallbackBook[];
}