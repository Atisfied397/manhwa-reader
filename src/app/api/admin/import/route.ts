import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series, chapters, chapterPages, genres, seriesGenres } from "@/lib/schema";
import { loadScraper } from "@/lib/scraper";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, source, importPages } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const scraperId = source ?? "nyx";
    const scraper = loadScraper(scraperId);

    let scrapedSeries;
    let scrapedChapters;
    try {
      [scrapedSeries, scrapedChapters] = await Promise.all([
        scraper.getSeries(slug),
        scraper.getChapters(slug),
      ]);
    } catch (e) {
      return NextResponse.json({ error: `Scraping failed: ${e instanceof Error ? e.message : "unknown"}` }, { status: 500 });
    }

    const safeRating = typeof scrapedSeries.rating === "number" && !isNaN(scrapedSeries.rating)
      ? Math.min(10, Math.max(0, scrapedSeries.rating))
      : 0;
    const safeStatus = ["ongoing", "completed", "hiatus", "dropped", "coming soon"].includes(scrapedSeries.status ?? "")
      ? scrapedSeries.status!
      : "ongoing";

    const existingSeries = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
    let seriesId: number;

    if (existingSeries.length > 0) {
      seriesId = existingSeries[0].id;
      await db.update(series).set({
        title: scrapedSeries.title,
        description: scrapedSeries.description,
        coverUrl: scrapedSeries.coverUrl,
        bannerUrl: scrapedSeries.bannerUrl,
        status: safeStatus,
        rating: safeRating,
        author: scrapedSeries.author,
        artist: scrapedSeries.artist,
        source: scraperId,
        updatedAt: new Date().toISOString(),
      }).where(eq(series.id, seriesId));
    } else {
      const result = await db.insert(series).values({
        title: scrapedSeries.title,
        slug,
        description: scrapedSeries.description ?? "",
        coverUrl: scrapedSeries.coverUrl ?? "",
        bannerUrl: scrapedSeries.bannerUrl ?? "",
        status: safeStatus,
        rating: safeRating,
        author: scrapedSeries.author,
        artist: scrapedSeries.artist,
        source: scraperId,
      }).returning();
      seriesId = result[0].id;
    }

    if (scrapedSeries.genres?.length) {
      for (const genreName of scrapedSeries.genres) {
        const genreSlug = genreName.toLowerCase().replace(/\s+/g, "-");
        let genreRow = await db.select().from(genres).where(eq(genres.slug, genreSlug)).limit(1);
        if (genreRow.length === 0) {
          genreRow = await db.insert(genres).values({ name: genreName, slug: genreSlug }).returning();
        }
        const existingSG = await db.select().from(seriesGenres)
          .where(sql`${seriesGenres.seriesId} = ${seriesId} AND ${seriesGenres.genreId} = ${genreRow[0].id}`)
          .limit(1);
        if (existingSG.length === 0) {
          await db.insert(seriesGenres).values({ seriesId, genreId: genreRow[0].id });
        }
      }
    }

    let importedChapters = 0;
    let importedPages = 0;
    const chapterIds: { id: number; number: number; slug: string }[] = [];

    for (const ch of scrapedChapters) {
      const chSlug = `chapter-${ch.number}`;
      const existingCh = await db.select().from(chapters).where(eq(chapters.slug, chSlug)).limit(1);

      let chapterId: number;
      if (existingCh.length > 0) {
        chapterId = existingCh[0].id;
      } else {
        const result = await db.insert(chapters).values({
          seriesId,
          number: ch.number,
          title: ch.title,
          slug: chSlug,
          sortOrder: Math.round(ch.number * 100),
        }).returning();
        chapterId = result[0].id;
        importedChapters++;
      }
      chapterIds.push({ id: chapterId, number: ch.number, slug: chSlug });
    }

    if (importPages && chapterIds.length > 0) {
      for (const ch of chapterIds) {
        try {
          const pages = await scraper.getChapterPages(slug, ch.slug);
          if (pages.length > 0) {
            const existingPages = await db.select().from(chapterPages)
              .where(eq(chapterPages.chapterId, ch.id))
              .limit(1);

            if (existingPages.length === 0) {
              for (let i = 0; i < pages.length; i++) {
                await db.insert(chapterPages).values({
                  chapterId: ch.id,
                  pageNumber: i + 1,
                  imageUrl: pages[i],
                  sortOrder: i + 1,
                });
                importedPages++;
              }
              await db.update(chapters)
                .set({ pageCount: pages.length })
                .where(eq(chapters.id, ch.id));
            }
          }
        } catch (e) {
          console.error(`[import] Failed to import pages for chapter ${ch.number}:`, e instanceof Error ? e.message : String(e));
        }
      }
    }

    return NextResponse.json({
      success: true,
      series: { id: seriesId, title: scrapedSeries.title },
      importedChapters,
      importedPages,
      totalChapters: scrapedChapters.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/admin/import] Failed:", message);
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 });
  }
}
