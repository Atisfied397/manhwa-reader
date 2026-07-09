"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ComicItem {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  type: string;
}

export default function BrowsePage() {
  const [comics, setComics] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comics")
      .then((r) => r.json())
      .then((data) => {
        setComics(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Comics</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-card" />
              <div className="mt-2 h-4 w-3/4 rounded bg-card" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {comics.map((comic) => (
            <Link
              key={comic.slug}
              href={`/series/${comic.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:bg-card-hover"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {comic.coverUrl ? (
                  <img
                    src={comic.coverUrl}
                    alt={comic.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">📖</div>
                )}
                {comic.rating > 0 && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-star">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    {comic.rating}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-2.5">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                  {comic.title}
                </h3>
                <p className="text-[11px] text-muted-foreground uppercase">{comic.type}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
