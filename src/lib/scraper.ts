import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import { HttpsProxyAgent } from "https-proxy-agent";
import type { ScrapedSeries, ScrapedChapter } from "./types";

function naturalSortUrls(urls: string[]): string[] {
  const extractNumbers = (s: string): number[] => {
    const nums: number[] = [];
    let current = "";
    for (const ch of s) {
      if (/\d/.test(ch)) {
        current += ch;
      } else if (current !== "") {
        nums.push(parseInt(current, 10));
        current = "";
      }
    }
    if (current !== "") nums.push(parseInt(current, 10));
    return nums;
  };

  return [...urls].sort((a, b) => {
    const aNums = extractNumbers(a);
    const bNums = extractNumbers(b);
    const len = Math.min(aNums.length, bNums.length);
    for (let i = 0; i < len; i++) {
      if (aNums[i] !== bNums[i]) return aNums[i] - bNums[i];
    }
    return aNums.length - bNums.length;
  });
}

function filterChapterPages(urls: string[]): string[] {
  const COVER_RE = /(?:^|[\\/])0*\.(?:webp|jpg|png|jpeg)$|cover|thumb|banner|icon|logo|avatar|poster|featured|promo|advertisement/i;
  return urls.filter((url) => !COVER_RE.test(url));
}

const MP_API_BASE = "https://jumpg-webapi.tokyo-cdn.com/api";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function getProxyConfig(): { url: string; agent: HttpsProxyAgent<string> } | null {
  const proxyUrl = process.env.PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
  if (!proxyUrl) return null;
  const agent = new HttpsProxyAgent(proxyUrl);
  return { url: proxyUrl, agent };
}

