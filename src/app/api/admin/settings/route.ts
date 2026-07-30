import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings, genres, seriesGenres } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const settings = await db.select().from(siteSettings);
  const allGenres = await db.select().from(genres);
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value ?? "";
  }
  return NextResponse.json({ ...settingsMap, genres: allGenres });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { settings, action, name, slug, seriesId, genreId } = body as {
    settings?: Record<string, string>;
    action?: string;
    name?: string;
    slug?: string;
    seriesId?: number;
    genreId?: number;
  };

  if (action === "createGenre" && name && slug) {
    const existing = await db.select().from(genres).where(eq(genres.slug, slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ genre: existing[0] });
    }
    const result = await db.insert(genres).values({ name, slug }).returning();
    return NextResponse.json({ genre: result[0] });
  }

  if (action === "addSeriesGenre" && seriesId && genreId) {
    const existing = await db.select().from(seriesGenres)
      .where(sql`${seriesGenres.seriesId} = ${seriesId} AND ${seriesGenres.genreId} = ${genreId}`)
      .limit(1);
    if (existing.length === 0) {
      await db.insert(seriesGenres).values({ seriesId, genreId });
    }
    return NextResponse.json({ success: true });
  }

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings object or action required" }, { status: 400 });
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettings).set({ value, updatedAt: new Date().toISOString() }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  }

  return NextResponse.json({ success: true });
}
