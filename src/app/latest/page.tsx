"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReleaseChapter {
  number: string; slug: string; time: string; isNew: boolean;
}
interface LatestRelease {
  title: string; slug: string; rating: number; coverUrl: string; status: string; type: string; chapters: ReleaseChapter[];
}

export default function LatestPage() {
  const [releases, setReleases] = useState<LatestRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((data) => {
        setReleases(data.latestReleases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Latest Releases</h1>
        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">Hot</span>
        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">New</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 rounded-lg bg-card p-3">
              <div className="h-[80px] w-[56px] rounded bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
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
      )}

      <div className="mt-8 flex items-center justify-center gap-2">
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
    </div>
  );
}
