"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setMessage("Settings saved successfully!");
    } catch { setMessage("Failed to save settings"); }
    setSaving(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const settingGroups = [
    {
      title: "Homepage",
      settings: [
        { key: "site_title", label: "Site Title", placeholder: "Manhwa Reader" },
        { key: "site_description", label: "Site Description", placeholder: "Read comics online", multiline: true },
        { key: "homepage_hero_title", label: "Hero Title", placeholder: "Read Manhwa Online" },
        { key: "homepage_hero_subtitle", label: "Hero Subtitle", placeholder: "Thousands of comics at your fingertips" },
        { key: "featured_heading", label: "Featured Section Heading", placeholder: "Featured" },
      ],
    },
    {
      title: "Appearance",
      settings: [
        { key: "primary_color", label: "Primary Color (hex)", placeholder: "#dc2626" },
        { key: "accent_color", label: "Accent Color (hex)", placeholder: "#2563eb" },
        { key: "banner_url", label: "Global Banner URL", placeholder: "https://..." },
      ],
    },
    {
      title: "Content",
      settings: [
        { key: "default_source", label: "Default Scraper Source", placeholder: "nyx" },
        { key: "max_series_per_page", label: "Series Per Page", placeholder: "30" },
        { key: "enable_novels", label: "Show Novels Section", placeholder: "true" },
        { key: "maintenance_mode", label: "Maintenance Mode", placeholder: "false" },
        { key: "maintenance_message", label: "Maintenance Message", placeholder: "We'll be back soon!" },
      ],
    },
    {
      title: "Custom CSS",
      settings: [
        { key: "custom_css", label: "Custom CSS", placeholder: "/* Add custom styles */", multiline: true },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes("success") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {message}
        </div>
      )}

      {settingGroups.map((group) => (
        <div key={group.title} className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="text-lg font-bold text-white">{group.title}</h2>
          {group.settings.map((s) => (
            <div key={s.key}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{s.label}</label>
              {s.multiline ? (
                <textarea
                  rows={4}
                  value={settings[s.key] ?? ""}
                  onChange={(e) => updateSetting(s.key, e.target.value)}
                  placeholder={s.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-y font-mono"
                />
              ) : (
                <input
                  type="text"
                  value={settings[s.key] ?? ""}
                  onChange={(e) => updateSetting(s.key, e.target.value)}
                  placeholder={s.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-bold text-white">Danger Zone</h2>
        <p className="mb-3 text-sm text-muted-foreground">Irreversible actions that affect the entire site.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              if (confirm("Clear all cached scraper data? This will force fresh scraping on next page load.")) {
                setMessage("Cache cleared (scraper data is not cached - this is a no-op)");
              }
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear Cache
          </button>
          <button
            onClick={() => {
              if (confirm("Rebuild database? This will re-run migrations.")) {
                setMessage("Database rebuild not available from admin panel");
              }
            }}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Rebuild DB
          </button>
        </div>
      </div>
    </div>
  );
}
