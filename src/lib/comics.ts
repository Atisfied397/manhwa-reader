import { fallbackComics } from "@/lib/fallback";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function fuzzyMatch(queryWords: string[], haystack: string): boolean {
  const haystackWords = haystack.split(/\s+/).filter(Boolean);
  return queryWords.every((qw) => {
    if (haystack.includes(qw)) return true;
    return haystackWords.some((hw) => {
      if (hw.length <= 3) return hw === qw;
      const maxDist = hw.length <= 5 ? 1 : 2;
      return levenshtein(qw, hw) <= maxDist;
    });
  });
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/season\s*\d+/gi, "")
    .replace(/s\d+/gi, "")
    .replace(/(manhwa|webtoon|manga|novel)\s*$/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ComicItem {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  type: string;
  source?: string;
  sourceUrl?: string;
}

const SOURCE_PRIORITY: Record<string, number> = {
  nyx: 1,
  asurascans: 2,
  hivetoons: 3,
  comixto: 4,
  manta: 5,
};

function pickBest(entries: ComicItem[]): ComicItem {
  let best = entries[0];
  for (const e of entries.slice(1)) {
    const bestScore = (best.coverUrl ? 10 : 0) + Math.min(best.rating, 10) + (10 - (SOURCE_PRIORITY[best.source ?? ""] ?? 99));
    const eScore = (e.coverUrl ? 10 : 0) + Math.min(e.rating, 10) + (10 - (SOURCE_PRIORITY[e.source ?? ""] ?? 99));
    if (eScore > bestScore) best = e;
  }
  return best;
}

export async function getAllComics(): Promise<ComicItem[]> {
  try {
    const {
      scrapeNyxComics, scrapeNyxHomepage,
      scrapeAsuraHomepage, scrapeComixHomepage,
      scrapeHivetoonsHomepage, scrapeMantaHomepage,
    } = await import("@/lib/scraper");

    const results = await Promise.allSettled([
      scrapeNyxComics(),
      scrapeNyxHomepage(),
      scrapeAsuraHomepage(),
      scrapeComixHomepage(),
      scrapeHivetoonsHomepage(),
      scrapeMantaHomepage(),
    ]);

    const allComics: ComicItem[] = [];
    const seen = new Set<string>();

    function add(slug: string, title: string, coverUrl: string, rating: number, type: string, source?: string, sourceUrl?: string) {
      if (!slug || !title || seen.has(slug)) return;
      if (/(?:^|\s|\/|_|-)(?:adult|hentai|smut|ecchi|mature|18\+|xxx|porn(?:ographic)?|nsfw)(?:\s|\/|_|-|$)/i.test(title + " " + slug)) return;
      seen.add(slug);
      allComics.push({ title, slug, coverUrl, rating, type: type || "Manhwa", source, sourceUrl });
    }

    const nyxListing = results[0];
    if (nyxListing.status === "fulfilled") {
      for (const s of nyxListing.value.series) {
        add(s.slug, s.title, s.coverUrl, s.rating, s.type, "nyx", "https://nyxscans.com");
      }
    }

    for (let i = 1; i < results.length; i++) {
      const r = results[i];
      if (r.status !== "fulfilled") continue;
      const src = r.value as { featured?: { slug: string; title: string; coverUrl: string; rating: number; source?: string; sourceUrl?: string }[]; popular?: { slug: string; title: string; coverUrl: string; rating: number; type: string; source?: string; sourceUrl?: string }[]; latestNovels?: { slug: string; title: string; coverUrl: string; rating: number; type: string; source?: string; sourceUrl?: string }[]; latestReleases?: { slug: string; title: string; coverUrl: string; rating: number; type: string; source?: string; sourceUrl?: string; chapters?: { number: string; slug: string }[] }[]; mostPopular?: { slug: string; title: string; coverUrl: string; type: string; source?: string; sourceUrl?: string }[] };
      const sources = [
        { label: "nyx", url: "https://nyxscans.com" },
        { label: "asurascans", url: "https://asurascans.com" },
        { label: "comixto", url: "https://comix.to" },
        { label: "hivetoons", url: "https://hivetoons.org" },
        { label: "manta", url: "https://manta.net" },
      ];
      const srcInfo = sources[i - 1] || sources[0];

      for (const s of [...(src.featured || []), ...(src.popular || []), ...(src.latestNovels || []), ...(src.latestReleases || []), ...(src.mostPopular || [])]) {
        const item = s as Record<string, unknown>;
        add(item.slug as string, item.title as string, item.coverUrl as string, (item.rating as number) || 0, (item.type as string) || "Manhwa", srcInfo.label, srcInfo.url);
      }
    }

    // Also scrape first page of popular categories to enrich search
    try {
      const { scrapeComixGenrePage } = await import("@/lib/genre-scraper");
      const genreResults = await Promise.allSettled([
        scrapeComixGenrePage("action", 1),
        scrapeComixGenrePage("romance", 1),
        scrapeComixGenrePage("fantasy", 1),
      ]);
      for (const r of genreResults) {
        if (r.status === "fulfilled") {
          for (const s of r.value.series) {
            add(s.slug, s.title, s.coverUrl, s.rating, s.type, s.source, s.sourceUrl);
          }
        }
      }
    } catch { /* category enrich failed, not critical */ }

    const deduped: ComicItem[] = [];
    const grouped = new Map<string, ComicItem[]>();

    for (const c of allComics) {
      const key = normalizeTitle(c.title);
      if (!key) continue;
      let found = false;
      for (const [existingKey, group] of grouped) {
        if (levenshtein(key, existingKey) <= Math.max(1, Math.floor(Math.min(key.length, existingKey.length) * 0.3))) {
          group.push(c);
          found = true;
          break;
        }
      }
      if (!found) grouped.set(key, [c]);
    }

    for (const group of grouped.values()) {
      deduped.push(pickBest(group));
    }

    return deduped;
  } catch {
    return fallbackComics;
  }
}
