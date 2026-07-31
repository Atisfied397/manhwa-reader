"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DbSeries {
  id: number;
  title: string;
  slug: string;
  coverUrl: string;
  status: string;
  source: string;
  sortOrder: number;
  isFeatured: boolean;
  isHidden: boolean;
}

export default function AdminSeriesPage() {
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const fetchDbSeries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/series?q=${encodeURIComponent(search)}&limit=200`);
      const data = await res.json();
      setDbSeries(data.series || []);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/series?q=${encodeURIComponent(search)}&limit=200`)
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setDbSeries(data.series || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  const toggleField = async (id: number, field: "isFeatured" | "isHidden", value: boolean) => {
    setSaving(id);
    const item = dbSeries.find((s) => s.id === id);
    if (!item) return;
    await fetch(`/api/admin/series/${item.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setDbSeries((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
    setSaving(null);
  };

  const updateSortOrder = async (id: number, sortOrder: number) => {
    setSaving(id);
    const item = dbSeries.find((s) => s.id === id);
    if (!item) return;
    await fetch(`/api/admin/series/${item.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    });
    setDbSeries((prev) => prev.map((s) => s.id === id ? { ...s, sortOrder } : s));
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Series Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {dbSeries.length} series
          </span>
          <Link href="/admin/import" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            + Import New
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search series..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <button onClick={fetchDbSeries} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          Search
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {dbSeries.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/series/${s.slug}`} className="text-sm font-medium text-white hover:text-primary truncate block" title={s.title}>
                    {s.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{s.source}</span>
                    <span className="text-xs text-muted-foreground">&middot;</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      s.status === "completed" ? "bg-green-500/20 text-green-400" :
                      s.status === "hiatus" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>{s.status}</span>
                  </div>
                </div>
                <Link
                  href={`/admin/series/${s.slug}`}
                  className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs text-muted-foreground hover:text-white"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Sort</span>
                  <input
                    type="number"
                    value={s.sortOrder}
                    onChange={(e) => updateSortOrder(s.id, parseInt(e.target.value) || 0)}
                    className="w-14 rounded border border-border bg-background px-2 py-1 text-xs text-foreground text-center"
                    title="Sort order"
                  />
                </div>
                <button
                  onClick={() => toggleField(s.id, "isFeatured", !s.isFeatured)}
                  disabled={saving === s.id}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    s.isFeatured ? "bg-primary text-white" : "bg-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  Featured
                </button>
                <button
                  onClick={() => toggleField(s.id, "isHidden", !s.isHidden)}
                  disabled={saving === s.id}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    s.isHidden ? "bg-yellow-500 text-black" : "bg-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  {s.isHidden ? "Hidden" : "Visible"}
                </button>
              </div>
            </div>
          ))}
          {dbSeries.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground mb-3">No series imported yet</p>
              <Link href="/admin/import" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover">
                Import Series
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
