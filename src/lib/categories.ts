import { db } from "./db";
import { series, genres, seriesGenres, chapters } from "./schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface CategoryInfo {
  slug: string;
  name: string;
  count: number;
  sources: string[];
  sampleCovers: string[];
}

export async function getAllCategories(): Promise<CategoryInfo[]> {
  try {
    // Get all genres with their series counts
    const genreResults = await db
      .select({
        id: genres.id,
        name: genres.name,
        slug: genres.slug,
        count: sql<number>`count(distinct ${seriesGenres.seriesId})`.as("count"),
      })
      .from(genres)
      .leftJoin(seriesGenres, eq(genres.id, seriesGenres.genreId))
      .groupBy(genres.id, genres.name, genres.slug)
      .orderBy(genres.name);

    // Get sample covers for each genre
    const result: CategoryInfo[] = [];
    for (const genre of genreResults) {
      const sampleResults = await db
        .select({ coverUrl: series.coverUrl, source: series.source })
        .from(seriesGenres)
        .innerJoin(series, eq(seriesGenres.seriesId, series.id))
        .where(eq(seriesGenres.genreId, genre.id))
        .orderBy(desc(series.rating))
        .limit(4);

      const sources = [...new Set(sampleResults.map((s) => s.source ?? "custom"))];
      const sampleCovers = sampleResults
        .map((s) => s.coverUrl ?? "")
        .filter((url) => url.length > 0);

      result.push({
        slug: genre.slug,
        name: genre.name,
        count: genre.count,
        sources,
        sampleCovers,
      });
    }

    return result;
  } catch (error) {
    console.error("[categories] Failed to fetch categories:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function getCategoryGenreSeries(
  genreSlug: string,
  source?: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ series: { title: string; slug: string; coverUrl: string; rating: number; source: string }[]; totalPages: number; currentPage: number }> {
  try {
    // Find the genre
    const genreResult = await db
      .select()
      .from(genres)
      .where(eq(genres.slug, genreSlug))
      .limit(1);

    if (genreResult.length === 0) {
      return { series: [], totalPages: 0, currentPage: page };
    }

    const genreId = genreResult[0].id;

    // Get series for this genre
    let query = db
      .select({
        title: series.title,
        slug: series.slug,
        coverUrl: series.coverUrl,
        rating: series.rating,
        source: series.source,
      })
      .from(seriesGenres)
      .innerJoin(series, eq(seriesGenres.seriesId, series.id))
      .where(
        source
          ? and(eq(seriesGenres.genreId, genreId), eq(series.source, source))
          : eq(seriesGenres.genreId, genreId)
      )
      .orderBy(desc(series.rating));

    const allResults = await query;
    const total = allResults.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const paged = allResults.slice(start, start + perPage);

    return {
      series: paged.map((s) => ({
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl ?? "",
        rating: s.rating ?? 0,
        source: s.source ?? "custom",
      })),
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("[categories] Failed to fetch genre series:", error instanceof Error ? error.message : String(error));
    return { series: [], totalPages: 0, currentPage: page };
  }
}