const ADULT_RE = /(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi\b|mature\b|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i;

function isAdultContent(text: string): boolean {
  return ADULT_RE.test(text);
}

const proxyConfig = getProxyConfig();

export const client = axios.create({
  headers: {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
  },
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 400,
  ...(proxyConfig ? { httpsAgent: proxyConfig.agent, proxy: false } : {}),
});

// Retry wrapper with exponential backoff
export async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3,
): Promise<{ data: T }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.get(url);
      return response as { data: T };
    } catch (error) {
      lastError = error;
      const isRetryable = axios.isAxiosError(error) && (
        !error.response ||
        error.response.status >= 500 ||
        error.response.status === 429 ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT"
      );
      if (!isRetryable || attempt === maxRetries) break;
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

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

  // Recursively search for a @type match in a JSON-LD object,
  // including nested @graph arrays and nested @graph within graph items.
  function searchInObject(obj: unknown): Record<string, unknown> | null {
    if (!obj || typeof obj !== "object") return null;
    const rec = obj as Record<string, unknown>;

    if (rec["@type"] === type) return rec;

    if (Array.isArray(rec["@graph"])) {
      for (const item of rec["@graph"]) {
        const result = searchInObject(item);
        if (result) return result;
      }
    }

    // Also check if the object itself is inside a graph array
    if (Array.isArray(rec)) {
      for (const item of rec) {
        const result = searchInObject(item);
        if (result) return result;
      }
    }

    return null;
  }

  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const htmlContent = $(el).html() ?? "";
      const data = JSON.parse(htmlContent);
      const result = searchInObject(data);
      if (result) found = result;
    } catch { /* skip invalid JSON */ }
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

    // Parse chapter links from the DOM (Asura uses /chapter/N format)
    $("a[href*='/chapter/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(/\/chapter\/(\d+)/);
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
    const chapterNum = chapterSlug.replace(/^chapter-/, "");
    const url = `${this.baseUrl}/comics/${slug}/chapter/${chapterNum}`;
    const { data } = await client.get(url);
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    const pagesSet = new Set<string>();

    // Collect from preload links
    $('link[rel="preload"][as="image"]').each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("/chapters/") && !href.includes("cover")) {
        pagesSet.add(href);
      }
    });

    // Regex: asura CDN chapter image URLs (most reliable source)
    const cdnUrls = html.match(/https?:\/\/cdn\.asurascans\.com\/chapters\/[^"'\s<>]+\.(?:webp|jpg|png|jpeg)/gi);
    if (cdnUrls) {
      for (const u of cdnUrls) pagesSet.add(u);
    }

    // Collect from img tags in the reader area
    const pages = naturalSortUrls(filterChapterPages([...pagesSet]));
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
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    let title = $('meta[property="og:title"]').attr("content")?.trim() ?? "";
    title = title.replace(/\s*[-–]\s*Nyx\s*Scans?\s*$/i, "").trim();
    if (!title) {
      title = $("h1").first().text().trim();
    }
    if (!title) {
      const contentMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (contentMatch) title = contentMatch[1].trim();
    }
    if (!title) {
      title = slug.replace(/-/g, " ");
    }
    const description = $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
    const coverUrl = $('meta[property="og:image"]').attr("content") ?? "";

    const VALID_STATUSES = ["ongoing", "completed", "hiatus", "dropped", "coming soon"];
    let status = "";
    $("span, p, div").each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (VALID_STATUSES.includes(text)) {
        status = text;
        return false;
      }
      return true;
    });
    if (!status) status = "ongoing";

    let rating: number | undefined;
    const ratingStr = $("span").filter((_, el) => /^\d+(\.\d+)?$/.test($(el).text().trim())).first().text().trim();
    if (ratingStr) {
      const parsed = parseFloat(ratingStr);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) rating = parsed;
    }

    const author = "";
    const artist = "";

    const genres: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("/genre/") || href.includes("/categories/")) {
        const text = $(el).text().trim();
        if (text && text.length < 30) genres.push(text);
      }
    });

    return {
      title,
      description,
      coverUrl,
      status,
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

    $("a").each((_, el) => {
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
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    const pagesSet = new Set<string>();

    // Collect from preload links
    $('link[rel="preload"][as="image"]').each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (/page-\d+/.test(href) && !href.includes("icon") && !href.includes("logo") && !href.includes("avatar")) {
        const fullUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;
        pagesSet.add(fullUrl);
      }
    });

    // Collect from all img tags
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && /page-\d+|chapter|chapter_images|\.webp|storage\.nyxscans/i.test(src) && !src.includes("icon") && !src.includes("logo") && !src.includes("avatar")) {
        const fullUrl = src.startsWith("http") ? src : `${this.baseUrl}${src}`;
        pagesSet.add(fullUrl);
      }
    });

    // Regex fallback: extract all storage.nyxscans.com URLs that look like pages
    const reUrls = html.match(/https?:\/\/storage\.nyxscans\.com[^"'\s<>]+(?:page-\d+|chapter_images)[^"'\s<>]+\.(?:webp|jpg|png|jpeg)/gi);
    if (reUrls) {
      for (const u of reUrls) pagesSet.add(u);
    }

    // Regex fallback: any image-like URL that contains page number patterns
    const allImgUrls = html.match(/https?:\/\/[^"'\s<>]+(?:page-\d+|\d{4,})[^"'\s<>]*\.(?:webp|jpg|png|jpeg)/gi);
    if (allImgUrls) {
      for (const u of allImgUrls) pagesSet.add(u);
    }

    const pages = naturalSortUrls(filterChapterPages([...pagesSet]));
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
      if (num > 0) {
        chapters.push({ number: num, title: title || undefined, pages: [] });
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

    return naturalSortUrls(filterChapterPages(pages));
  },
};

export function loadScraper(sourceId: string): Scraper {
  const scrapers: Record<string, Scraper> = {
    asura: asuraScraper,
    asurascans: asuraScansScraper,
    nyx: nyxScansScraper,
    nyxscans: nyxScansScraper,
    mangaplus: mangaPlusScraper,
    comixto: comixToScraper,
    hivetoons: hivetoonsScraper,
    manta: mantaScraper,

  };
  return scrapers[sourceId] ?? asuraScansScraper;
}

// ============ MANGA PLUS (mangaplus.shueisha.co.jp) ============
// Manga Plus exposes a JSON web API. Series/chapters are identified by
// numeric ids: `slug` => title_id, `chapterSlug` => chapter_id.
function decryptMangaPlusImage(encryptedUrl: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "hex");
  const iv = Buffer.alloc(16, 0x0a);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedUrl, "base64")),
    decipher.final(),
  ]);
  const url = decrypted.toString("utf-8");
  return url.endsWith(".enc") ? url.slice(0, -4) : url;
}

