"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState } from "react";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Avatar({ src, name }: { src?: string | null; name?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "avatar"}
        className="h-28 w-28 rounded-full object-cover ring-2 ring-primary/30"
      />
    );
  }
  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/20 text-5xl font-bold text-primary">
      {name?.[0]?.toUpperCase() ?? "U"}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | null;
  copyable?: boolean;
}

function DetailRow({ label, value, copyable = false }: DetailRowProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground break-all">
          {value || "—"}
        </span>
        {copyable && value && (
          <button
            onClick={copy}
            type="button"
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card"
            aria-label={copied ? "Copied" : `Copy ${label}`}
            title={copied ? "Copied!" : `Copy ${label}`}
          >
            {copied ? "✓" : "📋"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, logout, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-48 rounded bg-card" />
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-card" />
            <div className="space-y-3">
              <div className="h-7 w-40 rounded bg-card" />
              <div className="h-5 w-56 rounded bg-card" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <svg
              className="h-12 w-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 12c2.67 0 8 1.34 8 4v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2c0-2.66 1.33-4 4-4.5V8a4 4 0 118 0v4.5c2.67.5 4 1.84 4 4.5z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Sign in to view and manage your profile, see your reading
              history, and access your bookmarks and downloads.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="text-sm text-primary hover:text-primary-hover"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user.displayName ?? user.email?.split("@")[0] ?? "Reader";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-6 text-center">
        <Avatar src={user.photoURL} name={displayName} />
        <div>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-star/20 px-2.5 py-0.5 text-xs font-medium text-star">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.19 6.88L12 17.77l-6.19 3.25L7 14.14 2 9.27z" />
                </svg>
                Administrator
              </span>
            )}
            {user.emailVerified ? (
              <span className="inline-flex items-center rounded-full bg-green-400/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                Email verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Email unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Account Details
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Display Name" value={user.displayName || displayName} />
          <DetailRow label="User ID" value={user.uid} copyable />
          <DetailRow label="Account Status" value={isAdmin ? "Admin" : "Standard"} />
          <DetailRow label="Member Since" value={formatDate(user.metadata?.creationTime)} />
          <DetailRow label="Last Signed In" value={formatDate(user.metadata?.lastSignInTime)} />
        </div>
      </div>

      {/* Library section */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Library
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/bookmarks"
            className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover hover:text-primary"
          >
            <svg
              className="h-4 w-4 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8L8.5 9.5 6 12V4z" />
            </svg>
            My Bookmarks
          </Link>
          <Link
            href="/downloads"
            className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover hover:text-primary"
          >
            <svg
              className="h-4 w-4 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            My Downloads
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-5">
        <span className="text-xs text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Site
          </Link>
          <button
            onClick={logout}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
