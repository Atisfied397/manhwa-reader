"use client";

import { use } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

const mockPages = Array.from({ length: 12 }, (_, i) => ({
  url: `https://placehold.co/800x1200/1a1a2e/ffffff?text=Page ${i + 1}`,
  page: i + 1,
}));

export default function ReaderPage({ params }: { params: Promise<{ slug: string; chapter: string }> }) {
  const { slug, chapter } = use(params);
  const chapterNum = chapter.replace("chapter-", "");

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/series/${slug}`} className="flex items-center gap-1 text-primary transition-colors hover:text-primary-hover">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Series
        </Link>
        <span className="font-medium text-white">Chapter {chapterNum}</span>
      </div>

      <AdBanner format="leaderboard" className="mb-6" />

      <div className="flex flex-col items-center gap-2">
        {mockPages.map((page) => (
          <img
            key={page.page}
            src={page.url}
            alt={`Page ${page.page}`}
            className="w-full max-w-[800px] rounded-lg"
            loading="lazy"
          />
        ))}
      </div>

      <AdBanner format="leaderboard" className="mt-6" />

      <div className="mt-6 flex items-center justify-between gap-4">
        <Link
          href={`/reader/${slug}/${parseInt(chapterNum) > 1 ? `chapter-${parseInt(chapterNum) - 1}` : chapter}`}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          Previous
        </Link>
        <Link
          href={`/reader/${slug}/chapter-${parseInt(chapterNum) + 1}`}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Next
        </Link>
      </div>
    </div>
  );
}