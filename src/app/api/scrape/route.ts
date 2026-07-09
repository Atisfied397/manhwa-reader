import { NextResponse } from "next/server";
import { loadScraper } from "@/lib/scraper";
import type { Scraper } from "@/lib/scraper";

function detectSourceFromUrl(urlStr: string): string {
  try {
    const hostname = new URL(urlStr).hostname;
    if (hostname.includes("asurascans")) return "asurascans";
    if (hostname.includes("asuracomic")) return "asura";
    if (hostname.includes("nyxscans")) return "nyx";
  } catch { /* ignore */ }
  return "asurascans";
}

function extractSlugFromUrl(urlStr: string): string {
  const pathParts = new URL(urlStr).pathname.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1];
}

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
        usage: {
          bySlug: { source: "asurascans|nyx|asura", slug: "solo-leveling" },
          byUrl: { url: "https://asurascans.com/comics/solo-leveling" },
        },
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
      chapters: chapters.slice(0, 50),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to scrape: ${message}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const source = searchParams.get("source") ?? "nyx";

    if (!slug) {
      return NextResponse.json({ error: "Provide 'slug' query parameter" }, { status: 400 });
    }

    const scraper: Scraper = loadScraper(source);
    const [series, chapters] = await Promise.all([
      scraper.getSeries(slug),
      scraper.getChapters(slug),
    ]);

    return NextResponse.json({
      source: scraper.name,
      series,
      chapters: chapters.slice(0, 50),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to scrape: ${message}` }, { status: 500 });
  }
}