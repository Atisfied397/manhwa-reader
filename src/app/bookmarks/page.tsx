"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Bookmark {
  slug: string;
  title: string;
  coverUrl: string;
  source?: string;
  addedAt: string;
}

export default function BookmarksPage() {
  const { user, signInWithGoogle } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    // Load bookmarks from localStorage
    const saved = localStorage.getItem("bookmarks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookmarks(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBookmarks([]);
      }
    }
    setLoading(false);
  }, [user]);

  const removeBookmark = (slug: string) => {
    const updated = bookmarks.filter((b) => b.slug !== slug);
    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
  };

  const clearAll = () => {
    setBookmarks([]);
    localStorage.removeItem("bookmarks");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20">
            <svg
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">Bookmarks</h1>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Sign in to save your favorite series and keep track of what
            you&apos;re reading.
          </p>
          <button
            onClick={signInWithGoogle}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign In with Google
          </button>
          <Link
            href="/"
            className="mt-6 text-sm text-primary hover:text-primary-hover"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
        {bookmarks.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-card" />
              <div className="mt-2 h-4 w-3/4 rounded bg-card" />
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            No bookmarks yet. Browse comics and start bookmarking!
          </p>
          <Link
            href="/browse"
            className="text-sm text-primary hover:text-primary-hover"
          >
            Browse Comics &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.slug}
              className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:bg-card-hover"
            >
              <Link
                href={`/series/${bookmark.slug}?source=${bookmark.source || "nyx"}`}
                className="flex-1"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {bookmark.coverUrl ? (
                    <img
                      src={bookmark.coverUrl}
                      alt={bookmark.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                      📖
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                    {bookmark.title}
                  </h3>
                </div>
              </Link>
              <button
                onClick={() => removeBookmark(bookmark.slug)}
                className="p-2 text-center text-xs text-muted-foreground hover:text-red-400"
              >
                Remove Bookmark
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
