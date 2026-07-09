export interface SeriesData {
  id?: number;
  title: string;
  altTitle?: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  status?: string;
  rating?: number;
  year?: number;
  author?: string;
  artist?: string;
  genres?: string[];
}

export interface ChapterData {
  id?: number;
  seriesId: number;
  number: number;
  title?: string;
  slug: string;
  pageCount?: number;
  pages?: string[];
}

export interface ScrapedSeries {
  title: string;
  altTitle?: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  status?: string;
  rating?: number;
  year?: number;
  author?: string;
  artist?: string;
  genres?: string[];
}

export interface ScrapedChapter {
  number: number;
  title?: string;
  pages: string[];
}