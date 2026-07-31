import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/schema";
import { eq, sql, like, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  let whereClause = undefined;
  if (search) {
    whereClause = or(
      like(series.title, `%${search}%`),
      like(series.slug, `%${search}%`)
    );
  }

  const results = await db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      coverUrl: series.coverUrl,
      status: series.status,
      source: series.source,
      sortOrder: series.sortOrder,
      isFeatured: series.isFeatured,
      isHidden: series.isHidden,
    })
    .from(series)
    .where(whereClause)
    .orderBy(series.sortOrder, series.title)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(series)
    .where(whereClause);

  return NextResponse.json({
    series: results,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, slug, coverUrl, bannerUrl, description, status, source, sortOrder, isFeatured, isHidden, author, artist, year, rating, altTitle } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
  }

  const existing = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Series with this slug already exists" }, { status: 409 });
  }

  const result = await db.insert(series).values({
    title,
    slug,
    coverUrl: coverUrl ?? "",
    bannerUrl: bannerUrl ?? "",
    description: description ?? "",
    status: status ?? "ongoing",
    source: source ?? "nyx",
    sortOrder: sortOrder ?? 0,
    isFeatured: isFeatured ?? false,
    isHidden: isHidden ?? false,
    author: author ?? null,
    artist: artist ?? null,
    year: year ?? null,
    rating: rating ?? 0,
    altTitle: altTitle ?? null,
  }).returning();

  return NextResponse.json({ success: true, series: result[0] }, { status: 201 });
}
