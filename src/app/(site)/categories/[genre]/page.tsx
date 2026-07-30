"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ComicGrid, type ComicCardData } from "@/components/ComicCard";

export default function CategoryGenrePage() {
  const params = useParams();
  const genre = params.genre as string;

  const [series, setSeries] = useState<ComicCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const genreName = genre
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/categories/${genre}?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(Array.isArray(data.series) ? data.series : []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [genre, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            &larr; Categories
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">{genreName}</h1>
        </div>
      </div>

      <ComicGrid
        comics={series}
        loading={loading}
        showRating
        showSource
        columns="2 sm:3 md:4 lg:5 xl:6"
      />

      {!loading && totalPages > 1 && (
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
    </div>
  );
}
