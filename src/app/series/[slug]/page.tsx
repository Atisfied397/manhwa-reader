"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ChapterInfo {
  number: number;
  title?: string;
  slug: string;
  time?: string;
  comments?: number;
  likes?: number;
}

interface SeriesInfo {
  title: string;
  altTitle?: string;
  description?: string;
  coverUrl?: string;
  status?: string;
  rating?: number;
  author?: string;
  artist?: string;
  genres?: string[];
}

interface SimilarSeries {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  chapters: number;
  source?: string;
}

export default function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-12 text-center text-muted-foreground">Loading…</div>}>
      <SeriesPageInner params={params} />
    </Suspense>
  );
}

function SeriesPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "nyx";
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [similarSeries, setSimilarSeries] = useState<SimilarSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"chapters" | "synopsis" | "reviews">("chapters");
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const [showBookmarkNotice, setShowBookmarkNotice] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/scrape?slug=${encodeURIComponent(slug)}&source=${encodeURIComponent(source)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setSeries(data.series);
        setChapters(
          (data.chapters || []).map((ch: { number: number; title?: string; time?: string }) => ({
            number: ch.number,
            title: ch.title,
            slug: `chapter-${ch.number}`,
            time: ch.time || "",
            comments: 0,
            likes: 0,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load series data");
        setLoading(false);
      });
  }, [slug, source]);

  // Load similar series from homepage data
  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        const items: SimilarSeries[] = (data.popular || [])
          .filter((p: { slug: string }) => p.slug !== slug)
          .slice(0, 8)
          .map((p: { title: string; slug: string; coverUrl: string; rating: number; source?: string }) => ({
            title: p.title,
            slug: p.slug,
            coverUrl: p.coverUrl,
            rating: p.rating || 10,
            chapters: Math.floor(Math.random() * 60) + 10,
            source: p.source,
          }));
        setSimilarSeries(items);
      })
      .catch(() => {});
  }, [slug]);

  const filteredChapters = chapters
    .filter((ch) => {
      if (!chapterSearch) return true;
      const q = chapterSearch.toLowerCase();
      return `chapter ${ch.number}`.includes(q) || (ch.title || "").toLowerCase().includes(q);
    })
    .sort((a, b) => sortAsc ? a.number - b.number : b.number - a.number);

  const visibleChapters = showAllChapters ? filteredChapters : filteredChapters.slice(0, 30);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="animate-pulse flex flex-col gap-6 sm:flex-row">
          <div className="aspect-[3/4] w-full rounded-lg bg-card sm:w-[240px] xl:w-[270px]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-2/3 rounded bg-card" />
            <div className="h-4 w-1/3 rounded bg-card" />
            <div className="h-20 rounded bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12 text-center">
        <p className="text-muted-foreground">{error || "Series not found"}</p>
        <Link href="/browse" className="mt-4 inline-block text-sm text-primary hover:text-primary-hover">
          Browse all comics &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto my-6 max-w-[1400px] px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row lg:gap-5">

          {/* LEFT SIDEBAR */}
          <div className="flex w-full shrink-0 flex-col gap-3 rounded-lg px-2 sm:w-[240px] sm:p-0 md:sticky md:top-[76px] md:self-start xl:w-[270px]">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-card">
              {series.coverUrl ? (
                <img src={series.coverUrl} alt={series.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl text-muted-foreground">📖</div>
              )}
            </div>

            <div className="hidden sm:flex flex-col gap-2">
              <Link
                href={`/reader/${slug}/${chapters[chapters.length - 1]?.slug || "chapter-1"}?source=${source}`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#dc2626] font-bold text-white transition-colors hover:bg-[#b91c1c]"
              >
                {chapters.length > 0 ? "Read Chapter 1" : "No Chapters"}
              </Link>
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg font-bold transition-colors ${
                  bookmarked
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#2563eb]/20 text-[#60a5fa] hover:bg-[#2563eb]/30"
                }`}
              >
                <svg className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Bookmark
              </button>
            </div>

            {showBookmarkNotice && (
              <div className="hidden sm:block rounded-lg bg-card p-3 text-xs text-muted-foreground">
                <div className="flex items-start justify-between gap-2">
                  <p>Bookmark this series and we&apos;ll ping you when new chapters drop!</p>
                  <button onClick={() => setShowBookmarkNotice(false)} className="shrink-0 text-muted-foreground hover:text-foreground">✕</button>
                </div>
              </div>
            )}

            <button className="hidden sm:flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-card-hover">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9" />
              </svg>
              Report Issue
            </button>

            <div className="hidden sm:flex items-center gap-4 px-2">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-star" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-sm font-bold text-white">{series.rating || 10}</span>
                <span className="text-[11px] text-muted-foreground">Ratings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-sm font-bold text-white">652</span>
                <span className="text-[11px] text-muted-foreground">Favorites</span>
              </div>
            </div>

            {series.genres && series.genres.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2">
                {series.genres.map((genre) => (
                  <span key={genre} className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CENTER CONTENT */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 px-2 py-4 sm:px-3">
            {series.altTitle && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{series.altTitle}</p>
            )}
            <h1 className="text-2xl font-bold leading-tight text-white">{series.title}</h1>

            <div className="block sm:hidden">
              <Link
                href={`/reader/${slug}/${chapters[chapters.length - 1]?.slug || "chapter-1"}?source=${source}`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#dc2626] font-bold text-white"
              >
                {chapters.length > 0 ? "Read Chapter 1" : "No Chapters"}
              </Link>
            </div>

            <div className="h-px bg-white/10" />

            {/* Tabs */}
            <div className="flex gap-6 overflow-x-auto scrollbar-hide" role="tablist">
              <TabButton active={activeTab === "chapters"} onClick={() => setActiveTab("chapters")}>
                <svg className="mx-1 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Chapters ({chapters.length})
              </TabButton>
              <TabButton active={activeTab === "synopsis"} onClick={() => setActiveTab("synopsis")}>
                <svg className="mx-1 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Synopsis
              </TabButton>
              <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>
                <svg className="mx-1 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Reviews ({1})
              </TabButton>
            </div>

            {activeTab === "chapters" && (
              <div className="space-y-4">
                {/* Chapter search bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by chapter number or title..."
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortAsc ? "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" : "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"} />
                    </svg>
                  </button>
                </div>

                {/* Mark All as Read */}
                <button
                  onClick={() => setAllRead(!allRead)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-card-hover w-full"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${allRead ? "bg-primary" : "bg-muted"}`}>
                    {allRead && (
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Mark All as Read</p>
                    <p className="text-xs text-muted-foreground">Mark all chapters as read</p>
                  </div>
                </button>

                {/* Chapter list */}
                <div className="space-y-2">
                  {visibleChapters.map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/reader/${slug}/${ch.slug}?source=${source}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-card-hover"
                    >
                      <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {series.coverUrl ? (
                          <img src={series.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg text-muted-foreground">📖</span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-white">Chapter {ch.number}</span>
                        {ch.number === chapters[0]?.number ? (
                          <span className="mt-0.5 text-xs text-primary">New</span>
                        ) : ch.time ? (
                          <span className="mt-0.5 text-xs text-muted-foreground">{ch.time}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                        <span className="flex items-center gap-1 text-xs">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {ch.comments || 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {ch.likes || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredChapters.length > 30 && (
                  <button
                    onClick={() => setShowAllChapters(!showAllChapters)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/15"
                  >
                    <span>{showAllChapters ? "Show less" : `Show more (${filteredChapters.length - 30} more)`}</span>
                    <svg className={`h-3.5 w-3.5 transition-transform ${showAllChapters ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                )}
              </div>
            )}

            {activeTab === "synopsis" && series.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-sm leading-relaxed text-muted-foreground">{series.description}</p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="flex flex-col items-center py-16 text-center">
                <svg className="mb-4 h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Similar Series */}
          <div className="hidden shrink-0 flex-col gap-3 self-start md:sticky md:top-[76px] lg:flex lg:w-[240px] xl:w-[270px]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Similar Series</h3>
            <div className="space-y-3">
              {similarSeries.map((item) => (
                <Link
                  key={item.slug}
                  href={`/series/${item.slug}?source=${item.source || "nyx"}`}
                  className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-card-hover"
                >
                  <div className="h-[70px] w-[50px] shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg text-muted-foreground">📖</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-2 text-xs font-medium text-foreground">{item.title}</span>
                    <div className="mt-1 flex items-center gap-1">
                      <svg className="h-3 w-3 text-star" fill="currentColor" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-[10px] text-muted-foreground">{item.rating}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.chapters} ch</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      onClick={onClick}
      className={`relative flex items-center whitespace-nowrap px-3 py-1 text-sm transition-colors ${
        active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-1">{children}</div>
      {active && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />}
    </button>
  );
}
