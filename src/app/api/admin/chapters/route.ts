import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters, chapterPages, series } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seriesSlug = searchParams.get("series");

  if (!seriesSlug) {
    return NextResponse.json({ error: "series query param required" }, { status: 400 });
  }

  const seriesResult = await db.select().from(series).where(eq(series.slug, seriesSlug)).limit(1);
  if (seriesResult.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const chaptersResult = await db
    .select({
      id: chapters.id,
      number: chapters.number,
      title: chapters.title,
      slug: chapters.slug,
      pageCount: chapters.pageCount,
      sortOrder: chapters.sortOrder,
      isHidden: chapters.isHidden,
      createdAt: chapters.createdAt,
    })
    .from(chapters)
    .where(eq(chapters.seriesId, seriesResult[0].id))
    .orderBy(chapters.sortOrder, chapters.number);

  return NextResponse.json({ series: seriesResult[0], chapters: chaptersResult });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { orders } = body as { orders: { id: number; sortOrder: number; isHidden?: boolean }[] };

  if (!orders || !Array.isArray(orders)) {
    return NextResponse.json({ error: "orders array required" }, { status: 400 });
  }

  for (const item of orders) {
    const updateData: Record<string, unknown> = { sortOrder: item.sortOrder };
    if (item.isHidden !== undefined) {
      updateData.isHidden = item.isHidden;
    }
    await db.update(chapters).set(updateData).where(eq(chapters.id, item.id));
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { seriesId, seriesSlug, number, title, slug, pageCount, sortOrder, pageUrls } = body;

  let resolvedSeriesId = seriesId;

  if (!resolvedSeriesId) {
    if (!seriesSlug) {
      return NextResponse.json({ error: "seriesId or seriesSlug is required" }, { status: 400 });
    }
    const seriesResult = await db.select().from(series).where(eq(series.slug, seriesSlug)).limit(1);
    if (seriesResult.length === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
    resolvedSeriesId = seriesResult[0].id;
  }

  if (number === undefined) {
    return NextResponse.json({ error: "number is required" }, { status: 400 });
  }

  const chSlug = slug || `chapter-${number}`;

  const result = await db.insert(chapters).values({
    seriesId: resolvedSeriesId,
    number,
    title: title ?? null,
    slug: chSlug,
    pageCount: pageUrls?.length ?? pageCount ?? 0,
    sortOrder: sortOrder ?? Math.round(number * 100),
  }).returning();

  if (pageUrls?.length) {
    const pageValues = pageUrls.map((url: string, i: number) => ({
      chapterId: result[0].id,
      pageNumber: i + 1,
      imageUrl: url,
      sortOrder: i + 1,
    }));
    await db.insert(chapterPages).values(pageValues);
  }

  return NextResponse.json(result[0], { status: 201 });
}
