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

export default function NovelsPage() {
  const [novels, setNovels] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comics")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNovels(list.filter((s: ComicItem) => s.title.toLowerCase().includes("[novel]") || s.type === "Novel"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Novels</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-card" />
              <div className="mt-2 h-4 w-3/4 rounded bg-card" />
            </div>
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {novels.map((novel) => (
            <Link
              key={novel.slug}
              href={`/series/${novel.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:bg-card-hover"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {novel.coverUrl ? (
                  <img src={novel.coverUrl} alt={novel.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">📖</div>
                )}
                {novel.rating > 0 && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-star">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    {novel.rating}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-2.5">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
                  {novel.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No novels available.</p>
      )}
    </div>
  );
}
