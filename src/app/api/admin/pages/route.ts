import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapterPages, chapters, series } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seriesSlug = searchParams.get("series");
  const chapterSlug = searchParams.get("chapter");

  if (!seriesSlug || !chapterSlug) {
    return NextResponse.json({ error: "series and chapter query params required" }, { status: 400 });
  }

  const seriesResult = await db.select().from(series).where(eq(series.slug, seriesSlug)).limit(1);
  if (seriesResult.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const chapterResult = await db
    .select()
    .from(chapters)
    .where(eq(chapters.slug, chapterSlug))
    .limit(1);
  if (chapterResult.length === 0) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const pagesResult = await db
    .select()
    .from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterResult[0].id))
    .orderBy(chapterPages.sortOrder, chapterPages.pageNumber);

  return NextResponse.json({
    series: seriesResult[0],
    chapter: chapterResult[0],
    pages: pagesResult,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { orders } = body as { orders: { id: number; sortOrder: number; pageNumber: number }[] };

  if (!orders || !Array.isArray(orders)) {
    return NextResponse.json({ error: "orders array required" }, { status: 400 });
  }

  for (const item of orders) {
    await db
      .update(chapterPages)
      .set({ sortOrder: item.sortOrder, pageNumber: item.pageNumber })
      .where(eq(chapterPages.id, item.id));
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { chapterSlug, imageUrl, pageNumber, sortOrder } = body;

  if (!chapterSlug || !imageUrl) {
    return NextResponse.json({ error: "chapterSlug and imageUrl required" }, { status: 400 });
  }

  const chapterResult = await db.select().from(chapters).where(eq(chapters.slug, chapterSlug)).limit(1);
  if (chapterResult.length === 0) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const result = await db.insert(chapterPages).values({
    chapterId: chapterResult[0].id,
    imageUrl,
    pageNumber: pageNumber ?? 0,
    sortOrder: sortOrder ?? 0,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body as { id: number };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await db.delete(chapterPages).where(eq(chapterPages.id, id));
  return NextResponse.json({ success: true });
}
