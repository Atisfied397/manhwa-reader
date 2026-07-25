"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CategorySeriesEntry {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  type: string;
  source: string;
  sourceUrl: string;
}

const SOURCES = ["all", "comixto", "asurascans", "nyx", "hivetoons"] as const;

export default function CategoryGenrePage() {
  const params = useParams();
  const genre = params.genre as string;

  const [series, setSeries] = useState<CategorySeriesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSource, setCurrentSource] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const genreName = genre.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    setLoading(true);
    const src = currentSource === "all" ? "" : currentSource;
    fetch(`/api/categories/${genre}?source=${src}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(Array.isArray(data.series) ? data.series : []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [genre, currentSource, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary">
            &larr; Categories
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">{genreName}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => { setCurrentSource(s); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentSource === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-card-hover"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-card" />
              <div className="mt-2 h-4 w-3/4 rounded bg-card" />
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-lg text-muted-foreground">No series found in this category.</p>
          <Link href="/categories" className="text-sm text-primary hover:underline">
            Browse all categories
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {series.map((item) => (
              <Link
                key={`${item.source}-${item.slug}`}
                href={`/series/${item.slug}?source=${item.source}`}
                className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:bg-card-hover"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">📖</div>
                  )}
                  {item.rating > 0 && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-star">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {item.rating}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2.5">
                  <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground uppercase">{item.source}</p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md bg-card px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md bg-card px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
