import { client } from "./scraper";
import * as cheerio from "cheerio";

export function isAdultContent(text: string): boolean {
  return /(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi\b|mature\b|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i.test(text);
}

export interface CategorySeriesEntry {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  type: string;
  source: string;
  sourceUrl: string;
}

export interface ScrapedCategoryPage {
  series: CategorySeriesEntry[];
  totalPages: number;
  currentPage: number;
}

export interface GenreMeta {
  slug: string;
  name: string;
  count: number;
}

// ---- SOURCE CONFIG ----
// Sources are configured inline in each scraper function below.

// ---- SHARED HELPER: parse series entries from a cheerio-loaded page ----

interface ParseOptions {
  source: string;
  sourceUrl: string;
  seriesHrefPattern: RegExp;
  slugExtractor: (href: string) => string | null;
  titleSelectors: string;
  coverSelector: string;
  ratingPattern?: RegExp;
}

function parseSeriesFromPage(
  $: cheerio.CheerioAPI,
  html: string,
  opts: ParseOptions,
): CategorySeriesEntry[] {
  const series: CategorySeriesEntry[] = [];

  $("a[href*='/series/'], a[href*='/comics/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.includes("chapter")) return;

    const slug = opts.slugExtractor(href);
    if (!slug) return;

    const title =
      $(el).find(opts.titleSelectors).first().text().trim() ||
      $(el).find("img").first().attr("alt") ||
      slug.replace(/-/g, " ");

    const coverUrl = $(el).find(opts.coverSelector).first().attr("src") ?? "";

    const allText = $(el).text();
    const ratingMatch = allText.match(opts.ratingPattern || /(\d+(\.\d+)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    const isNovel = /novel/i.test(allText);
    if (isAdultContent(allText)) return;

    if (title && !series.some((s) => s.slug === slug)) {
      series.push({
        title,
        slug,
        coverUrl,
        rating,
        type: isNovel ? "Novel" : "Manhwa",
        source: opts.source,
        sourceUrl: opts.sourceUrl,
      });
    }
  });

  return series;
}

// ---- COMIX.TO ----

export async function scrapeComixGenresList(): Promise<GenreMeta[]> {
  try {
    const { data } = await client.get("https://comix.to/genres");
    const html = typeof data === "string" ? data : "";
    const match = html.match(/<script[^>]*id="initial-data"[^>]*>({.+?})<\/script>/);
    if (!match) return [];
    const parsed = JSON.parse(match[1]);
    const genres: { slug: string; label: string; count: number }[] = parsed?.genres?.genres ?? [];
    const demographics: { slug: string; label: string; count: number }[] = parsed?.genres?.demographics ?? [];
    const all = [...genres, ...demographics];
    return all
      .filter((g) => !/(adult|hentai|smut|ecchi|mature)/i.test(g.slug))
      .map((g) => ({ slug: g.slug, name: g.label, count: g.count }));
  } catch {
    return [];
  }
}

export async function scrapeComixGenrePage(slug: string, page: number = 1): Promise<ScrapedCategoryPage> {
  try {
    const { data } = await client.get(`https://comix.to/genre/${slug}?page=${page}`);
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    const series = parseSeriesFromPage($, html, {
      source: "comixto",
      sourceUrl: "https://comix.to",
      seriesHrefPattern: /\/series\//,
      slugExtractor: (href) => {
        const s = href.replace("/series/", "").replace(/^\//, "").split("/")[0];
        return s || null;
      },
      titleSelectors: "h2, h3, [class*='title'], .font-bold",
      coverSelector: "img",
      ratingPattern: /(\d+(\.\d+)?)/,
    });

    const totalMatch = html.match(/page=(\d+)[^>]*>$/m) || html.match(/\/genre\/[\w-]+\?page=(\d+)/);
    const totalPages = totalMatch ? Math.max(1, parseInt(totalMatch[1])) : 1;

    return { series, totalPages, currentPage: page };
  } catch {
    return { series: [], totalPages: 0, currentPage: page };
  }
}

// ---- ASURA SCANS ----

export async function scrapeAsuraGenresList(): Promise<GenreMeta[]> {
  try {
    const { data } = await client.get("https://asurascans.com/browse");
    const $ = cheerio.load(data);
    const genres: GenreMeta[] = [];
    $("select[name='genres'] option, [class*='genre'] option").each((_, el) => {
      const val = $(el).attr("value") ?? "";
      if (!val || /(adult|hentai|smut|ecchi|mature|all)/i.test(val)) return;
      const name = $(el).text().trim();
      genres.push({ slug: val.toLowerCase().replace(/\s+/g, "-"), name, count: 0 });
    });
    $("a[href*='genres=']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(/genres=([^&]+)/);
      if (match && !genres.some((g) => g.slug === match[1])) {
        genres.push({ slug: match[1], name: $(el).text().trim() || match[1], count: 0 });
      }
    });
    return genres;
  } catch {
    return [];
  }
}

export async function scrapeAsuraGenrePage(slug: string, page: number = 1): Promise<ScrapedCategoryPage> {
  try {
    const { data } = await client.get(`https://asurascans.com/browse?genres=${slug}&page=${page}`);
    const $ = cheerio.load(data);

    const series = parseSeriesFromPage($, data, {
      source: "asurascans",
      sourceUrl: "https://asurascans.com",
      seriesHrefPattern: /\/(?:comics|series)\//,
      slugExtractor: (href) => {
        const match = href.match(/\/(?:comics|series)\/([^/]+)/);
        return match ? match[1] : null;
      },
      titleSelectors: "h2, h3, [class*='title'], .font-bold",
      coverSelector: "img",
      ratingPattern: /(\d+(\.\d+)?)/,
    });

    // Extract total pages from pagination
    let totalPages = 1;
    const lastPageLink = $("a[href*='page=']").last().attr("href");
    if (lastPageLink) {
      const pageMatch = lastPageLink.match(/page=(\d+)/);
      if (pageMatch) totalPages = Math.max(1, parseInt(pageMatch[1]));
    }

    return { series, totalPages, currentPage: page };
  } catch {
    return { series: [], totalPages: 0, currentPage: page };
  }
}

// ---- NYX SCANS ----

export async function scrapeNyxGenrePage(slug: string, page: number = 1): Promise<ScrapedCategoryPage> {
  try {
    const { data } = await client.get(`https://nyxscans.com/series?genres=${slug}&page=${page}`);
    const $ = cheerio.load(data);

    const series = parseSeriesFromPage($, data, {
      source: "nyx",
      sourceUrl: "https://nyxscans.com",
      seriesHrefPattern: /\/series\//,
      slugExtractor: (href) => {
        const s = href.replace("/series/", "").replace(/^\//, "").split("/")[0];
        return s || null;
      },
      titleSelectors: "h2, h3, [class*='title'], .font-bold",
      coverSelector: "img",
      ratingPattern: /(\d+(\.\d+)?)/,
    });

    return { series, totalPages: 1, currentPage: page };
  } catch {
    return { series: [], totalPages: 0, currentPage: page };
  }
}

// ---- HIVETOONS ----

export async function scrapeHivetoonsGenrePage(slug: string, page: number = 1): Promise<ScrapedCategoryPage> {
  try {
    const { data } = await client.get(`https://hivetoons.org/genre?genre=${slug}&page=${page}`);
    const $ = cheerio.load(data);

    const series = parseSeriesFromPage($, data, {
      source: "hivetoons",
      sourceUrl: "https://hivetoons.org",
      seriesHrefPattern: /\/series\//,
      slugExtractor: (href) => {
        const s = href.replace("/series/", "").replace(/^\//, "").split("/")[0];
        return s || null;
      },
      titleSelectors: "h2, h3, [class*='title'], .font-bold",
      coverSelector: "img",
      ratingPattern: /(\d+(\.\d+)?)/,
    });

    return { series, totalPages: 1, currentPage: page };
  } catch {
    return { series: [], totalPages: 0, currentPage: page };
  }
}

// ---- GENERIC DISPATCHER ----

export async function scrapeGenrePage(site: string, slug: string, page: number = 1): Promise<ScrapedCategoryPage> {
  switch (site) {
    case "comixto": return scrapeComixGenrePage(slug, page);
    case "asurascans": return scrapeAsuraGenrePage(slug, page);
    case "nyx": return scrapeNyxGenrePage(slug, page);
    case "hivetoons": return scrapeHivetoonsGenrePage(slug, page);
    default: return { series: [], totalPages: 0, currentPage: page };
  }
}

export async function scrapeSiteGenres(site: string): Promise<GenreMeta[]> {
  switch (site) {
    case "comixto": return scrapeComixGenresList();
    case "asurascans": return scrapeAsuraGenresList();
    default: return [];
  }
}
