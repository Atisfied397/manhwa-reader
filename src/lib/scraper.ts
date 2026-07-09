import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedSeries, ScrapedChapter } from "./types";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const client = axios.create({
  headers: { "User-Agent": USER_AGENT },
  timeout: 15000,
});

export interface Scraper {
  id: string;
  name: string;
  baseUrl: string;
  getSeries(slug: string): Promise<ScrapedSeries>;
  getChapters(slug: string): Promise<ScrapedChapter[]>;
  getChapterPages(slug: string, chapterSlug: string): Promise<string[]>;
}

function extractJsonLd(html: string, type: string): Record<string, unknown> | null {
  const $ = cheerio.load(html);
  let found: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (data["@type"] === type || (data["@graph"] && data["@graph"].some((g: Record<string, unknown>) => g["@type"] === type))) {
        const item = data["@type"] === type ? data : data["@graph"].find((g: Record<string, unknown>) => g["@type"] === type);
        if (item) found = item;
      }
    } catch { /* skip */ }
  });
  return found;
}

// ============ ASURA SCANS (asurascans.com) ============
export const asuraScansScraper: Scraper = {
  id: "asurascans",
  name: "Asura Scans",
  baseUrl: "https://asurascans.com",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/comics/${slug}`;
    const { data } = await client.get(url);
    const ld = extractJsonLd(data, "ComicSeries");

    const $ = cheerio.load(data);
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogDesc = $('meta[property="og:description"]').attr("content");

    const coverUrl = ld?.image as string ?? ogImage ?? "";
    const description = ld?.description as string ?? ogDesc ?? "";
    const title = ld?.name as string ?? $("h1").first().text().trim() ?? slug.replace(/-/g, " ");
    const altTitles = ld?.alternateName as string ?? "";
    const rating = ld?.aggregateRating ? (ld.aggregateRating as Record<string, unknown>).ratingValue as string : "";
    const status = $('[class*="status"]').first().text().trim() || $(".flex-1 .capitalize").text().trim() || "ongoing";
    const author = ld?.author ? (ld.author as Record<string, unknown>).name as string : "";
    const artist = ld?.illustrator ? (ld.illustrator as Record<string, unknown>).name as string : "";
    const genres = (ld?.genre as string[] ?? []).map((g) => g.trim());

    return {
      title,
      altTitle: altTitles || undefined,
      description,
      coverUrl,
      status: status.toLowerCase(),
      rating: rating ? parseFloat(rating) : undefined,
      author: author || undefined,
      artist: artist || undefined,
      genres,
    };
  },

  async getChapters(slug: string): Promise<ScrapedChapter[]> {
    const url = `${this.baseUrl}/comics/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const chapters: ScrapedChapter[] = [];

    // Parse chapter links from the DOM
    $("a[href*='chapter-'], a[href*='/chapter/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(/(?:chapter-|chapter\/)(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        const title = $(el).text().trim().replace(/chapter\s*\d+/i, "").trim();
        if (num > 0 && !chapters.some((c) => c.number === num)) {
          chapters.push({ number: num, title: title || undefined, pages: [] });
        }
      }
    });

    // Also check meta for chapter count and grab from JSON-LD
    const ld = extractJsonLd(data, "ComicSeries");
    const expectedCount = ld?.numberOfEpisodes as number ?? 0;
    if (expectedCount > chapters.length) {
      for (let i = chapters.length + 1; i <= expectedCount; i++) {
        if (!chapters.some((c) => c.number === i)) {
          chapters.push({ number: i, pages: [] });
        }
      }
    }

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(slug: string, chapterSlug: string): Promise<string[]> {
    const url = `${this.baseUrl}/comics/${slug}/${chapterSlug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const pages: string[] = [];
    $("img[class*='page'], .reader-area img, #reader img, .chapter-content img, img[alt*='page']").each((_, el) => {
      const src = $(el).attr("src");
      if (src) pages.push(src);
    });
    return pages;
  },
};

// ============ NYX SCANS (nyxscans.com) ============
export const nyxScansScraper: Scraper = {
  id: "nyx",
  name: "Nyx Scans",
  baseUrl: "https://nyxscans.com",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr("content")?.replace(" - Nyx Scans", "").trim()
      ?? $("h1").first().text().trim()
      ?? slug.replace(/-/g, " ");
    const description = $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
    const coverUrl = $('meta[property="og:image"]').attr("content") ?? "";

    let rating = undefined;
    const ratingText = $('[class*="rating"]').first().text().trim() || $(".text-star, .flex.items-center.gap-1 span").first().text().trim();
    if (ratingText) rating = parseFloat(ratingText);

    const status = $('[class*="status"]').first().text().trim() || $(".capitalize").first().text().trim() || "ongoing";

    const author = $('[class*="author"]').first().text().trim() || $("a[href*='author']").first().text().trim() || "";
    const artist = $('[class*="artist"]').first().text().trim() || $("a[href*='artist']").first().text().trim() || "";

    const genres: string[] = [];
    $(".genres a, .tags a, [class*='genre'] a, .flex-wrap.gap-2 a, .flex-wrap.gap-2 span").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 30) genres.push(text);
    });

    const altTitle = $('[class*="alt"], [class*="alternative"]').first().text().trim() || "";

    return {
      title,
      altTitle: altTitle || undefined,
      description,
      coverUrl,
      status: status.toLowerCase(),
      rating,
      author: author || undefined,
      artist: artist || undefined,
      genres: [...new Set(genres)],
    };
  },

  async getChapters(slug: string): Promise<ScrapedChapter[]> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const chapters: ScrapedChapter[] = [];

    $("a[href*='/series/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(new RegExp(`${slug}/chapter-(\\d+(\\.\\d+)?)`));
      if (match) {
        const num = parseFloat(match[1]);
        const title = $(el).text().trim().replace(/chapter\s*\d+/i, "").trim();
        if (num > 0 && !chapters.some((c) => c.number === num)) {
          chapters.push({ number: num, title: title || undefined, pages: [] });
        }
      }
    });

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(slug: string, chapterSlug: string): Promise<string[]> {
    const url = `${this.baseUrl}/series/${slug}/${chapterSlug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const pages: string[] = [];
    $("img[class*='page'], .reader-area img, #reader img, .chapter-content img, img[alt*='page'], .swiper-slide img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("icon") && !src.includes("logo")) pages.push(src);
    });
    return pages;
  },
};

