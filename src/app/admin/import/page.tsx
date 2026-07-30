"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SOURCES = [
  { id: "nyx", name: "Nyx Scans", domain: "nyxscans.com" },
  { id: "asurascans", name: "Asura Scans", domain: "asurascans.com" },
  { id: "hivetoons", name: "HiveToons", domain: "hivetoons.org" },
];

const ALL_MANUAL_SOURCES = [
  ...SOURCES,
  { id: "mangaplus", name: "Manga Plus", domain: "mangaplus.shueisha.co.jp" },
];

interface ScrapedItem {
  title: string;
  slug: string;
  coverUrl: string;
  status: string;
}

export default function AdminImportPage() {
  const router = useRouter();
  const [view, setView] = useState<"browse" | "manual">("browse");

  // Browse state
  const [browseSource, setBrowseSource] = useState("nyx");
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseResults, setBrowseResults] = useState<ScrapedItem[]>([]);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [importResult, setImportResult] = useState("");

  // Manual state
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSource, setManualSource] = useState("nyx");
  const [importPages, setImportPages] = useState(false);
  const [manualImporting, setManualImporting] = useState(false);
  const [manualResult, setManualResult] = useState("");

  const loadBrowseResults = async () => {
    setBrowseLoading(true);
    setBrowseResults([]);
    setImportResult("");
    try {
      const res = await fetch(`/api/admin/scrape?source=${browseSource}&homepage=true`);
      const data = await res.json();
      if (data.error) {
        setImportResult(`Error: ${data.error}`);
      } else {
        setBrowseResults(data.series || []);
        if ((data.series || []).length === 0) {
          setImportResult("No series found from this source");
        }
      }
    } catch {
      setImportResult("Failed to load series from source");
    }
    setBrowseLoading(false);
  };

  const importFromBrowse = async (item: ScrapedItem) => {
    setImportingSlug(item.slug);
    setImportResult("");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.slug, source: browseSource, importPages: true }),
      });
      const data = await res.json();
      if (data.error) {
        setImportResult(`Import failed for "${item.title}": ${data.error}`);
      } else {
        setImportResult(`Imported "${data.series.title}" — ${data.totalChapters} chapters, ${data.importedPages} pages`);
        router.push(`/admin/series/${item.slug}`);
      }
    } catch (e) {
      setImportResult(`Import failed for "${item.title}": ${e instanceof Error ? e.message : "network error"}`);
    }
    setImportingSlug(null);
  };

  const handleManualImport = async () => {
    if (!slug) { setManualResult("Enter a series slug"); return; }
    setManualImporting(true);
    setManualResult("Importing...");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, source: manualSource, importPages }),
      });
      const data = await res.json();
      if (data.error) {
        setManualResult(`Error: ${data.error}`);
      } else {
        setManualResult(`Imported "${data.series.title}" — ${data.importedChapters} new chapters, ${data.importedPages} pages (${data.totalChapters} total chapters)`);
        router.push(`/admin/series/${data.series.slug || slug}`);
      }
    } catch { setManualResult("Import failed"); }
    setManualImporting(false);
  };

  const extractSlug = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const detected = ALL_MANUAL_SOURCES.find((s) => trimmed.includes(s.domain));
    if (detected) {
      setManualSource(detected.id);
      const slugPattern = detected.id === "asurascans" ? "/comics/" : "/series/";
      const parts = trimmed.split(slugPattern);
      if (parts.length > 1) {
        const extracted = parts[1].split(/[/?#]/)[0];
        if (extracted) { setSlug(extracted); return; }
      }
    }
    setSlug(trimmed);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Import Series</h1>
        <div className="self-start sm:self-auto flex rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setView("browse")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "browse" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse Source
          </button>
          <button
            onClick={() => setView("manual")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "manual" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manual URL
          </button>
        </div>
      </div>

      {view === "browse" ? (
        <>
          <p className="text-sm text-muted-foreground">Select a source to browse available series. Click a series to import it into your database.</p>
          <p className="text-xs text-muted-foreground/70">Sources: Nyx, Asura, HiveToons. For Comix/Manta, use Manual URL tab.</p>

          {/* Source selector + Load button */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={browseSource}
                onChange={(e) => { setBrowseSource(e.target.value); setBrowseResults([]); }}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button
                onClick={loadBrowseResults}
                disabled={browseLoading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {browseLoading ? "Loading..." : "Load Series"}
              </button>
            </div>
          </div>

          {/* Import result */}
          {importResult && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              importResult.startsWith("Error") || importResult.startsWith("Import failed")
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            }`}>
              {importResult}
            </div>
          )}

          {/* Loading skeletons */}
          {browseLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-card">
                  <div className="aspect-[3/4] rounded-t-lg bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!browseLoading && browseResults.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {browseResults.map((item) => (
                <div
                  key={item.slug}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                        📖
                      </div>
                    )}
                    {item.status && (
                      <div className="absolute top-2 right-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          item.status === "completed" ? "bg-green-500/80 text-white" :
                          item.status === "hiatus" ? "bg-yellow-500/80 text-white" :
                          "bg-blue-500/80 text-white"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">{item.slug}</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => importFromBrowse(item)}
                        disabled={importingSlug === item.slug}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                      >
                        {importingSlug === item.slug ? "Importing..." : "Import & Edit"}
                      </button>
                      <Link
                        href={`/admin/series/${item.slug}`}
                        className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!browseLoading && browseResults.length === 0 && !importResult && (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-muted-foreground">Select a source and click &quot;Load Series&quot; to browse available series.</p>
            </div>
          )}
        </>
      ) : (
        /* Manual URL view */
        <>
          <p className="text-sm text-muted-foreground">Paste a URL or enter a slug to import a specific series.</p>

          <div className="rounded-lg border border-border bg-card p-4 space-y-4 max-w-2xl">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Paste URL or Series Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") extractSlug(url); }}
                  placeholder="e.g. https://nyxscans.com/series/solo-leveling"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <button onClick={() => extractSlug(url)} className="rounded-lg bg-card-hover px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                  Extract
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Source</label>
                <select value={manualSource} onChange={(e) => setManualSource(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                  {ALL_MANUAL_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Series Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleManualImport(); }}
                  placeholder="solo-leveling"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={importPages}
                onChange={(e) => setImportPages(e.target.checked)}
                className="rounded border-border"
              />
              <div>
                <span className="font-medium">Import chapter pages</span>
                <p className="text-xs text-muted-foreground">Also scrape and save image URLs for each chapter</p>
              </div>
            </label>

            <button onClick={handleManualImport} disabled={manualImporting} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {manualImporting ? "Importing..." : "Import Series"}
            </button>
          </div>

          {manualResult && (
            <div className={`rounded-lg px-4 py-3 text-sm max-w-2xl ${
              manualResult.startsWith("Error") || manualResult === "Import failed" ? "bg-red-500/20 text-red-400" : manualResult === "Importing..." ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
            }`}>
              {manualResult}
            </div>
          )}
        </>
      )}
    </div>
  );
}
