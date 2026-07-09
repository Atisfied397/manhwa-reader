import { NextResponse } from "next/server";
import { loadScraper } from "@/lib/scraper";
import type { Scraper } from "@/lib/scraper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const chapter = searchParams.get("chapter");
    const source = searchParams.get("source") ?? "nyx";

    if (!slug || !chapter) {
      return NextResponse.json(
        { error: "Provide 'slug' and 'chapter' query parameters" },
        { status: 400 }
      );
    }

    const scraper: Scraper = loadScraper(source);
    const pages = await scraper.getChapterPages(slug, chapter);

    return NextResponse.json({ pages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load chapter pages: ${message}` },
      { status: 500 }
    );
  }
}