// ============ ASURA COMIC (asuracomic.net) ============
export const asuraScraper: Scraper = {
  id: "asura",
  name: "Asura Comic",
  baseUrl: "https://asuracomic.net",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    return {
      title: $("h1").first().text().trim(),
      description: $(".description, .summary, [class*='desc']").first().text().trim(),
      coverUrl: $("img[class*='cover'], .thumbnail img, .poster img").first().attr("src"),
      status: $(".status, [class*='status']").first().text().trim(),
      genres: $(".genres a, .tags a, [class*='genre'] a").map((_, el) => $(el).text().trim()).get(),
      author: $(".author, [class*='author']").first().text().trim(),
    };
  },

  async getChapters(slug: string): Promise<ScrapedChapter[]> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);
    const chapters: ScrapedChapter[] = [];

    $(".chapter-item, .chapter-row, li[class*='chapter'], tr[class*='chapter']").each((_, el) => {
      const num = parseFloat($(el).find(".number, .chap-num").text().trim()) || 0;
      const title = $(el).find(".title, .chapter-title").text().trim();
      const link = $(el).find("a").first().attr("href");
      if (num > 0) {
        chapters.push({ number: num, title: title || undefined, pages: link ? [link] : [] });
      }
    });

    return chapters;
  },

  async getChapterPages(slug: string, chapterSlug: string): Promise<string[]> {
    const url = `${this.baseUrl}/series/${slug}/${chapterSlug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);
    const pages: string[] = [];

    $("img[class*='page'], .reader-area img, #reader img, .chapter-content img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) pages.push(src);
    });

    return pages;
  },
};

export function loadScraper(sourceId: string): Scraper {
  const scrapers: Record<string, Scraper> = {
    asura: asuraScraper,
    asurascans: asuraScansScraper,
    nyx: nyxScansScraper,
  };
  return scrapers[sourceId] ?? asuraScansScraper;
}

// ============ NYX SCANS HOMEPAGE / LISTING HELPERS ============

export interface NyxHomepageData {
  featured: {
    title: string;
    slug: string;
    rating: number;
    description: string;
    genres: string[];
    coverUrl: string;
  }[];
  popular: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    type: string;
  }[];
  latestNovels: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    type: string;
  }[];
  latestReleases: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    status: string;
    type: string;
    chapters: { number: string; slug: string; time: string; isNew: boolean }[];
  }[];
  mostPopular: {
    title: string;
    slug: string;
    genres: string[];
    type: string;
  }[];
}

export async function scrapeNyxHomepage(): Promise<NyxHomepageData> {
  const { data } = await client.get("https://nyxscans.com");
  const $ = cheerio.load(data);

  const result: NyxHomepageData = {
    featured: [],
    popular: [],
    latestNovels: [],
    latestReleases: [],
    mostPopular: [],
  };

  // Featured series from hero section
  $("a[href^='/series/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href.startsWith("/series/") || href.includes("chapter")) return;
    const slug = href.replace("/series/", "");
    const title = $(el).find("h2, h3, [class*='title'], .text-lg, .text-xl, .font-bold").first().text().trim() || slug.replace(/-/g, " ");
    const coverUrl = $(el).find("img").first().attr("src") ?? "";
    const ratingText = $(el).find('[class*="rating"], .text-star, .flex.items-center span').first().text().trim();
    const rating = parseFloat(ratingText) || 0;
    const genres: string[] = [];
    $(el).find('[class*="genre"], .flex-wrap span, .flex-wrap a').each((_, g) => {
      const gText = $(g).text().trim();
      if (gText && gText.length < 25 && isNaN(parseFloat(gText))) genres.push(gText);
    });
    const desc = $(el).find("p, [class*='desc'], .line-clamp").first().text().trim();

    if (title && !result.featured.find((f) => f.slug === slug)) {
      result.featured.push({ title, slug, rating, description: desc, genres, coverUrl });
    }
  });

  // Keep only featured that have long descriptions (hero items)
  result.featured = result.featured.filter((f) => f.description.length > 100).slice(0, 6);

  // Popular series - look for section with "Popular Today" heading, then get cards below
  const popularSection = $("body").text();
  const popularStart = popularSection.indexOf("Popular Today");
  if (popularStart >= 0) {
    $("a[href^='/series/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (!href.startsWith("/series/") || href.includes("chapter")) return;
      const slug = href.replace("/series/", "");
      const title = $(el).find("h2, h3, [class*='title']").first().text().trim() || $(el).attr("title") || "";
      const coverUrl = $(el).find("img").first().attr("src") ?? "";
      const allText = $(el).text();
      const ratingMatch = allText.match(/(\d+(\.\d+)?)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      const type = allText.includes("NOVEL") ? "Novel" : "Manhwa";
      if (title && slug && !result.popular.find((p) => p.slug === slug)) {
        result.popular.push({ title, slug, rating, coverUrl, type });
      }
    });
  }

  // Latest Releases
  $("a[href^='/series/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.includes("chapter-")) {
      const match = href.match(/\/series\/(.+)\/chapter-(.+)/);
      if (match) {
        const slug = match[1];
        const chapterNum = match[2];
        const mainLink = $(el).closest("div").parent().find("a[href='/series/" + slug + "']");
        const title = mainLink.first().text().trim() || $(el).closest("[class*='flex']").find("a[href^='/series/']").first().text().trim() || slug.replace(/-/g, " ");
        const item = result.latestReleases.find((r) => r.slug === slug);
        const time = $(el).find("span, .text-xs, .text-sm").last().text().trim() || "";
        const isNew = !!$(el).find('[class*="new"], [class*="New"]').length || time.toLowerCase() === "new";
        if (item) {
          if (!item.chapters.find((c) => c.number === chapterNum)) {
            item.chapters.push({ number: chapterNum, slug: `chapter-${chapterNum}`, time, isNew });
          }
        } else {
          const cover = $(el).closest("div").find("img").first().attr("src") ?? "";
          result.latestReleases.push({
            title: title || slug.replace(/-/g, " "),
            slug,
            rating: 0,
            coverUrl: cover,
            status: "Ongoing",
            type: "Manhwa",
            chapters: [{ number: chapterNum, slug: `chapter-${chapterNum}`, time, isNew }],
          });
        }
      }
    }
  });

  result.latestReleases = result.latestReleases.slice(0, 30);

  return result;
}

export interface NyxComicsListing {
  series: { title: string; slug: string; coverUrl: string; rating: number; type: string }[];
  totalPages: number;
}

export async function scrapeNyxComics(): Promise<NyxComicsListing> {
  const { data } = await client.get("https://nyxscans.com/comics");
  const $ = cheerio.load(data);

  const seriesList: NyxComicsListing["series"] = [];

  $("a[href^='/series/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href.startsWith("/series/") || href.includes("chapter")) return;
    const slug = href.replace("/series/", "");
    const title = $(el).find("h2, h3, [class*='title']").first().text().trim() || $(el).attr("title") || "";
    const coverUrl = $(el).find("img").first().attr("src") ?? "";
    const allText = $(el).text();
    const ratingMatch = allText.match(/(\d+(\.\d+)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    const type = allText.includes("NOVEL") ? "Novel" : "Manhwa";
    if (title && slug && !seriesList.find((s) => s.slug === slug)) {
      seriesList.push({ title, slug, coverUrl, rating, type });
    }
  });

  return { series: seriesList, totalPages: 1 };
}