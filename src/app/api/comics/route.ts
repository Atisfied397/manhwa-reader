import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await db
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
      .orderBy(series.sortOrder, desc(series.rating));

    return NextResponse.json(
      results.map((s) => ({
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl ?? "",
        rating: s.rating ?? 0,
        type: "Manhwa",
        source: s.source ?? "custom",
      }))
    );
  } catch (error) {
    console.error("[api/comics] Failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json([]);
  }
}
