import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/schema";
import { like, or, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  try {
    let results;
    if (query) {
      results = await db
        .select({
          title: series.title,
          slug: series.slug,
          coverUrl: series.coverUrl,
          rating: series.rating,
          status: series.status,
          source: series.source,
        })
        .from(series)
        .where(
          or(
            like(series.title, `%${query}%`),
            like(series.slug, `%${query}%`),
            like(series.description, `%${query}%`)
          )
        )
        .limit(50);
    } else {
      results = await db
        .select({
          title: series.title,
          slug: series.slug,
          coverUrl: series.coverUrl,
          rating: series.rating,
          status: series.status,
          source: series.source,
        })
        .from(series)
        .where(eq(series.isHidden, false))
        .orderBy(series.sortOrder, desc(series.rating))
        .limit(20);
    }

    const comics = results.map((s) => ({
      title: s.title,
      slug: s.slug,
      coverUrl: s.coverUrl ?? "",
      rating: s.rating ?? 0,
      type: "Manhwa",
      source: s.source ?? "custom",
    }));

    if (query) {
      // Sort exact matches first
      const words = query.split(/\s+/).filter(Boolean);
      comics.sort((a, b) => {
        const aExact = words.every((w) => a.title.toLowerCase().includes(w));
        const bExact = words.every((w) => b.title.toLowerCase().includes(w));
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
    }

    return NextResponse.json(comics);
  } catch (error) {
    console.error("[api/search] Failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json([]);
  }
}
