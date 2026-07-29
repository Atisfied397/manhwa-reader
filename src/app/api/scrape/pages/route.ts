import { NextResponse } from "next/server";
import { loadScraper, nyxScansScraper, asuraScansScraper, comixToScraper, hivetoonsScraper, mantaScraper } from "@/lib/scraper";
import type { Scraper } from "@/lib/scraper";

const allScrapers: Scraper[] = [
  nyxScansScraper,
  asuraScansScraper,
  comixToScraper,
  hivetoonsScraper,
  mantaScraper,
];

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

    const primary: Scraper = loadScraper(source);
    const triedSources = new Set<string>();
    triedSources.add(primary.id);
    let lastError = "";

    try {
      const pages = await primary.getChapterPages(slug, chapter);
      if (pages.length > 0) {
        return NextResponse.json({ pages });
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Unknown error";
    }

    for (const alt of allScrapers) {
      if (triedSources.has(alt.id)) continue;
      triedSources.add(alt.id);
      try {
        const pages = await alt.getChapterPages(slug, chapter);
        if (pages.length > 0) {
          return NextResponse.json({ pages, source: alt.id });
        }
      } catch {
        // try next
      }
    }

    return NextResponse.json(
      { error: `Failed to load chapter pages${lastError ? `: ${lastError}` : ""}` },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/scrape/pages] Failed:", message);
    return NextResponse.json(
      { error: `Failed to load chapter pages: ${message}` },
      { status: 500 }
    );
  }
}
