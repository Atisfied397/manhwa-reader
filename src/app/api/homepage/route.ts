import { NextResponse } from "next/server";
import { scrapeAllHomepage } from "@/lib/scraper";
import { fallbackHomepage } from "@/lib/fallback";

export async function GET() {
  try {
    const data = await scrapeAllHomepage();
    return NextResponse.json({
      ...data,
      featured: data.featured.length > 0 ? data.featured : fallbackHomepage.featured,
      popular: data.popular.length > 0 ? data.popular : fallbackHomepage.popular,
      latestReleases: data.latestReleases.length > 0 ? data.latestReleases : fallbackHomepage.latestReleases,
    });
  } catch {
    return NextResponse.json(fallbackHomepage);
  }
}
