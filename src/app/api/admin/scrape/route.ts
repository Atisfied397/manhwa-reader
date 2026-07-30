import { NextResponse } from "next/server";
import { loadScraper } from "@/lib/scraper";
import type { Scraper } from "@/lib/scraper";
import {
  scrapeNyxHomepage,
  scrapeAsuraHomepage,
  scrapeComixHomepage,
  scrapeHivetoonsHomepage,
  scrapeMantaHomepage,
} from "@/lib/scraper";

export const dynamic = "force-dynamic";

function detectSourceFromUrl(urlStr: string): string {
  try {
    const hostname = new URL(urlStr).hostname;
    if (hostname.includes("asurascans")) return "asurascans";
    if (hostname.includes("asuracomic")) return "asura";
    if (hostname.includes("nyxscans")) return "nyx";
    if (hostname.includes("mangaplus")) return "mangaplus";
  } catch { /* ignore */ }
  return "asurascans";
}

function extractSlugFromUrl(urlStr: string): string {
  const pathParts = new URL(urlStr).pathname.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1];
}

const HOMEPAGE_SCRAPERS: Record<string, () => Promise<{ featured: { title: string; slug: string; coverUrl: string; status?: string }[]; popular: { title: string; slug: string; coverUrl: string; status?: string }[] }>> = {
  nyx: scrapeNyxHomepage,
  nyxscans: scrapeNyxHomepage,
  asurascans: scrapeAsuraHomepage,
  comixto: scrapeComixHomepage,
  hivetoons: scrapeHivetoonsHomepage,
  manta: scrapeMantaHomepage,
};

// POST - Scrape series info (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, slug, url } = body as { source?: string; slug?: string; url?: string };

    let resolvedSource = source ?? "asurascans";
    let resolvedSlug = slug;

    if (!resolvedSlug && url) {
      resolvedSlug = extractSlugFromUrl(url);
      resolvedSource = detectSourceFromUrl(url);
    }

    if (!resolvedSlug) {
      return NextResponse.json({
        error: "Provide 'slug' or 'url'",
      }, { status: 400 });
    }

    const scraper: Scraper = loadScraper(resolvedSource);
    const [series, chapters] = await Promise.all([
      scraper.getSeries(resolvedSlug),
      scraper.getChapters(resolvedSlug),
    ]);

    return NextResponse.json({
      source: scraper.name,
      series,
      chapters: chapters.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/admin/scrape] Request failed:", message);
    return NextResponse.json({ error: `Failed to scrape: ${message}` }, { status: 500 });
  }
}

// GET - Scrape chapter pages (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const chapter = searchParams.get("chapter");
    const source = searchParams.get("source") ?? "nyx";
    const homepage = searchParams.get("homepage");

    if (homepage === "true") {
      const homepageFn = HOMEPAGE_SCRAPERS[source];
      if (!homepageFn) {
        return NextResponse.json({ error: `Homepage not supported for "${source}"` }, { status: 400 });
      }
      console.log(`[api/admin/scrape] Running homepage scraper for: ${source}`);
      let data;
      try {
        data = await homepageFn();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[api/admin/scrape] Homepage scraper "${source}" threw:`, msg);
        return NextResponse.json({ error: `Scraper failed for "${source}": ${msg}`, source, series: [] }, { status: 500 });
      }
      const raw = [
        ...data.featured.map((s) => ({ title: s.title, slug: s.slug, coverUrl: s.coverUrl, status: s.status || "ongoing" })),
        ...data.popular.map((s) => ({ title: s.title, slug: s.slug, coverUrl: s.coverUrl, status: s.status || "ongoing" })),
      ];
      const seen = new Set<string>();
      const series = raw.filter((s) => {
        if (seen.has(s.slug)) return false;
        seen.add(s.slug);
        return true;
      });
      console.log(`[api/admin/scrape] Homepage scraper "${source}" returned ${series.length} series (featured: ${data.featured.length}, popular: ${data.popular.length})`);
      return NextResponse.json({ source, series });
    }

    if (!slug || !chapter) {
      return NextResponse.json(
        { error: "Provide 'slug' and 'chapter' query parameters" },
        { status: 400 }
      );
    }

    const scraper: Scraper = loadScraper(source);
    const pages = await scraper.getChapterPages(slug, chapter);

    return NextResponse.json({ pages, source: scraper.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/admin/scrape] Pages failed:", message);
    return NextResponse.json({ error: `Failed to scrape pages: ${message}` }, { status: 500 });
  }
}
