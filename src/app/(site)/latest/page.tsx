"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ReleaseChapter {
  number: number;
  slug: string;
  time: string;
  isNew: boolean;
}
interface LatestRelease {
  title: string;
  slug: string;
  rating: number;
  coverUrl: string;
  status: string;
  type: string;
  chapters: ReleaseChapter[];
}

const ITEMS_PER_PAGE = 10;

function LatestReleasesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const [releases, setReleases] = useState<LatestRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [allReleases, setAllReleases] = useState<LatestRelease[]>([]);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        const all = data.latestReleases || [];
        setAllReleases(all);
        setReleases(all.slice(0, ITEMS_PER_PAGE));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allReleases.length === 0) return;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReleases(allReleases.slice(start, end));
  }, [page, allReleases]);

  const totalPages = Math.max(1, Math.ceil(allReleases.length / ITEMS_PER_PAGE));

  const goToPage = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    router.push(`/latest?page=${clamped}`);
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Latest Releases</h1>
        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
          Hot
        </span>
        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
          New
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex gap-3 rounded-lg bg-card p-3"
            >
              <div className="h-[80px] w-[56px] rounded bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : releases.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 7V3m8 4V3m-9 9h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            No releases available at the moment. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <div
              key={release.slug}
              className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-card-hover"
            >
              <Link
                href={`/series/${release.slug}`}
                className="h-[80px] w-[56px] shrink-0 overflow-hidden rounded"
              >
                {release.coverUrl ? (
                  <img
                    src={release.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted text-lg text-muted-foreground">
                    📖
                  </div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/series/${release.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {release.title}
                  </Link>
                  <span className="flex items-center gap-1 text-xs text-star">
                    <svg
                      className="h-3 w-3 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {release.rating}
                  </span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary uppercase">
                    {release.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {release.status}
                  </span>
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
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[10px] font-medium text-primary">
                          New
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded bg-card text-xs text-foreground disabled:opacity-50"
          >
            &lt;
          </button>
          {getPageNumbers().map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded text-xs transition-colors ${
                  p === page
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded bg-card text-xs text-foreground disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}

export default function LatestPage() {
  return (
    <Suspense>
      <LatestReleasesList />
    </Suspense>
  );
}