export const mangaPlusScraper: Scraper = {
  id: "mangaplus",
  name: "Manga Plus",
  baseUrl: "https://mangaplus.shueisha.co.jp",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const { data } = await client.get(`${MP_API_BASE}/title_detail?title_id=${slug}`);
    const titleDetail = data?.successResult?.title ?? {};

    const name: string = titleDetail.name ?? "";
    const overview: string = titleDetail.overview ?? "";
    const coverUrl: string = titleDetail.portraitImageUrl ?? titleDetail.landscapeImageUrl ?? "";
    const authorList: { name: string }[] = titleDetail.authorList ?? [];
    const authors = authorList.map((a) => a.name).filter(Boolean);
    const author = authors.join(", ");

    // Manga Plus does not expose a clean status field; assume ongoing listing.
    const status: string = titleDetail.nextTimestamp ? "ongoing" : "ongoing";

    const genres: string[] = [];
    const tagList: unknown[] = titleDetail.tagList ?? titleDetail.genres ?? [];
    for (const t of tagList) {
      const label = typeof t === "string" ? t : (t as { name?: string })?.name;
      if (label) genres.push(label);
    }

    return {
      title: name || slug,
      description: overview,
      coverUrl,
      status,
      author: author || undefined,
      genres,
    };
  },

  async getChapters(slug: string): Promise<ScrapedChapter[]> {
    const { data } = await client.get(`${MP_API_BASE}/title_detail?title_id=${slug}`);
    const chapterList: { chapter?: Record<string, unknown> }[] =
      data?.successResult?.chapterList ?? [];

    const chapters: ScrapedChapter[] = [];

    for (const entry of chapterList) {
      const ch = entry.chapter;
      if (!ch) continue;
      const chapterId = Number(ch.id);
      const name = (ch.name as string) ?? "";
      const subTitle = (ch.subTitle as string) ?? "";

      if (!chapters.some((c) => c.number === chapterId)) {
        chapters.push({
          number: chapterId,
          title: [name, subTitle].filter(Boolean).join(" - ") || undefined,
          pages: [],
        });
      }
    }

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(slug: string, chapterSlug: string): Promise<string[]> {
    const chapterId = chapterSlug.replace(/^chapter-/, "");
    const { data } = await client.get(
      `${MP_API_BASE}/manga_viewer?chapter_id=${chapterId}&format=json&split=yes`
    );

    const pages: unknown[] = data?.successResult?.pages ?? [];
    const out: string[] = [];

    for (const page of pages) {
      const mangaPage = (page as { mangaPage?: Record<string, unknown> }).mangaPage;
      if (!mangaPage) continue;
      const imageUrl = mangaPage.imageUrl as string | undefined;
      const encryptionKey = (mangaPage.encryptionKey as string) ?? data?.successResult?.encryptionKey;
      if (imageUrl) {
        out.push(encryptionKey ? decryptMangaPlusImage(imageUrl, encryptionKey) : imageUrl);
      }
    }

    return out;
  },
};

// ============ NYX SCANS HOMEPAGE / LISTING HELPERS ============

export interface NyxHomepageData {
  featured: {
    title: string;
    slug: string;
    rating: number;
    description: string;
    genres: string[];
    coverUrl: string;
    source?: string;
    sourceUrl?: string;
  }[];
  popular: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    type: string;
    source?: string;
    sourceUrl?: string;
  }[];
  latestNovels: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    type: string;
    source?: string;
    sourceUrl?: string;
  }[];
  latestReleases: {
    title: string;
    slug: string;
    rating: number;
    coverUrl: string;
    status: string;
    type: string;
    chapters: { number: string; slug: string; time: string; isNew: boolean }[];
    source?: string;
    sourceUrl?: string;
  }[];
  mostPopular: {
    title: string;
    slug: string;
    genres: string[];
    type: string;
    source?: string;
    sourceUrl?: string;
  }[];
}

