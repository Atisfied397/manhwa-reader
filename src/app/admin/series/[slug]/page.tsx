"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  status: string;
  rating: number;
  author: string;
  artist: string;
  source: string;
  sortOrder: number;
  isFeatured: boolean;
  isHidden: boolean;
  genres: { genreId: number; name: string; slug: string }[];
  chapters: { id: number; number: number; title: string; slug: string; pageCount: number; sortOrder: number; isHidden: boolean }[];
}

export default function AdminSeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", coverUrl: "", bannerUrl: "", status: "ongoing",
    author: "", artist: "", sortOrder: 0, isFeatured: false, isHidden: false,
  });

  useEffect(() => {
    fetch(`/api/admin/series/${slug}`)
      .then(r => r.json())
      .then((data) => {
        if (data.error) { setMessage(data.error); setLoading(false); return; }
        setSeries(data);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          coverUrl: data.coverUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
          status: data.status ?? "ongoing",
          author: data.author ?? "",
          artist: data.artist ?? "",
          sortOrder: data.sortOrder ?? 0,
          isFeatured: data.isFeatured ?? false,
          isHidden: data.isHidden ?? false,
        });
        setLoading(false);
      })
      .catch(() => { setMessage("Failed to load series"); setLoading(false); });
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/series/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); }
      else { setMessage("Saved successfully!"); setSeries({ ...series!, ...data }); }
    } catch { setMessage("Failed to save"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this series and all its chapters?")) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/series/${slug}`, { method: "DELETE" });
      router.push("/admin/series");
    } catch { setMessage("Failed to delete"); setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-card" /><div className="h-64 animate-pulse rounded-lg bg-card" /></div>;

  if (!series) return <p className="text-sm text-muted-foreground">{message || "Series not found"}</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link href="/admin/series" className="text-sm text-muted-foreground hover:text-foreground">&larr; Series</Link>
        <h1 className="text-2xl font-bold text-white truncate">{series.title}</h1>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes("success") || message.includes("Saved") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {message}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-y" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cover URL</label>
            <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            {form.coverUrl && <img src={form.coverUrl} alt="" className="mt-2 h-32 w-auto rounded-lg object-cover" />}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Banner URL</label>
            <input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            {form.bannerUrl && <img src={form.bannerUrl} alt="" className="mt-2 h-20 w-full rounded-lg object-cover" />}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Source</label>
            <input value={series.source} disabled className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Author</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Artist</label>
            <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded border-border" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isHidden} onChange={(e) => setForm({ ...form, isHidden: e.target.checked })} className="rounded border-border" />
            Hidden
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={handleDelete} disabled={saving} className="rounded-lg bg-red-500/20 px-6 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50">
            Delete Series
          </button>
        </div>
      </div>

      {series.genres.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-white">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {series.genres.map((g) => (
              <span key={g.genreId} className="rounded bg-white/10 px-2.5 py-1 text-xs text-muted-foreground">{g.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Chapters ({series.chapters.length})</h3>
          <Link href={`/admin/chapters?series=${slug}`} className="text-xs text-primary hover:text-primary-hover">Manage Chapters</Link>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {series.chapters.map((ch) => (
            <div key={ch.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${ch.isHidden ? "opacity-50" : ""}`}>
              <span className="w-8 text-center text-xs text-muted-foreground">{ch.sortOrder}</span>
              <span className="flex-1 text-foreground">Chapter {ch.number}{ch.title ? ` - ${ch.title}` : ""}</span>
              <span className="text-xs text-muted-foreground">{ch.pageCount} pages</span>
              {ch.isHidden && <span className="text-xs text-yellow-500">Hidden</span>}
            </div>
          ))}
          {series.chapters.length === 0 && <p className="text-xs text-muted-foreground">No chapters in database. Import from scraper first.</p>}
        </div>
      </div>
    </div>
  );
}
