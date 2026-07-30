import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series, chapters, genres, seriesGenres } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Provide 'slug' query parameter" },
        { status: 400 }
      );
    }

    // Read series from database
    const dbSeries = await db
      .select()
      .from(series)
      .where(eq(series.slug, slug))
      .limit(1);

    if (dbSeries.length === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const s = dbSeries[0];

    // Get genres
    const genreResults = await db
      .select({ name: genres.name })
      .from(seriesGenres)
      .innerJoin(genres, eq(seriesGenres.genreId, genres.id))
      .where(eq(seriesGenres.seriesId, s.id));

    // Get chapters
    const dbChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.seriesId, s.id))
      .orderBy(chapters.sortOrder, chapters.number);

    return NextResponse.json({
      series: {
        title: s.title,
        altTitle: s.altTitle,
        description: s.description,
        coverUrl: s.coverUrl,
        bannerUrl: s.bannerUrl,
        status: s.status,
        rating: s.rating,
        author: s.author,
        artist: s.artist,
        genres: genreResults.map((g) => g.name),
      },
      chapters: dbChapters
        .filter((ch) => !ch.isHidden)
        .map((ch) => ({
          number: ch.number,
          title: ch.title,
          slug: ch.slug,
          pageCount: ch.pageCount,
        })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/scrape] Request failed:", message);
    return NextResponse.json({ error: `Failed to load series: ${message}` }, { status: 500 });
  }
}