export async function scrapeNyxHomepage(): Promise<NyxHomepageData> {
  try {
    const { data } = await fetchWithRetry<string>("https://nyxscans.com");
    const $ = cheerio.load(data);

    const result: NyxHomepageData = {
      featured: [],
      popular: [],
      latestNovels: [],
      latestReleases: [],
      mostPopular: [],
    };

    const ADULT_RE = /(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi|mature|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i;

    function extractSeriesFromLink(el: any): { title: string; slug: string; coverUrl: string; rating: number; description: string; genres: string[] } | null {
      const href = $(el).attr("href") ?? "";
      if (!href.startsWith("/series/") || href.includes("chapter")) return null;
      const slug = href.replace("/series/", "").replace(/\/$/, "");
      if (!slug) return null;

      const $el = $(el);
      const title = $el.find("h2, h3, h4").first().text().trim()
        || $el.find("img").first().attr("alt")?.trim()
        || $el.attr("title")?.trim()
        || slug.replace(/-/g, " ");
      const coverUrl = $el.find("img").first().attr("src") ?? "";
      const allText = $el.text();
      const ratingMatch = allText.match(/(\d+(?:\.\d+)?)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      const description = $el.find("p").first().text().trim();
      const genres: string[] = [];

      if (ADULT_RE.test(title + " " + slug + " " + description)) return null;
      return { title, slug, coverUrl, rating, description, genres };
    }

    // Featured — from the swiper slider
    $("a[href^='/series/']").each((_, el) => {
      const item = extractSeriesFromLink(el);
      if (item && item.title && !result.featured.find((f) => f.slug === item.slug)) {
        result.featured.push(item);
      }
    });
    result.featured = result.featured.filter((f) => f.description.length > 50).slice(0, 6);

    // Popular Today section
    const bodyText = $("body").text();
    if (bodyText.includes("Popular Today") || bodyText.includes("Popular")) {
      $("a[href^='/series/']").each((_, el) => {
        const item = extractSeriesFromLink(el);
        if (item && item.title && !result.featured.find((f) => f.slug === item.slug) && !result.popular.find((p) => p.slug === item.slug)) {
          const isNovel = /novel/i.test(item.title);
          result.popular.push({ ...item, type: isNovel ? "Novel" : "Manhwa" });
        }
      });
      result.popular = result.popular.slice(0, 12);
    }

    // If no popular found from section, fill from featured overflow
    if (result.popular.length === 0) {
      result.featured.slice(0, 6).forEach((f) => {
        const isNovel = /novel/i.test(f.title);
        result.popular.push({ ...f, type: isNovel ? "Novel" : "Manhwa" });
      });
    }

    // Latest releases — links that contain chapter- in the href
    $("a[href*='chapter-']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(/\/series\/(.+?)\/chapter-(.+)/);
      if (!match) return;
      const slug = match[1];
      const chapterNum = match[2];
      if (isAdultContent(slug)) return;

      const rawTime = $(el).find("span").last().text().trim() || "";
      const time = rawTime.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();

      const item = result.latestReleases.find((r) => r.slug === slug);
      if (item) {
        if (!item.chapters.find((c) => c.number === chapterNum)) {
          item.chapters.push({ number: chapterNum, slug: `chapter-${chapterNum}`, time: time || "New", isNew: /new/i.test(time) });
        }
      } else {
        const title = slug.replace(/-/g, " ");
        result.latestReleases.push({
          title,
          slug,
          rating: 0,
          coverUrl: "",
          status: "Ongoing",
          type: "Manhwa",
          chapters: [{ number: chapterNum, slug: `chapter-${chapterNum}`, time: time || "New", isNew: /new/i.test(time) }],
        });
      }
    });
    result.latestReleases = result.latestReleases.slice(0, 30);

    return result;
  } catch (error) {
    console.error("[scrapeNyxHomepage] Failed:", error instanceof Error ? error.message : String(error));
    return { featured: [], popular: [], latestNovels: [], latestReleases: [], mostPopular: [] };
  }
}

export interface NyxComicsListing {
  series: { title: string; slug: string; coverUrl: string; rating: number; type: string }[];
  totalPages: number;
}

export async function scrapeNyxComics(): Promise<NyxComicsListing> {
  try {
    const { data } = await fetchWithRetry<string>("https://nyxscans.com/comics");
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
      const isNovel = /novel/i.test(allText);
      if (/(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi|mature|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i.test(allText)) return;
      const type = isNovel ? "Novel" : "Manhwa";
      if (title && slug && !seriesList.find((s) => s.slug === slug)) {
        seriesList.push({ title, slug, coverUrl, rating, type });
      }
    });

    return { series: seriesList, totalPages: 1 };
  } catch {
    return { series: [], totalPages: 0 };
  }
}

