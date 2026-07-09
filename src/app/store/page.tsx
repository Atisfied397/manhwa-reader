"use client";

import Link from "next/link";

export default function StorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-white">Store</h1>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Purchase premium content, exclusive merchandise, and support your favorite series.
        </p>
        <div className="rounded-lg border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">Coming Soon</p>
        </div>
        <Link href="/" className="mt-6 text-sm text-primary hover:text-primary-hover">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
