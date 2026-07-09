"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SeriesCard from "@/components/SeriesCard";

interface Featured {
  title: string; slug: string; rating: number; description: string; genres: string[]; coverUrl: string;
}
interface PopularItem {
  title: string; slug: string; rating: number; coverUrl: string; type: string;
}
interface ReleaseChapter {
  number: string; slug: string; time: string; isNew: boolean;
}
interface LatestRelease {
  title: string; slug: string; rating: number; coverUrl: string; status: string; type: string; chapters: ReleaseChapter[];
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [releases, setReleases] = useState<LatestRelease[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const nextSlide = useCallback(() => {
    if (featured.length > 0) setCurrentSlide((prev) => (prev + 1) % featured.length);
  }, [featured.length]);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, featured.length]);

  return (
    <div>
      {/* Featured Hero Slider */}
      {featured.length > 0 && (
        <section className="relative mx-auto mt-0 max-w-7xl px-0">
          <div className="relative h-[420px] overflow-hidden md:h-[520px]">
            {featured.map((series, i) => (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className={`absolute inset-0 transition-opacity duration-500 ${i === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0a0a0f]/60 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                {series.coverUrl && (
                  <img src={series.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="relative z-20 flex h-full items-center">
                  <div className="max-w-2xl px-8 md:px-12">
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white md:text-4xl">{series.title}</h2>
                      <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-sm text-star">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        {series.rating}
                      </span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {series.genres.slice(0, 4).map((g) => (
                        <span key={g} className="rounded bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{g}</span>
                      ))}
                    </div>
                    <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-white/60">{series.description}</p>
                    <span className="inline-flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                      Read Now
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Today */}
      <section className="mx-auto mt-8 max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Popular Today</h2>
          <Link href="/browse" className="text-sm font-medium text-primary transition-colors hover:text-primary-hover">
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {popular.slice(0, 14).map((series) => (
            <SeriesCard
              key={series.slug}
              series={{
                title: series.title,
                slug: series.slug,
                rating: series.rating,
                coverUrl: series.coverUrl,
                status: series.type,
              }}
              size="sm"
            />
          ))}
        </div>
      </section>

      {/* Report Issue Section */}
      <section className="mx-auto mt-10 max-w-7xl px-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">Need Help or Found an Issue?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Report bugs, payment issues, or other problems &bull; Get rewards</p>
            </div>
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
              Report Issue
            </button>
          </div>
        </div>
      </section>

      {/* Latest Releases */}
      <section className="mx-auto mt-10 max-w-7xl px-4">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Latest Releases</h2>
          <div className="flex gap-2">
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">Hot</span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">New</span>
          </div>
          <div className="flex-1" />
          <Link href="/latest" className="text-sm font-medium text-primary transition-colors hover:text-primary-hover">
            View All &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {releases.slice(0, 10).map((release) => (
            <div
              key={release.slug}
              className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-card-hover"
            >
              <Link href={`/series/${release.slug}`} className="h-[80px] w-[56px] shrink-0 overflow-hidden rounded">
                {release.coverUrl ? (
                  <img src={release.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted text-lg text-muted-foreground">📖</div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                  <Link href={`/series/${release.slug}`} className="text-sm font-semibold text-foreground hover:text-primary">
                    {release.title}
                  </Link>
                  <span className="flex items-center gap-1 text-xs text-star">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    {release.rating}
                  </span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary uppercase">{release.type}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{release.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {release.chapters.slice(0, 4).map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/reader/${release.slug}/${ch.slug}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <span>Chapter {ch.number}</span>
                      {ch.isNew && (
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[10px] font-medium text-primary">New</span>
                      )}
                      {!ch.isNew && ch.time && (
                        <span className="text-muted-foreground">{ch.time}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-xs font-medium text-white">1</span>
          {[2, 3, 4, 5].map((page) => (
            <Link
              key={page}
              href={`/latest?page=${page}`}
              className="flex h-8 w-8 items-center justify-center rounded bg-card text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
            >
              {page}
            </Link>
          ))}
          <span className="text-xs text-muted-foreground">...</span>
          <Link
            href="/latest?page=18"
            className="flex h-8 w-8 items-center justify-center rounded bg-card text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          >
            18
          </Link>
        </div>
      </section>

      {/* Most Popular Sidebar */}
      <section className="mx-auto mt-10 mb-8 max-w-7xl px-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1" />
          <div className="w-full rounded-lg border border-border bg-card p-4 lg:w-[300px]">
            <h3 className="mb-3 text-sm font-bold text-white">Most Popular</h3>
            <div className="space-y-2">
              {popular.slice(0, 8).map((series, i) => (
                <Link
                  key={series.slug}
                  href={`/series/${series.slug}`}
                  className="flex items-center gap-3 rounded p-2 transition-colors hover:bg-card-hover"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-1 text-sm text-foreground">{series.title}</span>
                    <span className="text-[10px] text-muted-foreground">{series.type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
