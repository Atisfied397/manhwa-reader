/**
 * Scraper script for bulk importing manhwa series and chapters.
 * Run: node scripts/scrape-series.mjs <seriesUrl> [source]
 *
 * Example: node scripts/scrape-series.mjs https://asuracomic.net/series/solo-leveling asura
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function scrapeSeries(seriesUrl, source = "asura") {
  const response = await fetch(`${BASE_URL}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, url: seriesUrl }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to scrape");
  }

  const data = await response.json();
  console.log(`Series: ${data.series.title}`);
  console.log(`Chapters found: ${data.chapters.length}`);
  return data;
}

const seriesUrl = process.argv[2];
const source = process.argv[3] ?? "asura";

if (!seriesUrl) {
  console.error("Usage: node scripts/scrape-series.mjs <seriesUrl> [source]");
  process.exit(1);
}

scrapeSeries(seriesUrl, source).then(console.log).catch(console.error);