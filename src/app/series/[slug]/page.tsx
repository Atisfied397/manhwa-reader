"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";

interface ChapterInfo {
  number: number;
  title?: string;
  slug: string;
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

export default function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"chapters" | "synopsis">("chapters");
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/scrape?slug=${encodeURIComponent(slug)}&source=nyx`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setSeries(data.series);
        setChapters(
          (data.chapters || []).map((ch: { number: number; title?: string }) => ({
            number: ch.number,
            title: ch.title,
            slug: `chapter-${ch.number}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load series data");
        setLoading(false);
      });
  }, [slug]);

  const visibleChapters = showAllChapters ? chapters : chapters.slice(0, 30);

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

            <div className="hidden sm:block">
              <div className="flex flex-col gap-2">
                <Link
                  href={`/reader/${slug}/${chapters[0]?.slug || "chapter-1"}`}
                  className="flex h-12 w-full items-center justify-center rounded bg-primary font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  {chapters.length > 0 ? "Read First Chapter" : "No Chapters"}
                </Link>
              </div>
            </div>

            <button className="flex h-12 w-full items-center justify-center gap-2 rounded bg-card text-muted-foreground transition-colors hover:bg-card-hover">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9" />
              </svg>
              Report Issue
            </button>

            {series.rating && (
              <div className="flex items-center justify-center gap-2 rounded bg-card/80 py-3">
                <svg className="h-6 w-6 text-star" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-4 text-star">{series.rating}</span>
                  <small className="text-[10px] leading-3 text-muted-foreground">Rating</small>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="h-px bg-white/10" />
              <InfoRow label="Status">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`relative inline-block h-2.5 w-2.5 rounded-full ${series.status === "ongoing" ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="text-xs text-foreground">{(series.status || "ONGOING").toUpperCase()}</span>
                </span>
              </InfoRow>
              {series.author && <InfoRow label="Author"><span className="text-xs text-foreground">{series.author}</span></InfoRow>}
              {series.artist && <InfoRow label="Artist"><span className="text-xs text-foreground">{series.artist}</span></InfoRow>}
              <InfoRow label="Chapters"><span className="text-xs text-foreground">{chapters.length}</span></InfoRow>
            </div>

            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
                href={`/reader/${slug}/${chapters[0]?.slug || "chapter-1"}`}
                className="flex h-12 w-full items-center justify-center rounded bg-primary font-bold text-white"
              >
                {chapters.length > 0 ? "Read First Chapter" : "No Chapters"}
              </Link>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex gap-6 overflow-x-auto scrollbar-hide" role="tablist">
              <TabButton active={activeTab === "chapters"} onClick={() => setActiveTab("chapters")}>
                <svg className="mx-1 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Chapters ({chapters.length})
              </TabButton>
              <TabButton active={activeTab === "synopsis"} onClick={() => setActiveTab("synopsis")}>
                <svg className="mx-1 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Synopsis
              </TabButton>
            </div>

            {activeTab === "chapters" && (
              <div className="space-y-4">
                <div className="mt-4 space-y-2">
                  {visibleChapters.map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/reader/${slug}/${ch.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] p-3 transition-colors hover:bg-white/[.06]"
                    >
                      <div className="flex aspect-[3/4] h-[60px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-card sm:h-[70px]">
                        {series.coverUrl ? (
                          <img src={series.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg text-muted-foreground">📖</span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-xs font-medium text-white sm:text-sm">Chapter {ch.number}</span>
                        {ch.title && <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{ch.title}</span>}
                      </div>
                      {ch.number === visibleChapters[0]?.number && (
                        <span className="flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 3.5-1.5 3.5 4 1.5 9-2.5 9z" /></svg>
                          New
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {chapters.length > 30 && (
                  <button
                    onClick={() => setShowAllChapters(!showAllChapters)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/15"
                  >
                    <span>{showAllChapters ? "Show less" : `Show more (${chapters.length - 30} more)`}</span>
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
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden shrink-0 flex-col gap-3 self-start md:sticky md:top-[76px] lg:flex lg:w-[240px] xl:w-[270px]">
            <div className="rounded-lg bg-white/[.06] p-4">
              <div className="flex items-center gap-4">
                <div className="h-full w-1 rounded-lg bg-primary" />
                <div>
                  <p className="text-sm font-medium text-white">Share</p>
                  <p className="text-xs text-muted-foreground">with your friends</p>
                </div>
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm text-white transition-colors hover:bg-primary-hover">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684z" /></svg>
                Share
              </button>
            </div>

            <div className="rounded-lg bg-white/[.06] p-4">
              <div className="flex items-center gap-4">
                <div className="h-full w-1 rounded-lg bg-[#5865F2]" />
                <div>
                  <p className="text-sm font-medium text-white">Join Our Socials</p>
                </div>
              </div>
              <a
                href="https://discord.gg/example"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-6 py-2 text-sm text-white transition-colors hover:bg-[#4752C4]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z" /></svg>
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      <div>{children}</div>
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
