"use client";

import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";

const DOWNLOADS_KEY = "chapter_downloads";

export interface DownloadedChapter {
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl: string;
  chapterSlug: string;
  chapterNumber: number;
  pages: string[];
  downloadedAt: number;
  totalSize: number;
}

export interface DownloadProgress {
  chapterSlug: string;
  currentPage: number;
  totalPages: number;
  percent: number;
}

export type DownloadStatus = "idle" | "downloading" | "downloaded" | "error";

function isNativePlatform(): boolean {
  try {
    // @ts-expect-error - Capacitor runtime check
    return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export async function getDownloadedChapters(): Promise<DownloadedChapter[]> {
  if (!isNativePlatform()) return [];
  const { value } = await Preferences.get({ key: DOWNLOADS_KEY });
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export async function isChapterDownloaded(
  seriesSlug: string,
  chapterSlug: string,
): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const downloads = await getDownloadedChapters();
  return downloads.some(
    (d) => d.seriesSlug === seriesSlug && d.chapterSlug === chapterSlug,
  );
}

export async function getChapterLocalPages(
  seriesSlug: string,
  chapterSlug: string,
): Promise<string[] | null> {
  if (!isNativePlatform()) return null;
  try {
    const contents = await Filesystem.readdir({
      directory: Directory.Data,
      path: `chapters/${seriesSlug}/${chapterSlug}`,
    });
    const imageFiles = contents.files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.name.replace(/\D/g, "")) || 0;
        return numA - numB;
      });

    const urls: string[] = [];
    for (const file of imageFiles) {
      const fileInfo = await Filesystem.getUri({
        directory: Directory.Data,
        path: `chapters/${seriesSlug}/${chapterSlug}/${file.name}`,
      });
      urls.push(fileInfo.uri);
    }
    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}

export async function downloadChapter(
  seriesSlug: string,
  seriesTitle: string,
  seriesCoverUrl: string,
  chapterSlug: string,
  chapterNumber: number,
  pageUrls: string[],
  onProgress?: (progress: DownloadProgress) => void,
): Promise<DownloadedChapter> {
  if (!isNativePlatform()) {
    throw new Error("Downloads are only available in the native app");
  }

  const dirPath = `chapters/${seriesSlug}/${chapterSlug}`;
  let totalSize = 0;

  for (let i = 0; i < pageUrls.length; i++) {
    const url = pageUrls[i];
    const filename = `page-${String(i + 1).padStart(3, "0")}.${url.split(".").pop()?.split("?")[0] || "jpg"}`;

    onProgress?.({
      chapterSlug,
      currentPage: i + 1,
      totalPages: pageUrls.length,
      percent: Math.round(((i + 1) / pageUrls.length) * 100),
    });

    try {
      const result = await FileTransfer.downloadFile({
        url,
        path: `${dirPath}/${filename}`,
        progress: false,
      });
      totalSize += result.size || 0;
    } catch {
      // Retry once
      try {
        await FileTransfer.downloadFile({
          url,
          path: `${dirPath}/${filename}`,
          progress: false,
        });
      } catch {
        // Skip failed page
      }
    }
  }

  const downloadedChapter: DownloadedChapter = {
    seriesSlug,
    seriesTitle,
    seriesCoverUrl,
    chapterSlug,
    chapterNumber,
    pages: pageUrls,
    downloadedAt: Date.now(),
    totalSize,
  };

  const downloads = await getDownloadedChapters();
  const existingIndex = downloads.findIndex(
    (d) => d.seriesSlug === seriesSlug && d.chapterSlug === chapterSlug,
  );
  if (existingIndex >= 0) {
    downloads[existingIndex] = downloadedChapter;
  } else {
    downloads.push(downloadedChapter);
  }
  await Preferences.set({
    key: DOWNLOADS_KEY,
    value: JSON.stringify(downloads),
  });

  return downloadedChapter;
}

export async function deleteChapter(
  seriesSlug: string,
  chapterSlug: string,
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await Filesystem.rmdir({
      directory: Directory.Data,
      path: `chapters/${seriesSlug}/${chapterSlug}`,
      recursive: true,
    });
  } catch {
    // Ignore if directory doesn't exist
  }

  const downloads = await getDownloadedChapters();
  const filtered = downloads.filter(
    (d) => !(d.seriesSlug === seriesSlug && d.chapterSlug === chapterSlug),
  );
  await Preferences.set({
    key: DOWNLOADS_KEY,
    value: JSON.stringify(filtered),
  });
}

export async function getDownloadedChaptersForSeries(
  seriesSlug: string,
): Promise<DownloadedChapter[]> {
  const downloads = await getDownloadedChapters();
  return downloads.filter((d) => d.seriesSlug === seriesSlug);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
