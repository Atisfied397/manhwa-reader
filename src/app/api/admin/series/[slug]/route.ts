import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series, chapters, chapterPages, seriesGenres, genres } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (result.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const seriesGenresResult = await db
    .select({ genreId: seriesGenres.genreId, name: genres.name, slug: genres.slug })
    .from(seriesGenres)
    .innerJoin(genres, eq(seriesGenres.genreId, genres.id))
    .where(eq(seriesGenres.seriesId, result[0].id));

  const chaptersResult = await db
    .select()
    .from(chapters)
    .where(eq(chapters.seriesId, result[0].id))
    .orderBy(chapters.sortOrder, chapters.number);

  return NextResponse.json({
    ...result[0],
    genres: seriesGenresResult,
    chapters: chaptersResult,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const existing = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const allowed = ["title", "altTitle", "description", "coverUrl", "bannerUrl", "status", "rating", "year", "author", "artist", "source", "sortOrder", "isFeatured", "isHidden"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updateData[dbKey] = body[key];
    }
  }

  const result = await db.update(series).set(updateData).where(eq(series.slug, slug)).returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const existing = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const seriesId = existing[0].id;

  const chapterIds = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.seriesId, seriesId));
  for (const ch of chapterIds) {
    await db.delete(chapterPages).where(eq(chapterPages.chapterId, ch.id));
  }
  await db.delete(chapters).where(eq(chapters.seriesId, seriesId));
  await db.delete(seriesGenres).where(eq(seriesGenres.seriesId, seriesId));
  await db.delete(series).where(eq(series.id, seriesId));

  return NextResponse.json({ success: true });
}
