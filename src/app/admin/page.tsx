"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalSeries: number;
  featuredSeries: number;
  hiddenSeries: number;
  totalChapters: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalSeries: 0, featuredSeries: 0, hiddenSeries: 0, totalChapters: 0, totalPages: 0 });
  const [recentSeries, setRecentSeries] = useState<{ id: number; title: string; slug: string; status: string; coverUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/series?limit=1000").then(r => r.json()),
    ]).then(([seriesData]) => {
      const s = seriesData.series || [];
      setStats({
        totalSeries: seriesData.total || s.length,
        featuredSeries: s.filter((x: { isFeatured: boolean }) => x.isFeatured).length,
        hiddenSeries: s.filter((x: { isHidden: boolean }) => x.isHidden).length,
        totalChapters: 0,
        totalPages: 0,
      });
      setRecentSeries(s.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/series" className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card-hover">
          <p className="text-sm text-muted-foreground">Total Series</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.totalSeries}</p>
        </Link>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Featured</p>
          <p className="mt-1 text-3xl font-bold text-primary">{stats.featuredSeries}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Hidden</p>
          <p className="mt-1 text-3xl font-bold text-yellow-500">{stats.hiddenSeries}</p>
        </div>
        <Link href="/admin/settings" className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card-hover">
          <p className="text-sm text-muted-foreground">Quick Actions</p>
          <p className="mt-1 text-lg font-bold text-white">Site Settings</p>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Series</h2>
          <Link href="/admin/series" className="text-sm text-primary hover:text-primary-hover">View All</Link>
        </div>
        <div className="space-y-2">
          {recentSeries.map((s) => (
            <Link
              key={s.id}
              href={`/admin/series/${s.slug}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-card-hover"
            >
              <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-muted">
                {s.coverUrl ? (
                  <img src={s.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.status}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                s.status === "completed" ? "bg-green-500/20 text-green-400" :
                s.status === "hiatus" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-blue-500/20 text-blue-400"
              }`}>
                {s.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
