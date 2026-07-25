"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function BookmarksPage() {
  const { user, signInWithGoogle } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20">
            <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">Bookmarks</h1>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Sign in to save your favorite series and keep track of what you&apos;re reading.
          </p>
          <button
            onClick={signInWithGoogle}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign In with Google
          </button>
          <Link href="/" className="mt-6 text-sm text-primary hover:text-primary-hover">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Bookmarks</h1>
      <div className="flex flex-col items-center py-16 text-center">
        <svg className="mb-4 h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="text-sm text-muted-foreground">No bookmarks yet. Browse comics and start bookmarking!</p>
        <Link href="/browse" className="mt-4 text-sm text-primary hover:text-primary-hover">
          Browse Comics &rarr;
        </Link>
      </div>
    </div>
  );
}
