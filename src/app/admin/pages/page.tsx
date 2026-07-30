"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface PageItem {
  id: number;
  pageNumber: number;
  imageUrl: string;
  sortOrder: number;
}

interface SeriesInfo { slug: string; title: string; }
interface ChapterInfo { slug: string; number: number; }

function PagesContent() {
  const searchParams = useSearchParams();
  const seriesSlug = searchParams.get("series") ?? "";
  const chapterSlug = searchParams.get("chapter") ?? "";
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [chapterList, setChapterList] = useState<ChapterInfo[]>([]);
  const [selectedSeries, setSelectedSeries] = useState(seriesSlug);
  const [selectedChapter, setSelectedChapter] = useState(chapterSlug);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/series?limit=500").then(r => r.json()).then(d => setSeriesList(d.series || []));
  }, []);

  useEffect(() => {
    if (!selectedSeries) { setChapterList([]); return; }
    fetch(`/api/admin/chapters?series=${selectedSeries}`).then(r => r.json()).then(d => setChapterList(d.chapters || []));
  }, [selectedSeries]);

  const fetchPages = useCallback(async () => {
    if (!selectedSeries || !selectedChapter) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages?series=${selectedSeries}&chapter=${selectedChapter}`);
      const data = await res.json();
      setPages(data.pages || []);
    } catch {}
    setLoading(false);
  }, [selectedSeries, selectedChapter]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const movePage = async (id: number, direction: "up" | "down") => {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const other = direction === "up" ? pages[idx - 1] : pages[idx + 1];
    if (!other) return;

    const newPages = [...pages];
    const tempOrder = newPages[idx].sortOrder;
    newPages[idx] = { ...newPages[idx], sortOrder: other.sortOrder };
    newPages[direction === "up" ? idx - 1 : idx + 1] = { ...other, sortOrder: tempOrder };
    newPages.sort((a, b) => a.sortOrder - b.sortOrder);
    setPages(newPages);

    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [
        { id: newPages[idx].id, sortOrder: newPages[idx].sortOrder, pageNumber: idx + 1 },
        { id: other.id, sortOrder: tempOrder, pageNumber: direction === "up" ? idx + 2 : idx },
      ]}),
    });
  };

  const updateSortOrder = async (id: number, sortOrder: number) => {
    setSaving(id);
    const p = pages.find((pg) => pg.id === id);
    if (!p) return;
    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: [{ id, sortOrder, pageNumber: sortOrder }] }),
    });
    setPages((prev) => prev.map((pg) => pg.id === id ? { ...pg, sortOrder } : pg));
    setSaving(null);
  };

  const addPage = async () => {
    const url = prompt("Enter image URL:");
    if (!url) return;
    const maxSort = pages.length > 0 ? Math.max(...pages.map(p => p.sortOrder)) : 0;
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterSlug: selectedChapter, imageUrl: url, pageNumber: pages.length + 1, sortOrder: maxSort + 1 }),
    });
    const data = await res.json();
    if (data.id) {
      setPages((prev) => [...prev, data]);
      setMessage("Page added");
    } else {
      setMessage(data.error || "Failed to add page");
    }
  };

  const deletePage = async (id: number) => {
    if (!confirm("Delete this page?")) return;
    await fetch("/api/admin/pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPages((prev) => prev.filter((p) => p.id !== id));
    setMessage("Page deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Page Management</h1>
        {selectedChapter && (
          <button onClick={addPage} className="self-start sm:self-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            + Add Page
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-lg bg-primary/20 px-4 py-2 text-sm text-primary">{message}</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedSeries}
          onChange={(e) => { setSelectedSeries(e.target.value); setSelectedChapter(""); setPages([]); }}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select series...</option>
          {seriesList.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
        </select>
        <select
          value={selectedChapter}
          onChange={(e) => { setSelectedChapter(e.target.value); setPages([]); }}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          disabled={!selectedSeries}
        >
          <option value="">Select chapter...</option>
          {chapterList.map((ch) => <option key={ch.slug} value={ch.slug}>Ch. {ch.number}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-card" />)}
        </div>
      ) : pages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {pages.map((p, idx) => (
            <div key={p.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[2/3] overflow-hidden bg-muted">
                <img src={p.imageUrl} alt={`Page ${p.pageNumber}`} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex items-center gap-2 p-2">
                <span className="text-xs text-muted-foreground">#{p.sortOrder}</span>
                <input
                  type="number"
                  value={p.sortOrder}
                  onChange={(e) => updateSortOrder(p.id, parseInt(e.target.value) || 0)}
                  className="w-12 rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground text-center"
                />
                <div className="flex-1" />
                <button onClick={() => movePage(p.id, "up")} disabled={idx === 0} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">&#9650;</button>
                <button onClick={() => movePage(p.id, "down")} disabled={idx === pages.length - 1} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">&#9660;</button>
                <button onClick={() => deletePage(p.id)} className="text-xs text-red-400 hover:text-red-300">Del</button>
              </div>
            </div>
          ))}
        </div>
      ) : selectedChapter ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No pages in database for this chapter.</p>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Select a series and chapter to manage pages.</p>
      )}
    </div>
  );
}

export default function AdminPagesPage() {
  return (
    <Suspense fallback={<div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-card" />)}</div>}>
      <PagesContent />
    </Suspense>
  );
}
