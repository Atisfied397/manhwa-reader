"use client";

import { use, useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import DownloadButton from "@/components/DownloadButton";
import { getChapterLocalPages } from "@/lib/download-manager";

interface ReaderPageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ReaderPageInner params={params} />
    </Suspense>
  );
}

function ReaderPageInner({ params }: ReaderPageProps) {
  const { slug, chapter } = use(params);
  const chapterNum = chapter.replace("chapter-", "");
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [chapterList, setChapterList] = useState<
    { number: number; slug: string }[]
  >([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [imageFit, setImageFit] = useState<"contain" | "cover" | "width">(
    "contain",
  );
  const PAGES_PER_BATCH = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [visiblePages, setVisiblePages] = useState(PAGES_PER_BATCH);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const visiblePagesRef = useRef(visiblePages);
  useEffect(() => { visiblePagesRef.current = visiblePages; }, [visiblePages]);
  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch chapter pages - try local first, then API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setPages([]);
    setCurrentPage(1);

    // Try loading from local storage first (native app)
    getChapterLocalPages(slug, chapter).then((localPages) => {
      if (localPages && localPages.length > 0) {
        setPages(localPages);
        setVisiblePages(PAGES_PER_BATCH);
        setLoading(false);
        return;
      }

      // Fall back to API
      fetch(
        `/api/scrape/pages?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setPages(data.pages || []);
            setVisiblePages(PAGES_PER_BATCH);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load chapter pages");
          setLoading(false);
        });
    }).catch(() => {
      // Fall back to API if local check fails
      fetch(
        `/api/scrape/pages?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setPages(data.pages || []);
            setVisiblePages(PAGES_PER_BATCH);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load chapter pages");
          setLoading(false);
        });
    });
  }, [slug, chapter]);

  // Fetch series info for title and chapter list
  useEffect(() => {
    fetch(`/api/scrape?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.series) {
          setSeriesTitle(data.series.title || "");
          setCoverUrl(data.series.coverUrl || "");
        }
        if (data.chapters) {
          setChapterList(
            data.chapters.map((ch: { number: number; slug?: string }) => ({
              number: ch.number,
              slug: ch.slug || `chapter-${ch.number}`,
            })),
          );
        }
      })
      .catch(() => {});
  }, [slug]);

  const titleSlug = slug.replace(/-/g, " ");
  const prevChapter =
    parseFloat(chapterNum) > 1 ? `chapter-${parseFloat(chapterNum) - 1}` : null;
  const nextChapter = `chapter-${parseFloat(chapterNum) + 1}`;
  const displayTitle = seriesTitle || titleSlug;

  const goToNext = useCallback(() => {
    const nextUrl = `/reader/${slug}/${nextChapter}`;
    window.location.href = nextUrl;
  }, [slug, nextChapter]);

  const goToPrev = useCallback(() => {
    if (!prevChapter) return;
    const prevUrl = `/reader/${slug}/${prevChapter}`;
    window.location.href = prevUrl;
  }, [slug, prevChapter]);

  // Keyboard navigation
  useEffect(() => {
    if (pages.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't interfere with typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pages, goToNext, goToPrev]);

  // Preload next/prev chapter pages
  useEffect(() => {
    if (chapterList.length === 0) return;

    const currentIndex = chapterList.findIndex(
      (ch) => ch.number === parseFloat(chapterNum),
    );
    const next = chapterList[currentIndex + 1];
    const prev = chapterList[currentIndex - 1];

    if (next) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = `/reader/${slug}/${next.slug}`;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
    if (prev) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = `/reader/${slug}/${prev.slug}`;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [chapterList, chapterNum, slug]);

  // Progressive page loading via Intersection Observer
  useEffect(() => {
    if (pages.length === 0 || visiblePagesRef.current >= pages.length) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          setLoadingMore(true);
          setTimeout(() => {
            setVisiblePages((prev) => {
              const next = Math.min(prev + PAGES_PER_BATCH, pages.length);
              visiblePagesRef.current = next;
              return next;
            });
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }, 50);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pages]);

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

  const imageFitClass = {
    contain: "object-contain",
    cover: "object-cover",
    width: "object-fill",
  }[imageFit];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Series info header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="h-[80px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-card">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
                📖
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-white/80">
              {displayTitle}
            </h2>
            <h1 className="text-lg font-bold text-white">
              Chapter {chapterNum}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded bg-[#2563eb] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Comic
              </span>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {pages.length}
              </span>
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <DownloadButton
              seriesSlug={slug}
              seriesTitle={displayTitle}
              seriesCoverUrl={coverUrl}
              chapterSlug={chapter}
              chapterNumber={parseFloat(chapterNum)}
              pageUrls={pages}
              compact
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {prevChapter ? (
            <Link
              href={`/reader/${slug}/${prevChapter}`}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
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
              Prev
            </Link>
          ) : (
            <div className="w-[116px]" />
          )}
          <Link
            href={`/series/${slug}`}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Series
          </Link>
          <Link
            href={`/reader/${slug}/${nextChapter}`}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Next
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

        {/* Chapter dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowChapterDropdown(!showChapterDropdown)}
            className="flex w-full items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
          >
            <span>
              Chapter <strong>{chapterNum}</strong>
            </span>
            <svg
              className={`h-4 w-4 transition-transform ${showChapterDropdown ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
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
                    ch.number === parseFloat(chapterNum)
                      ? "bg-primary/20 text-primary"
                      : "text-foreground"
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Configuration
            <svg
              className={`h-3 w-3 transition-transform ${showConfig ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded text-white/70 transition-colors hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Configuration panel */}
        {showConfig && (
          <div className="mb-6 rounded-lg bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                Reading mode: {readingMode === "vertical" ? "Vertical scroll" : "Horizontal scroll"}
              </span>
              <select
                value={readingMode}
                onChange={(e) => setReadingMode(e.target.value as "vertical" | "horizontal")}
                className="rounded-md bg-card px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Image fit</span>
              <select
                value={imageFit}
                onChange={(e) => setImageFit(e.target.value as "contain" | "cover" | "width")}
                className="rounded-md bg-card px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="width">Fill width</option>
              </select>
            </div>
            <div className="text-xs text-white/40">
               Tip: Use ← → arrow keys to navigate between pages. Pages load in batches as you scroll.
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full animate-pulse bg-neutral-900"
                style={{ height: `${400 + (i % 3) * 100}px` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="mb-4 text-sm text-white/60">{error}</p>
            <Link
              href={`/series/${slug}`}
              className="text-sm text-primary hover:text-primary-hover"
            >
              Back to Series
            </Link>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="mb-4 text-sm text-white/60">
              No pages available for this chapter
            </p>
            <Link
              href={`/series/${slug}`}
              className="text-sm text-primary hover:text-primary-hover"
            >
              Back to Series
            </Link>
          </div>
        ) : readingMode === "horizontal" ? (
          <div
            ref={pagesContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-px-4 gap-4 pb-4"
          >
            {pages.slice(0, visiblePages).map((url, i) => (
              <div
                key={i}
                className="shrink-0 snap-start w-[calc(100vw-32px)] max-w-4xl"
              >
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className={`w-full ${imageFitClass} h-[calc(100vh-120px)]`}
                  draggable={false}
                  onLoad={() => setCurrentPage(i + 1)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "";
                    target.alt = `Page ${i + 1} — failed to load`;
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={pagesContainerRef}
            className="flex flex-col items-center"
          >
            {pages.slice(0, visiblePages).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Page ${i + 1}`}
                className={`w-full ${imageFitClass}`}
                draggable={false}
                onLoad={() => setCurrentPage(i + 1)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "";
                  target.alt = `Page ${i + 1} — failed to load`;
                }}
              />
            ))}
          </div>
        )}

        {/* Progressive loading sentinel */}
        {visiblePages < pages.length && (
          <div ref={sentinelRef} className="py-8 text-center">
            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    style={{ strokeDasharray: "32, 100" }}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading more pages...
              </div>
            ) : (
              <span className="text-xs text-white/30">
                Scroll to load more ({pages.length - visiblePages} remaining)
              </span>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between gap-4 pb-8">
          {prevChapter ? (
            <Link
              href={`/reader/${slug}/${prevChapter}`}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
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
      </div>
    </div>
  );
}
