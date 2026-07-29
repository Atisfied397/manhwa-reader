"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Featured {
  title: string;
  slug: string;
  rating: number;
  description: string;
  genres: string[];
  coverUrl: string;
  altTitle?: string;
  source?: string;
  sourceUrl?: string;
}
interface PopularItem {
  title: string;
  slug: string;
  rating: number;
  coverUrl: string;
  type: string;
  source?: string;
  sourceUrl?: string;
}
interface ReleaseChapter {
  number: string;
  slug: string;
  time: string;
  isNew: boolean;
  isPinned?: boolean;
}
interface LatestRelease {
  title: string;
  slug: string;
  rating: number;
  coverUrl: string;
  status: string;
  type: string;
  chapters: ReleaseChapter[];
  source?: string;
  sourceUrl?: string;
}

const sourceColors: Record<string, { bg: string; text: string; label: string }> = {
  nyxscans: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Nyx Scans" },
  asurascans: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Asura Scans" },
  comixto: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Comix" },
  hivetoons: { bg: "bg-red-500/20", text: "text-red-400", label: "HiveToons" },
};

function SourceBadge({ source, sourceUrl }: { source?: string; sourceUrl?: string }) {
  if (!source) return null;
  const colors = sourceColors[source] ?? { bg: "bg-gray-500/20", text: "text-gray-400", label: source };

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (sourceUrl) window.open(sourceUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <span
      role={sourceUrl ? "link" : undefined}
      tabIndex={sourceUrl ? 0 : undefined}
      onClick={sourceUrl ? handleClick : undefined}
      onKeyDown={sourceUrl ? (e) => { if (e.key === "Enter") handleClick(e); } : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text} transition-opacity hover:opacity-80${sourceUrl ? " cursor-pointer" : ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {colors.label}
    </span>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [releases, setReleases] = useState<LatestRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showReportBanner, setShowReportBanner] = useState(true);
  const popularScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        setFeatured(data.featured || []);
        setPopular(data.popular || []);
        setReleases(data.latestReleases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const hero = featured[heroIndex];

  const scrollPopular = (direction: "left" | "right") => {
    if (popularScrollRef.current) {
      const scrollAmount = 300;
      popularScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse mb-8 h-[400px] w-full rounded-2xl bg-card" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-lg bg-card" />
                <div className="mt-2 h-4 w-3/4 rounded bg-card" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Carousel - Full Width */}
      {hero && (
        <div className="relative w-full overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            {hero.coverUrl ? (
              <img
                src={hero.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-card" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-4 py-12">
            <div className="max-w-2xl">
              <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
                {hero.title}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 rounded-full bg-star/20 px-3 py-1 text-sm font-bold text-star">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {hero.rating}
                </span>
                {hero.genres?.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {genre}
                  </span>
                ))}
                <SourceBadge source={hero.source} sourceUrl={hero.sourceUrl} />
              </div>

              {hero.description && (
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-white/70">
                  {hero.description}
                </p>
              )}

              <Link
                href={`/series/${hero.slug}?source=${hero.source || "nyx"}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Read Now
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Navigation Arrows */}
          {featured.length > 1 && (
            <>
              <button
                onClick={() =>
                  setHeroIndex(
                    (prev) => (prev - 1 + featured.length) % featured.length
                  )
                }
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setHeroIndex((prev) => (prev + 1) % featured.length)
                }
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
          {featured.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === heroIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Popular Today Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <svg
                className="h-5 w-5 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Popular Today
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollPopular("left")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => scrollPopular("right")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            ref={popularScrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
          >
            {popular.map((series) => (
              <Link
                key={series.slug}
                href={`/series/${series.slug}?source=${series.source || "nyx"}`}
                className="group w-[150px] shrink-0"
              >
                <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-card">
                  {series.coverUrl ? (
                    <img
                      src={series.coverUrl}
                      alt={series.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                      📖
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                  {series.title}
                </h3>
                <SourceBadge source={series.source} sourceUrl={series.sourceUrl} />
              </Link>
            ))}
          </div>
        </div>

        {/* Report Issue Banner - Dismissible */}
        {!showReportBanner && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Need Help or Found an Issue?</h3>
                <p className="text-sm text-muted-foreground">
                  Report bugs, payment issues, or other problems • Get rewards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportBanner(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                ✕
              </button>
              <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover">
                Report Issue
              </button>
            </div>
          </div>
        )}

        {/* Latest Novels Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Latest Novels
            </h2>
            <Link
              href="/novels"
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
            >
              View All
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {popular.filter((s) => s.type === "Novel").slice(0, 7).map((series) => (
              <Link
                key={`novel-${series.slug}`}
                href={`/series/${series.slug}?source=${series.source || "nyx"}`}
                className="group"
              >
                <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-card">
                  {series.coverUrl ? (
                    <img
                      src={series.coverUrl}
                      alt={series.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                      📖
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                  {series.title}
                </h3>
                <SourceBadge source={series.source} sourceUrl={series.sourceUrl} />
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Updates Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Latest Updates
            </h2>
            <Link
              href="/latest"
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
            >
              View All
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {releases.slice(0, 6).map((release) => (
              <div
                key={release.slug}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
              >
                <Link
                  href={`/series/${release.slug}?source=${release.source || "nyx"}`}
                  className="relative h-[120px] w-[85px] shrink-0 overflow-hidden rounded-lg"
                >
                  {release.coverUrl ? (
                    <img
                      src={release.coverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-2xl text-muted-foreground">
                      📖
                    </div>
                  )}
                  {release.chapters[0]?.isPinned && (
                    <div className="absolute bottom-0 left-0 flex items-center gap-1 bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                      </svg>
                      Pinned
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {release.type}
                    </span>
                    <SourceBadge source={release.source} sourceUrl={release.sourceUrl} />
                  </div>

                  <Link
                    href={`/series/${release.slug}?source=${release.source || "nyx"}`}
                    className="mb-1 text-lg font-bold text-white hover:text-primary"
                  >
                    {release.title}
                  </Link>

                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-star">
                      <svg
                        className="h-4 w-4 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {release.rating}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      {release.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {release.chapters.slice(0, 4).map((ch) => (
                      <Link
                        key={ch.slug}
                        href={`/reader/${release.slug}/${ch.slug}?source=${release.source || "nyx"}`}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <span className="flex items-center gap-2">
                          {ch.isPinned && (
                            <svg
                              className="h-4 w-4 text-primary"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                            </svg>
                          )}
                          <span
                            className={
                              ch.isPinned
                                ? "font-medium text-primary"
                                : "text-foreground"
                            }
                          >
                            Chapter {ch.number}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ch.isNew ? (
                            <span className="flex items-center gap-1 text-primary">
                              <svg
                                className="h-3 w-3"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              New
                            </span>
                          ) : (
                            ch.time
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <svg
                className="h-5 w-5 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              Most Popular
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popular.slice(0, 6).map((series, index) => (
              <Link
                key={`popular-${series.slug}`}
                href={`/series/${series.slug}?source=${series.source || "nyx"}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
              >
                <div className="relative h-[80px] w-[60px] shrink-0 overflow-hidden rounded-lg">
                  {series.coverUrl ? (
                    <img
                      src={series.coverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-2xl text-muted-foreground">
                      📖
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-white group-hover:text-primary">
                    {series.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {series.type && (
                      <span className="text-xs text-muted-foreground">
                        {series.type}
                      </span>
                    )}
                    <SourceBadge source={series.source} sourceUrl={series.sourceUrl} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse All Link */}
        <div className="flex justify-center">
          <Link
            href="/browse"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          >
            Browse All Comics
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
