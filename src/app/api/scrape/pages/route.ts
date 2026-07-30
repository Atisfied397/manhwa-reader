import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series, chapters, chapterPages } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const chapter = searchParams.get("chapter");

    if (!slug || !chapter) {
      return NextResponse.json(
        { error: "Provide 'slug' and 'chapter' query parameters" },
        { status: 400 }
      );
    }

    // Find series
    const dbSeries = await db
      .select()
      .from(series)
      .where(eq(series.slug, slug))
      .limit(1);

    if (dbSeries.length === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // Find chapter by slug
    const chNumber = chapter.replace(/^chapter-/, "");
    const dbChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.seriesId, dbSeries[0].id));

    const match = dbChapters.find(
      (c) =>
        c.slug === chapter ||
        c.number.toString() === chNumber ||
        `chapter-${c.number}` === chapter
    );

    if (!match) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Get pages
    const pages = await db
      .select()
      .from(chapterPages)
      .where(eq(chapterPages.chapterId, match.id))
      .orderBy(chapterPages.sortOrder);

    return NextResponse.json({
      pages: pages.map((p) => p.imageUrl),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/scrape/pages] Failed:", message);
    return NextResponse.json(
      { error: `Failed to load chapter pages: ${message}` },
      { status: 500 }
    );
  }
}
