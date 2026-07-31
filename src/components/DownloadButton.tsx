"use client";

import { useState, useEffect } from "react";
import {
  downloadChapter,
  deleteChapter,
  isChapterDownloaded,
  type DownloadProgress,
  type DownloadStatus,
} from "@/lib/download-manager";

interface DownloadButtonProps {
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl: string;
  chapterSlug: string;
  chapterNumber: number;
  pageUrls: string[];
  compact?: boolean;
}

export default function DownloadButton({
  seriesSlug,
  seriesTitle,
  seriesCoverUrl,
  chapterSlug,
  chapterNumber,
  pageUrls,
  compact = false,
}: DownloadButtonProps) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [isNative] = useState(() => {
    try {
      // @ts-expect-error - Capacitor runtime check
      return typeof window !== "undefined" && window?.Capacitor?.isNativePlatform?.() === true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isNative) return;
    isChapterDownloaded(seriesSlug, chapterSlug).then((downloaded) => {
      if (downloaded) setStatus("downloaded");
    });
  }, [seriesSlug, chapterSlug, isNative]);

  if (!isNative) return null;

  const handleDownload = async () => {
    if (status === "downloaded") {
      await deleteChapter(seriesSlug, chapterSlug);
      setStatus("idle");
      return;
    }

    setStatus("downloading");
    setProgress(null);

    try {
      let urls = pageUrls;
      if (!urls || urls.length === 0) {
        // Fetch page URLs from API
        const res = await fetch(
          `/api/scrape/pages?slug=${encodeURIComponent(seriesSlug)}&chapter=${encodeURIComponent(chapterSlug)}`,
        );
        const data = await res.json();
        if (data.error || !data.pages || data.pages.length === 0) {
          throw new Error("Failed to fetch chapter pages");
        }
        urls = data.pages;
      }

      await downloadChapter(
        seriesSlug,
        seriesTitle,
        seriesCoverUrl,
        chapterSlug,
        chapterNumber,
        urls,
        setProgress,
      );
      setStatus("downloaded");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } finally {
      setProgress(null);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={status === "downloading"}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-50"
        title={status === "downloaded" ? "Remove download" : "Download chapter"}
      >
        {status === "downloading" ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ strokeDasharray: "32, 100" }} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : status === "downloaded" ? (
          <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={status === "downloading"}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        status === "downloaded"
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : status === "error"
            ? "bg-red-500/20 text-red-400"
            : "bg-white/10 text-white hover:bg-white/20"
      } disabled:opacity-50`}
    >
      {status === "downloading" ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ strokeDasharray: "32, 100" }} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {progress ? `${progress.percent}%` : "Downloading..."}
        </>
      ) : status === "downloaded" ? (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          Downloaded
        </>
      ) : status === "error" ? (
        "Failed - Retry"
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </>
      )}
    </button>
  );
}
