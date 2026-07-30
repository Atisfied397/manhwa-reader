"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface ChapterItem {
  id: number;
  number: number;
  title: string;
  slug: string;
  pageCount: number;
  sortOrder: number;
  isHidden: boolean;
}

interface SeriesInfo {
  id: number;
  title: string;
  slug: string;
}

function ChaptersContent() {
  const searchParams = useSearchParams();
  const seriesSlug = searchParams.get("series") ?? "";
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [selectedSeries, setSelectedSeries] = useState(seriesSlug);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/series?limit=500").then(r => r.json()).then(d => setSeriesList(d.series || []));
  }, []);

  const fetchChapters = useCallback(async () => {
    if (!selectedSeries) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chapters?series=${selectedSeries}`);
      const data = await res.json();
      setChapters(data.chapters || []);
    } catch {}
    setLoading(false);
  }, [selectedSeries]);

  useEffect(() => { if (selectedSeries) fetchChapters(); }, [fetchChapters]);

  const moveChapter = async (id: number, direction: "up" | "down") => {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const other = direction === "up" ? chapters[idx - 1] : chapters[idx + 1];
    if (!other) return;

    const newChapters = [...chapters];
    const tempOrder = newChapters[idx].sortOrder;
    newChapters[idx] = { ...newChapters[idx], sortOrder: other.sortOrder };
    newChapters[direction === "up" ? idx - 1 : idx + 1] = { ...other, sortOrder: tempOrder };
    newChapters.sort((a, b) => a.sortOrder - b.sortOrder);
    setChapters(newChapters);

    await fetch("/api/admin/chapters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [
        { id: newChapters[idx].id, sortOrder: newChapters[idx].sortOrder },
        { id: other.id, sortOrder: tempOrder },
      ]}),
    });
  };

  const toggleHidden = async (id: number) => {
    setSaving(id);
    const ch = chapters.find((c) => c.id === id);
    if (!ch) return;
    const newHidden = !ch.isHidden;
    await fetch("/api/admin/chapters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [{ id, sortOrder: ch.sortOrder, isHidden: newHidden }] }),
    });
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, isHidden: newHidden } : c));
    setSaving(null);
  };

  const updateSortOrder = async (id: number, sortOrder: number) => {
    setSaving(id);
    const ch = chapters.find((c) => c.id === id);
    if (!ch) return;
    await fetch("/api/admin/chapters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [{ id, sortOrder }] }),
    });
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, sortOrder } : c));
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Chapter Management</h1>
      </div>

      <div className="flex gap-3">
        <select
          value={selectedSeries}
          onChange={(e) => { setSelectedSeries(e.target.value); setChapters([]); }}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select a series...</option>
          {seriesList.map((s) => (
            <option key={s.slug} value={s.slug}>{s.title}</option>
          ))}
        </select>
      </div>

      {selectedSeries && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href={`/admin/series/${selectedSeries}`} className="text-primary hover:text-primary-hover">Edit Series</Link>
          <span>&middot;</span>
          <span>{chapters.length} chapters</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-card" />)}
        </div>
      ) : chapters.length > 0 ? (
        <div className="space-y-1">
          {chapters.map((ch, idx) => (
            <div key={ch.id} className={`rounded-lg border border-border bg-card p-3 ${ch.isHidden ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveChapter(ch.id, "up")}
                    disabled={idx === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >&#9650;</button>
                  <button
                    onClick={() => moveChapter(ch.id, "down")}
                    disabled={idx === chapters.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >&#9660;</button>
                </div>
                <input
                  type="number"
                  value={ch.sortOrder}
                  onChange={(e) => updateSortOrder(ch.id, parseInt(e.target.value) || 0)}
                  className="w-14 rounded border border-border bg-background px-2 py-1 text-xs text-foreground text-center"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-white">Ch. {ch.number}</span>
                  {ch.title && <span className="ml-2 text-sm text-muted-foreground truncate">{ch.title}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{ch.pageCount}p</span>
              </div>
              <div className="mt-2 flex gap-2 border-t border-border/50 pt-2">
                <Link
                  href={`/admin/pages?series=${selectedSeries}&chapter=${ch.slug}`}
                  className="rounded bg-white/10 px-2 py-1 text-xs text-muted-foreground hover:text-white"
                >
                  Pages
                </Link>
                <button
                  onClick={() => toggleHidden(ch.id)}
                  disabled={saving === ch.id}
                  className={`rounded px-2 py-1 text-xs font-medium ${ch.isHidden ? "bg-yellow-500 text-black" : "bg-white/10 text-muted-foreground hover:text-white"}`}
                >
                  {ch.isHidden ? "Hidden" : "Visible"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : selectedSeries ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No chapters in database. Import from scraper first.</p>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Select a series to manage chapters.</p>
      )}
    </div>
  );
}

export default function AdminChaptersPage() {
  return (
    <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-card" />)}</div>}>
      <ChaptersContent />
    </Suspense>
  );
}
