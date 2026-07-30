"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ChapterDraft {
  id: string;
  number: number;
  title: string;
  pages: { id: string; file: File; preview: string; uploading: boolean; url: string }[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function ImageUpload({ label, value, folder, onChange }: { label: string; value: string; folder: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch {}
    setUploading(false);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 transition-colors"
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload"}</p>
          </div>
        )}
        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

export default function UploadSeriesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [author, setAuthor] = useState("");
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [genres, setGenres] = useState("");
  const [altTitle, setAltTitle] = useState("");

  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { id: uid(), number: 1, title: "", pages: [] },
  ]);

  const addChapter = () => {
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
    setChapters([...chapters, { id: uid(), number: nextNum, title: "", pages: [] }]);
  };

  const removeChapter = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const updateChapter = (id: string, field: keyof ChapterDraft, value: string | number) => {
    setChapters(chapters.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const addPagesToChapter = async (chapterId: string, files: FileList) => {
    const newPages = Array.from(files).map((file) => ({
      id: uid(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      url: "",
    }));

    setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, pages: [...c.pages, ...newPages] } : c));

    for (const page of newPages) {
      const fd = new FormData();
      fd.append("file", page.file);
      fd.append("folder", `custom/${slug || "unknown"}`);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) {
          setChapters((prev) => prev.map((c) => c.id === chapterId ? {
            ...c,
            pages: c.pages.map((p) => p.id === page.id ? { ...p, url: data.url, uploading: false } : p),
          } : c));
        }
      } catch {
        setChapters((prev) => prev.map((c) => c.id === chapterId ? {
          ...c,
          pages: c.pages.filter((p) => p.id !== page.id),
        } : c));
      }
    }
  };

  const removePage = (chapterId: string, pageId: string) => {
    setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, pages: c.pages.filter((p) => p.id !== pageId) } : c));
  };

  const movePage = (chapterId: string, pageId: string, dir: -1 | 1) => {
    setChapters((prev) => prev.map((c) => {
      if (c.id !== chapterId) return c;
      const idx = c.pages.findIndex((p) => p.id === pageId);
      if (idx < 0) return c;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= c.pages.length) return c;
      const newPages = [...c.pages];
      [newPages[idx], newPages[newIdx]] = [newPages[newIdx], newPages[idx]];
      return { ...c, pages: newPages };
    }));
  };

  const safeJson = async (res: Response): Promise<Record<string, unknown>> => {
    const text = await res.text();
    if (!text) return { error: `Server returned empty response (status ${res.status})` };
    try { return JSON.parse(text); } catch { return { error: `Server returned invalid JSON: ${text.slice(0, 200)}` }; }
  };

  const handleSave = async () => {
    if (!title.trim()) { setResult("Title is required"); return; }
    if (!slug.trim()) { setResult("Slug is required"); return; }

    setSaving(true);
    setResult("Saving...");

    try {
      const seriesRes = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          coverUrl,
          bannerUrl,
          status,
          author: author.trim() || undefined,
          artist: artist.trim() || undefined,
          year: year ? parseInt(year) : undefined,
          rating: rating ? parseFloat(rating) : undefined,
          altTitle: altTitle.trim() || undefined,
          source: "custom",
        }),
      });
      const seriesData = await safeJson(seriesRes);
      if (seriesData.error) { setResult(`Error: ${seriesData.error}`); setSaving(false); return; }

      const seriesRecord = seriesData.series as { id: number } | undefined;
      if (!seriesRecord?.id) { setResult("Error: Series created but no ID returned"); setSaving(false); return; }

      if (genres.trim()) {
        for (const g of genres.split(",").map((s) => s.trim()).filter(Boolean)) {
          const genreSlug = g.toLowerCase().replace(/\s+/g, "-");
          let genreId: number | undefined;
          const existingRes = await fetch(`/api/admin/settings`);
          const settingsData = await safeJson(existingRes);
          const allGenres = (settingsData.genres as { slug: string; id: number }[] | undefined) ?? [];
          const existingGenre = allGenres.find((x) => x.slug === genreSlug);
          if (existingGenre) {
            genreId = existingGenre.id;
          } else {
            const createRes = await fetch("/api/admin/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "createGenre", name: g, slug: genreSlug }),
            });
            const createData = await safeJson(createRes);
            genreId = (createData.genre as { id: number } | undefined)?.id;
          }
          if (genreId) {
            await fetch("/api/admin/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "addSeriesGenre", seriesId: seriesRecord.id, genreId }),
            });
          }
        }
      }

      let totalImported = 0;
      for (const ch of chapters) {
        const pageUrls = ch.pages.filter((p) => p.url).map((p) => p.url);
        const res = await fetch("/api/admin/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seriesId: seriesRecord.id,
            number: ch.number,
            title: ch.title || undefined,
            pageUrls,
          }),
        });
        const data = await safeJson(res);
        if (!data.error) totalImported++;
      }

      setResult(`Created "${title}" with ${totalImported} chapters`);
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Upload Custom Series</h1>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {saving ? "Saving..." : "Save Series"}
        </button>
      </div>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${result.startsWith("Error") ? "bg-red-500/20 text-red-400" : result === "Saving..." ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
          {result}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Series title" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Slug *</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="series-slug" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Alt Title</label>
            <input type="text" value={altTitle} onChange={(e) => setAltTitle(e.target.value)} placeholder="Alternative title" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Series description" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Author</label>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Artist</label>
              <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Rating</label>
            <input type="number" step="0.1" min="0" max="10" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="8.5" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Genres (comma separated)</label>
            <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Action, Fantasy, Adventure" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <ImageUpload label="Cover Image" value={coverUrl} folder="covers" onChange={setCoverUrl} />
          <ImageUpload label="Banner Image (optional)" value={bannerUrl} folder="banners" onChange={setBannerUrl} />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Chapters</h2>
          <button onClick={addChapter} className="rounded-lg bg-card-hover px-4 py-2 text-sm text-foreground hover:bg-border transition-colors">
            + Add Chapter
          </button>
        </div>

        <div className="space-y-4">
          {chapters.map((ch) => (
            <div key={ch.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Ch.</label>
                  <input type="number" step="0.5" value={ch.number} onChange={(e) => updateChapter(ch.id, "number", parseFloat(e.target.value) || 0)} className="w-16 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center" />
                </div>
                <input type="text" value={ch.title} onChange={(e) => updateChapter(ch.id, "title", e.target.value)} placeholder="Chapter title (optional)" className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
                <button onClick={() => removeChapter(ch.id)} className="self-end rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 sm:self-auto">Remove</button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ch.pages.map((page, idx) => (
                  <div key={page.id} className="relative group">
                    <img src={page.preview} alt={`Page ${idx + 1}`} className="h-32 w-24 rounded border border-border object-cover" />
                    {page.uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && <button onClick={() => movePage(ch.id, page.id, -1)} className="flex h-5 w-5 items-center justify-center rounded bg-black/70 text-white text-xs hover:bg-black">{"<"}</button>}
                      {idx < ch.pages.length - 1 && <button onClick={() => movePage(ch.id, page.id, 1)} className="flex h-5 w-5 items-center justify-center rounded bg-black/70 text-white text-xs hover:bg-black">{">"}</button>}
                      <button onClick={() => removePage(ch.id, page.id)} className="flex h-5 w-5 items-center justify-center rounded bg-red-600/80 text-white text-xs hover:bg-red-600">x</button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground mt-0.5">{idx + 1}</p>
                  </div>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add pages (images)
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addPagesToChapter(ch.id, e.target.files)} />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">{ch.pages.length} pages &middot; {ch.pages.filter((p) => p.url).length} uploaded</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
