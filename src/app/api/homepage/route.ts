import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series, chapters, chapterPages, genres, seriesGenres } from "@/lib/schema";
import { eq, desc, and, ne, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get featured series for hero carousel
    const featuredResults = await db
      .select({
        id: series.id,
        title: series.title,
        altTitle: series.altTitle,
        slug: series.slug,
        description: series.description,
        coverUrl: series.coverUrl,
        bannerUrl: series.bannerUrl,
        status: series.status,
        rating: series.rating,
        author: series.author,
        artist: series.artist,
        source: series.source,
        sortOrder: series.sortOrder,
      })
      .from(series)
      .where(and(eq(series.isFeatured, true), eq(series.isHidden, false)))
      .orderBy(series.sortOrder)
      .limit(10);

    // Get genres for featured series
    const featuredWithGenres = await Promise.all(
      featuredResults.map(async (s) => {
        const genreResults = await db
          .select({ name: genres.name })
          .from(seriesGenres)
          .innerJoin(genres, eq(seriesGenres.genreId, genres.id))
          .where(eq(seriesGenres.seriesId, s.id));
        return {
          ...s,
          genres: genreResults.map((g) => g.name),
        };
      })
    );

    // Get all visible series for popular section (sorted by sort order, then rating)
    const popularResults = await db
      .select({
        id: series.id,
        title: series.title,
        slug: series.slug,
        coverUrl: series.coverUrl,
        rating: series.rating,
        status: series.status,
        source: series.source,
        sortOrder: series.sortOrder,
      })
      .from(series)
      .where(eq(series.isHidden, false))
      .orderBy(series.sortOrder, desc(series.rating))
      .limit(50);

    // Get latest chapters (most recent across all series)
    const latestChaptersResults = await db
      .select({
        chapterId: chapters.id,
        chapterNumber: chapters.number,
        chapterTitle: chapters.title,
        chapterSlug: chapters.slug,
        chapterCreatedAt: chapters.createdAt,
        seriesId: series.id,
        seriesTitle: series.title,
        seriesSlug: series.slug,
        seriesCoverUrl: series.coverUrl,
        seriesStatus: series.status,
        seriesRating: series.rating,
        seriesSource: series.source,
      })
      .from(chapters)
      .innerJoin(series, eq(chapters.seriesId, series.id))
      .where(eq(series.isHidden, false))
      .orderBy(desc(chapters.createdAt))
      .limit(30);

    // Group chapters by series for latest releases
    const seriesMap = new Map<
      string,
      {
        title: string;
        slug: string;
        coverUrl: string | null;
        rating: number | null;
        status: string | null;
        source: string | null;
        chapters: {
          number: number;
          slug: string;
          time: string | null;
          isNew: boolean;
        }[];
      }
    >();

    for (const ch of latestChaptersResults) {
      if (!seriesMap.has(ch.seriesSlug)) {
        seriesMap.set(ch.seriesSlug, {
          title: ch.seriesTitle,
          slug: ch.seriesSlug,
          coverUrl: ch.seriesCoverUrl,
          rating: ch.seriesRating,
          status: ch.seriesStatus,
          source: ch.seriesSource,
          chapters: [],
        });
      }
      const seriesEntry = seriesMap.get(ch.seriesSlug)!;
      const createdAt = ch.chapterCreatedAt;
      const isNew = createdAt
        ? Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
        : false;
      seriesEntry.chapters.push({
        number: ch.chapterNumber,
        slug: ch.chapterSlug,
        time: createdAt,
        isNew,
      });
    }

    const latestReleases = Array.from(seriesMap.values()).slice(0, 10);

    return NextResponse.json({
      featured: featuredWithGenres,
      popular: popularResults.map((s) => ({
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl ?? "",
        rating: s.rating ?? 0,
        status: s.status ?? "ongoing",
        type: "Manhwa",
        source: s.source ?? "custom",
      })),
      latestReleases,
      latestNovels: [],
      mostPopular: popularResults.slice(0, 6).map((s) => ({
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl ?? "",
        type: "Manhwa",
        source: s.source ?? "custom",
      })),
    });
  } catch (error) {
    console.error("[api/homepage] Failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      featured: [],
      popular: [],
      latestReleases: [],
      latestNovels: [],
      mostPopular: [],
    });
  }
}
