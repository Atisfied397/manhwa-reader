"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getDownloadedChapters,
  deleteChapter,
  formatFileSize,
  type DownloadedChapter,
} from "@/lib/download-manager";

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadedChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    try {
      // @ts-expect-error - Capacitor runtime check
      const native = window?.Capacitor?.isNativePlatform?.() === true;
      setIsNative(native);
      if (native) {
        getDownloadedChapters().then((d) => {
          setDownloads(d.sort((a, b) => b.downloadedAt - a.downloadedAt));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (seriesSlug: string, chapterSlug: string) => {
    await deleteChapter(seriesSlug, chapterSlug);
    setDownloads((prev) =>
      prev.filter(
        (d) => !(d.seriesSlug === seriesSlug && d.chapterSlug === chapterSlug),
      ),
    );
  };

  const groupedBySeries = downloads.reduce(
    (acc, d) => {
      if (!acc[d.seriesSlug]) {
        acc[d.seriesSlug] = {
          seriesTitle: d.seriesTitle,
          seriesCoverUrl: d.seriesCoverUrl,
          seriesSlug: d.seriesSlug,
          chapters: [],
        };
      }
      acc[d.seriesSlug].chapters.push(d);
      return acc;
    },
    {} as Record<
      string,
      {
        seriesTitle: string;
        seriesCoverUrl: string;
        seriesSlug: string;
        chapters: DownloadedChapter[];
      }
    >,
  );

  const totalSize = downloads.reduce((sum, d) => sum + d.totalSize, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isNative) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">📱</div>
          <h1 className="mb-2 text-2xl font-bold">Downloads</h1>
          <p className="mb-6 text-muted-foreground">
            Chapter downloads are only available in the native Android app.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Downloads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {downloads.length} chapter{downloads.length !== 1 ? "s" : ""} downloaded
            {totalSize > 0 && ` · ${formatFileSize(totalSize)}`}
          </p>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">📥</div>
          <h2 className="mb-2 text-xl font-semibold">No Downloads Yet</h2>
          <p className="mb-6 text-muted-foreground">
            Open a chapter in the reader and tap the download button to save it for offline reading.
          </p>
          <Link
            href="/browse"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Browse Comics
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(groupedBySeries).map((series) => (
            <div
              key={series.seriesSlug}
              className="rounded-xl border border-border bg-card p-4"
            >
              <Link
                href={`/series/${series.seriesSlug}`}
                className="mb-4 flex items-center gap-4 transition-opacity hover:opacity-80"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {series.seriesCoverUrl ? (
                    <img
                      src={series.seriesCoverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl text-muted-foreground">
                      📖
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{series.seriesTitle}</h2>
                  <p className="text-sm text-muted-foreground">
                    {series.chapters.length} chapter{series.chapters.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>

              <div className="space-y-2">
                {series.chapters
                  .sort((a, b) => a.chapterNumber - b.chapterNumber)
                  .map((ch) => (
                    <div
                      key={ch.chapterSlug}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <Link
                        href={`/reader/${ch.seriesSlug}/${ch.chapterSlug}`}
                        className="flex-1 text-sm font-medium hover:text-primary"
                      >
                        Chapter {ch.chapterNumber}
                      </Link>
                      <span className="mr-4 text-xs text-muted-foreground">
                        {formatFileSize(ch.totalSize)}
                      </span>
                      <button
                        onClick={() =>
                          handleDelete(ch.seriesSlug, ch.chapterSlug)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete download"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
