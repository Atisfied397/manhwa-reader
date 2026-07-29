import { scrapeSiteGenres, scrapeGenrePage, isAdultContent, type CategorySeriesEntry } from "./genre-scraper";
import { getAllComics, type ComicItem } from "./comics";

const ADULT_SLUGS = new Set(["adult", "hentai", "smut", "ecchi", "mature", "18+", "xxx", "pornographic", "nsfw"]);

function isAdult(slug: string): boolean {
  for (const a of ADULT_SLUGS) {
    if (slug.includes(a)) return true;
  }
  return false;
}

const CANONICAL_MAP: Record<string, string> = {
  action: "Action",
  adventure: "Adventure",
  comedy: "Comedy",
  drama: "Drama",
  fantasy: "Fantasy",
  horror: "Horror",
  mystery: "Mystery",
  romance: "Romance",
  "sci-fi": "Sci-Fi",
  scifi: "Sci-Fi",
  "slice-of-life": "Slice of Life",
  sliceoflife: "Slice of Life",
  thriller: "Thriller",
  psychological: "Psychological",
  historical: "Historical",
  "martial-arts": "Martial Arts",
  martialarts: "Martial Arts",
  isekai: "Isekai",
  harem: "Harem",
  "school-life": "School Life",
  schoollife: "School Life",
  sports: "Sports",
  supernatural: "Supernatural",
  tragedy: "Tragedy",
  crime: "Crime",
  medical: "Medical",
  mecha: "Mecha",
  wuxia: "Wuxia",
  superhero: "Superhero",
  shounen: "Shounen",
  seinen: "Seinen",
  shoujo: "Shoujo",
  josei: "Josei",
  "boys-love": "Boys Love",
  boyslove: "Boys Love",
  "girls-love": "Girls Love",
  girslove: "Girls Love",
  "action-fantasy": "Action Fantasy",
  actionfantasy: "Action Fantasy",
  reincarnation: "Reincarnation",
  regression: "Regression",
  system: "System",
  apocalypse: "Apocalypse",
  survival: "Survival",
  webtoon: "Webtoon",
  "magical-girls": "Magical Girls",
  magicalgirls: "Magical Girls",
  philosophical: "Philosophical",
  "super-power": "Super Power",
  superpower: "Super Power",
  murim: "Murim",
  cultivation: "Cultivation",
  "over-powered": "Over Powered",
  overpowered: "Over Powered",
  revenge: "Revenge",
  "time-travel": "Time Travel",
  timetravel: "Time Travel",
  game: "Game",
  dungeon: "Dungeon",
  monster: "Monster",
  necromancer: "Necromancer",
  villain: "Villain",
  hero: "Hero",
  rebirth: "Rebirth",
  return: "Return",
  "virtual-world": "Virtual World",
  virtualworld: "Virtual World",
};

function normalizeGenreName(slug: string): string {
  return CANONICAL_MAP[slug.toLowerCase()] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export { isAdult, normalizeGenreName, ADULT_SLUGS };

export interface CategoryInfo {
  slug: string;
  name: string;
  count: number;
  sources: string[];
  sampleCovers: string[];
}

function dedup<T extends { slug: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

export async function scrapeAllGenresFromComics(): Promise<Map<string, ComicItem[]>> {
  const comics = await getAllComics();
  const genreMap = new Map<string, ComicItem[]>();

  for (const c of comics) {
    const key = normalizeGenreName(c.type === "Novel" ? "novel" : c.type);
    if (!genreMap.has(key)) genreMap.set(key, []);
    genreMap.get(key)!.push(c);
  }

  return genreMap;
}

// In-memory cache
let cachedGenres: CategoryInfo[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const GENRE_COVERS: Record<string, string[]> = {
  Action: ["/genre-placeholder.svg"],
  Adventure: ["/genre-placeholder.svg"],
  Comedy: ["/genre-placeholder.svg"],
  Drama: ["/genre-placeholder.svg"],
  Fantasy: ["/genre-placeholder.svg"],
  Romance: ["/genre-placeholder.svg"],
  "Slice of Life": ["/genre-placeholder.svg"],
  Thriller: ["/genre-placeholder.svg"],
  Horror: ["/genre-placeholder.svg"],
  Mystery: ["/genre-placeholder.svg"],
  "Sci-Fi": ["/genre-placeholder.svg"],
  Psychological: ["/genre-placeholder.svg"],
  Historical: ["/genre-placeholder.svg"],
  "Martial Arts": ["/genre-placeholder.svg"],
  Isekai: ["/genre-placeholder.svg"],
};

export async function getAllCategories(): Promise<CategoryInfo[]> {
  if (cachedGenres && Date.now() - cacheTime < CACHE_TTL) return cachedGenres;

  const allGenreMeta = new Map<string, { count: number; sources: Set<string>; sampleCovers: string[] }>();

  for (const site of ["comixto", "asurascans"] as const) {
    try {
      const siteGenres = await scrapeSiteGenres(site);
      for (const g of siteGenres) {
        if (isAdult(g.slug)) continue;
        const canon = normalizeGenreName(g.slug);
        if (!allGenreMeta.has(canon)) {
          allGenreMeta.set(canon, { count: 0, sources: new Set(), sampleCovers: [] });
        }
        const entry = allGenreMeta.get(canon)!;
        entry.count += Math.max(1, g.count);
        entry.sources.add(site);
      }
    } catch { /* skip failed sites */ }
  }

  const existingComics = await getAllComics();
  for (const c of existingComics) {
    if (isAdultContent(c.title + " " + c.slug)) continue;
    for (const [name, data] of allGenreMeta) {
      if (data.sampleCovers.length >= 4) continue;
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      if (
        (c.slug && c.slug.includes(slug)) ||
        (c.title && c.title.toLowerCase().includes(name.toLowerCase()))
      ) {
        if (c.coverUrl && !data.sampleCovers.includes(c.coverUrl)) {
          data.sampleCovers.push(c.coverUrl);
        }
      }
    }
  }

  const result: CategoryInfo[] = [];
  for (const [name, data] of allGenreMeta) {
    if (isAdult(name.toLowerCase()) || isAdultContent(name)) continue;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    result.push({
      slug,
      name,
      count: data.count,
      sources: [...data.sources],
      sampleCovers: data.sampleCovers.length > 0 ? data.sampleCovers.slice(0, 4) : (GENRE_COVERS[name] ?? []),
    });
  }

  result.sort((a, b) => {
    const aKnown = !!GENRE_COVERS[a.name];
    const bKnown = !!GENRE_COVERS[b.name];
    if (aKnown && !bKnown) return -1;
    if (!aKnown && bKnown) return 1;
    return a.name.localeCompare(b.name);
  });

  cachedGenres = result;
  cacheTime = Date.now();
  return result;
}

export async function getCategoryGenreSeries(
  genreSlug: string,
  source?: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ series: CategorySeriesEntry[]; totalPages: number; currentPage: number }> {
  const allSeries: CategorySeriesEntry[] = [];

  const sources = source ? [source] : ["comixto", "asurascans", "nyx", "hivetoons"];

  for (const site of sources) {
    try {
      const result = await scrapeGenrePage(site, genreSlug, page);
      allSeries.push(...result.series);
    } catch { /* skip */ }
  }

  const merged = dedup(allSeries);
  const totalPages = Math.max(1, Math.ceil(merged.length / perPage));
  const start = (page - 1) * perPage;
  const paged = merged.slice(start, start + perPage);

  return { series: paged, totalPages, currentPage: page };
}