// ============ ASURA SCANS HOMEPAGE ============
export async function scrapeAsuraHomepage(): Promise<NyxHomepageData> {
  try {
    const { data } = await fetchWithRetry<string>("https://asurascans.com");
    const $ = cheerio.load(data);

    const result: NyxHomepageData = {
      featured: [],
      popular: [],
      latestNovels: [],
      latestReleases: [],
      mostPopular: [],
    };

    $("a[href*='/comics/'], a[href*='/series/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("chapter")) return;
      const slugMatch = href.match(/\/(?:comics|series)\/([^/]+)/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      const title = $(el).find("h2, h3, [class*='title'], .font-bold").first().text().trim() || slug.replace(/-/g, " ");
      const coverUrl = $(el).find("img").first().attr("src") ?? "";
      const allText = $(el).text();
      const ratingMatch = allText.match(/(\d+(\.\d+)?)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      const desc = $(el).find("p, [class*='desc'], .line-clamp").first().text().trim();
      const isNovel = /novel/i.test(allText);

      if (isAdultContent(title + " " + slug + " " + desc)) return;

      if (title && desc.length > 50 && !result.featured.find((f) => f.slug === slug)) {
        result.featured.push({
          title, slug, rating, description: desc, genres: [], coverUrl,
          source: "asurascans", sourceUrl: "https://asurascans.com",
        });
      } else if (title && !result.popular.find((p) => p.slug === slug)) {
        result.popular.push({
          title, slug, rating, coverUrl, type: isNovel ? "Novel" : "Manhwa",
          source: "asurascans", sourceUrl: "https://asurascans.com",
        });
      }
    });

    result.featured = result.featured.slice(0, 6);
    result.popular = result.popular.slice(0, 12);

    return result;
  } catch (error) {
    console.error("[scrapeAsuraHomepage] Failed:", error instanceof Error ? error.message : String(error));
    return { featured: [], popular: [], latestNovels: [], latestReleases: [], mostPopular: [] };
  }
}

// ============ COMIX.TO HOMEPAGE ============
export async function scrapeComixHomepage(): Promise<NyxHomepageData> {
  try {
    const { data } = await fetchWithRetry<string>("https://comix.to/home");
    const $ = cheerio.load(data);

    const result: NyxHomepageData = {
      featured: [],
      popular: [],
      latestNovels: [],
      latestReleases: [],
      mostPopular: [],
    };

    const ADULT_RE = /(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi|mature|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i;

    $("a[href*='/series/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("chapter")) return;
      const slug = href.replace(/^\/series\//, "").replace(/\/$/, "");
      if (!slug) return;
      const title = $(el).find("h2, h3, h4").first().text().trim()
        || $(el).find("img").first().attr("alt")?.trim()
        || slug.replace(/-/g, " ");
      const coverUrl = $(el).find("img").first().attr("src") ?? "";
      const allText = $(el).text();
      const ratingMatch = allText.match(/(\d+(?:\.\d+)?)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      const desc = $(el).find("p").first().text().trim();
      const isNovel = /novel/i.test(allText);

      if (ADULT_RE.test(title + " " + slug + " " + desc)) return;

      if (title && !result.featured.find((f) => f.slug === slug)) {
        result.featured.push({
          title, slug, rating, description: desc, genres: [], coverUrl,
          source: "comixto", sourceUrl: "https://comix.to",
        });
      } else if (title && !result.popular.find((p) => p.slug === slug)) {
        result.popular.push({
          title, slug, rating, coverUrl, type: isNovel ? "Novel" : "Manhwa",
          source: "comixto", sourceUrl: "https://comix.to",
        });
      }
    });

    result.featured = result.featured.slice(0, 6);
    result.popular = result.popular.slice(0, 12);

    return result;
  } catch (error) {
    console.error("[scrapeComixHomepage] Failed:", error instanceof Error ? error.message : String(error));
    return { featured: [], popular: [], latestNovels: [], latestReleases: [], mostPopular: [] };
  }
}

// ============ HIVETOONS HOMEPAGE ============
export async function scrapeHivetoonsHomepage(): Promise<NyxHomepageData> {
  try {
    const { data } = await fetchWithRetry<string>("https://hivetoons.org");
    const $ = cheerio.load(data);

    const result: NyxHomepageData = {
      featured: [],
      popular: [],
      latestNovels: [],
      latestReleases: [],
      mostPopular: [],
    };

    const ADULT_RE = /(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi|mature|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i;

    $("a[href*='/series/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("chapter")) return;
      const slug = href.replace(/^\/series\//, "").replace(/\/$/, "");
      if (!slug) return;
      const title = $(el).find("h2, h3, h4").first().text().trim()
        || $(el).find("img").first().attr("alt")?.trim()
        || slug.replace(/-/g, " ");
      const coverUrl = $(el).find("img").first().attr("src") ?? "";
      const allText = $(el).text();
      const ratingMatch = allText.match(/(\d+(?:\.\d+)?)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      const desc = $(el).find("p").first().text().trim();
      const isNovel = /novel/i.test(allText);

      if (ADULT_RE.test(title + " " + slug + " " + desc)) return;

      if (title && !result.featured.find((f) => f.slug === slug)) {
        result.featured.push({
          title, slug, rating, description: desc, genres: [], coverUrl,
          source: "hivetoons", sourceUrl: "https://hivetoons.org",
        });
      } else if (title && !result.popular.find((p) => p.slug === slug)) {
        result.popular.push({
          title, slug, rating, coverUrl, type: isNovel ? "Novel" : "Manhwa",
          source: "hivetoons", sourceUrl: "https://hivetoons.org",
        });
      }
    });

    result.featured = result.featured.slice(0, 6);
    result.popular = result.popular.slice(0, 12);

    return result;
  } catch (error) {
    console.error("[scrapeHivetoonsHomepage] Failed:", error instanceof Error ? error.message : String(error));
    return { featured: [], popular: [], latestNovels: [], latestReleases: [], mostPopular: [] };
  }
}

// ============ MANTA (manta.net) HOMEPAGE ============
export async function scrapeMantaHomepage(): Promise<NyxHomepageData> {
  const result: NyxHomepageData = {
    featured: [], popular: [], latestNovels: [], latestReleases: [], mostPopular: [],
  };

  try {
    const { data: html } = await fetchWithRetry<string>("https://manta.net/en");
    const $ = cheerio.load(html);

    // Manta is an SPA — extract buildId to try the Next.js data API
    const buildMatch = html.match(/"buildId":"([^"]+)"/);
    const buildId = buildMatch?.[1];

    if (buildId) {
      // Try the comics listing page data endpoint
      for (const page of ["/comics", "/en/comics"]) {
        try {
          const { data: pageData } = await client.get(
            `https://manta.net/_next/data/${buildId}${page}.json`,
            { timeout: 15000 },
          );
          const comics: Array<{ slug?: string; title?: string; name?: string; thumbnail?: string; coverImage?: string; description?: string }> =
            pageData?.pageProps?.comics ?? pageData?.pageProps?.items ?? pageData?.pageProps?.seriesList ?? pageData?.pageProps?.homeData?.comics ?? [];
          for (const c of comics.slice(0, 20)) {
            const slug = c.slug ?? "";
            const title = c.title ?? c.name ?? slug.replace(/-/g, " ");
            if (!slug || !title) continue;
            result.featured.push({ title, slug, coverUrl: c.thumbnail ?? c.coverImage ?? "", rating: 0, description: c.description ?? "", genres: [] });
          }
          if (result.featured.length > 0) break;
        } catch { /* try next path */ }
      }
    }

    // Fallback: extract from any /comics/ links in SSR HTML
    $("a[href*='/comics/'], a[href*='/title/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("chapter")) return;
      const slugMatch = href.match(/\/(?:comics|title)\/([^/?]+)/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      const title = $(el).find("img").first().attr("alt")
        ?? $(el).find("h2, h3, h4").first().text().trim()
        ?? slug.replace(/-/g, " ");
      const coverUrl = $(el).find("img").first().attr("src") ?? "";
      if (title && !result.featured.find((f) => f.slug === slug) && !result.popular.find((p) => p.slug === slug)) {
        result.popular.push({ title, slug, coverUrl, rating: 0, type: "Manhwa" });
      }
    });
  } catch (error) {
    console.error("[scrapeMantaHomepage] Failed:", error instanceof Error ? error.message : String(error));
  }

  result.featured = result.featured.slice(0, 6);
  result.popular = result.popular.slice(0, 12);
  return result;
}

// ============ AGGREGATED HOMEPAGE ============
export async function scrapeAllHomepage(): Promise<NyxHomepageData> {
  const results = await Promise.allSettled([
    scrapeNyxHomepage(),
    scrapeAsuraHomepage(),
    scrapeComixHomepage(),
    scrapeHivetoonsHomepage(),
    scrapeMantaHomepage(),
  ]);

  const merged: NyxHomepageData = {
    featured: [],
    popular: [],
    latestNovels: [],
    latestReleases: [],
    mostPopular: [],
  };

  for (const r of results) {
    if (r.status === "fulfilled") {
      merged.featured.push(...r.value.featured);
      merged.popular.push(...r.value.popular);
      merged.latestNovels.push(...r.value.latestNovels);
      merged.latestReleases.push(...r.value.latestReleases);
      merged.mostPopular.push(...r.value.mostPopular);
    } else {
      console.error("[scrapeAllHomepage] Scraper failed:", r.reason);
    }
  }

  // Deduplicate by slug and filter adult content
  const dedup = <T extends { slug: string; title?: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (seen.has(item.slug)) return false;
      if (isAdultContent((item.title ?? "") + " " + item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
  };

  merged.featured = dedup(merged.featured).slice(0, 6);
  merged.popular = dedup(merged.popular).slice(0, 20);
  merged.latestReleases = dedup(merged.latestReleases).slice(0, 30);

  // Populate latestNovels from popular items where type is "Novel"
  if (merged.latestNovels.length === 0) {
    merged.latestNovels = merged.popular
      .filter((p) => p.type === "Novel")
      .slice(0, 12);
  }

  // Populate mostPopular from popular items sorted by rating (descending)
  if (merged.mostPopular.length === 0) {
    merged.mostPopular = merged.popular
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        genres: [],
        type: p.type,
        source: p.source,
        sourceUrl: p.sourceUrl,
      }));
  }

  return merged;
}

// ============ COMIX.TO ============
export const comixToScraper: Scraper = {
  id: "comixto",
  name: "Comix",
  baseUrl: "https://comix.to",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr("content")?.replace(/ - Comix$/i, "").trim()
      ?? $("h1").first().text().trim()
      ?? slug.replace(/-/g, " ");
    const description = $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
    const coverUrl = $('meta[property="og:image"]').attr("content") ?? "";

    let rating = undefined;
    const ratingText = $('[class*="rating"], .text-star, .flex.items-center.gap-1 span').first().text().trim();
    if (ratingText) rating = parseFloat(ratingText);

    const status = $('[class*="status"], .capitalize').first().text().trim() || "ongoing";

    const author = $('[class*="author"], a[href*="author"]').first().text().trim() || "";
    const artist = $('[class*="artist"], a[href*="artist"]').first().text().trim() || "";

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
      source: "comixto",
      sourceUrl: this.baseUrl,
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
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    const pagesSet = new Set<string>();

    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("featured") && !src.includes("cover") && !src.includes("logo") && !src.includes("icon")) {
        pagesSet.add(src);
      }
    });

    const urls = html.match(/https?:\/\/[^"'\s<>]+(?:page-\d+|\d{4,})[^"'\s<>]*\.(?:webp|jpg|png|jpeg)/gi);
    if (urls) {
      for (const u of urls) pagesSet.add(u);
    }

    return naturalSortUrls(filterChapterPages([...pagesSet]));
  },
};

// ============ MANTA (manta.net) ============
export const mantaScraper: Scraper = {
  id: "manta",
  name: "Manta",
  baseUrl: "https://manta.net",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/en/comics/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr("content")?.replace(/ - Manta$/i, "").trim()
      ?? $("h1").first().text().trim()
      ?? slug.replace(/-/g, " ");
    const description = $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
    const coverUrl = $('meta[property="og:image"]').attr("content") ?? "";

    let rating = undefined;
    const ratingText = $('[class*="rating"], .text-star, .flex.items-center.gap-1 span').first().text().trim();
    if (ratingText) rating = parseFloat(ratingText);

    const status = $('[class*="status"], .capitalize').first().text().trim() || "ongoing";
    const author = $('[class*="author"], a[href*="author"]').first().text().trim() || "";
    const artist = $('[class*="artist"], a[href*="artist"]').first().text().trim() || "";

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
      source: "manta",
      sourceUrl: this.baseUrl,
    };
  },

  async getChapters(slug: string): Promise<ScrapedChapter[]> {
    const url = `${this.baseUrl}/en/comics/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const chapters: ScrapedChapter[] = [];
    $("a[href*='/comics/'], a[href*='/series/']").each((_, el) => {
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
    const html = typeof data === "string" ? data : "";
    const $ = cheerio.load(html);

    const pagesSet = new Set<string>();

    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        pagesSet.add(src);
      }
    });

    const urls = html.match(/https?:\/\/[^"'\s<>]+(?:page-\d+|\d{4,})[^"'\s<>]*\.(?:webp|jpg|png|jpeg)/gi);
    if (urls) {
      for (const u of urls) pagesSet.add(u);
    }

    return naturalSortUrls(filterChapterPages([...pagesSet]));
  },
};

// ============ HIVETOONS.ORG ============
export const hivetoonsScraper: Scraper = {
  id: "hivetoons",
  name: "HiveToons",
  baseUrl: "https://hivetoons.org",

  async getSeries(slug: string): Promise<ScrapedSeries> {
    const url = `${this.baseUrl}/series/${slug}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const title = $('meta[property="og:title"]').attr("content")?.replace(/ - HiveToons$/i, "").trim()
      ?? $("h1").first().text().trim()
      ?? slug.replace(/-/g, " ");
    const description = $('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content") ?? "";
    const coverUrl = $('meta[property="og:image"]').attr("content") ?? "";

    let rating = undefined;
    const ratingText = $('[class*="rating"], .text-star, .flex.items-center.gap-1 span').first().text().trim();
    if (ratingText) rating = parseFloat(ratingText);

    const status = $('[class*="status"], .capitalize').first().text().trim() || "ongoing";

    const author = $('[class*="author"], a[href*="author"]').first().text().trim() || "";
    const artist = $('[class*="artist"], a[href*="artist"]').first().text().trim() || "";

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
      source: "hivetoons",
      sourceUrl: this.baseUrl,
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
    $("img[class*='page'], .reader-area img, #reader img, .chapter-content img, img[alt*='page']").each((_, el) => {
      const src = $(el).attr("src");
      if (src) pages.push(src);
    });
    return naturalSortUrls(filterChapterPages(pages));
  },
};