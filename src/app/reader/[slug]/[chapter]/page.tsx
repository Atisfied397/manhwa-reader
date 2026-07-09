"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface ReaderPageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { slug, chapter } = use(params);
  const chapterNum = chapter.replace("chapter-", "");
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [chapterList, setChapterList] = useState<{ number: number; slug: string }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch chapter pages
  useEffect(() => {
    setLoading(true);
    setError("");
    setPages([]);
    fetch(`/api/scrape/pages?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter)}&source=nyx`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPages(data.pages || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load chapter pages");
        setLoading(false);
      });
  }, [slug, chapter]);

  // Fetch series info for title and chapter list
  useEffect(() => {
    fetch(`/api/scrape?slug=${encodeURIComponent(slug)}&source=nyx`)
      .then((r) => r.json())
      .then((data) => {
        if (data.series) {
          setSeriesTitle(data.series.title || "");
          setCoverUrl(data.series.coverUrl || "");
        }
        if (data.chapters) {
          setChapterList(
            data.chapters.map((ch: { number: number }) => ({
              number: ch.number,
              slug: `chapter-${ch.number}`,
            }))
          );
        }
      })
      .catch(() => {});
  }, [slug]);

  const titleSlug = slug.replace(/-/g, " ");
  const prevChapter = parseInt(chapterNum) > 1 ? `chapter-${parseInt(chapterNum) - 1}` : null;
  const nextChapter = `chapter-${parseInt(chapterNum) + 1}`;
  const displayTitle = seriesTitle || titleSlug;

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Series info header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="h-[80px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-card">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">📖</div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-white/80">{displayTitle}</h2>
            <h1 className="text-lg font-bold text-white">Chapter {chapterNum}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded bg-[#2563eb] px-2 py-0.5 text-[10px] font-bold text-white uppercase">Comic</span>
              <span className="rounded bg-[#0d9488] px-2 py-0.5 text-[10px] font-bold text-white">Free Chapter</span>
              <span className="text-xs text-muted-foreground">6 days ago</span>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {prevChapter ? (
            <Link
              href={`/reader/${slug}/${prevChapter}`}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={`/series/${slug}`}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <Link
            href={`/reader/${slug}/${nextChapter}`}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Report Issue */}
        <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9" />
          </svg>
          Report Issue
        </button>

        {/* Chapter dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowChapterDropdown(!showChapterDropdown)}
            className="flex w-full items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
          >
            <span>Chapter <strong>{chapterNum}</strong></span>
            <svg className={`h-4 w-4 transition-transform ${showChapterDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showChapterDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
              {chapterList.map((ch) => (
                <Link
                  key={ch.slug}
                  href={`/reader/${slug}/${ch.slug}`}
                  onClick={() => setShowChapterDropdown(false)}
                  className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-card-hover ${
                    ch.number === parseInt(chapterNum) ? "bg-primary/20 text-primary" : "text-foreground"
                  }`}
                >
                  Chapter {ch.number}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Configuration bar */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Configuration
            <svg className={`h-3 w-3 transition-transform ${showConfig ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>
        </div>

        {/* Configuration panel */}
        {showConfig && (
          <div className="mb-6 rounded-lg bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Reading mode: Vertical scroll</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full animate-pulse bg-neutral-900" style={{ height: `${400 + (i % 3) * 100}px` }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="mb-4 text-sm text-white/60">{error}</p>
            <Link href={`/series/${slug}`} className="text-sm text-primary hover:text-primary-hover">
              Back to Series
            </Link>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="mb-4 text-sm text-white/60">No pages available for this chapter</p>
            <Link href={`/series/${slug}`} className="text-sm text-primary hover:text-primary-hover">
              Back to Series
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {pages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Page ${i + 1}`}
                className="w-full object-contain"
                loading={i < 3 ? "eager" : "lazy"}
                draggable={false}
              />
            ))}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between gap-4 pb-8">
          {prevChapter ? (
            <Link
              href={`/reader/${slug}/${prevChapter}`}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev Chapter
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={`/reader/${slug}/${nextChapter}`}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Next Chapter
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
