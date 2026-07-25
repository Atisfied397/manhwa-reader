import { NextResponse } from "next/server";
import { getAllComics, fuzzyMatch } from "@/lib/comics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  const comics = await getAllComics();

  if (!query) {
    return NextResponse.json(comics.slice(0, 20));
  }

  const words = query.split(/\s+/).filter(Boolean);

  const results = comics.filter((s) => {
    const haystack = [s.title, s.type, s.slug].join(" ").toLowerCase();
    return words.every((w) => haystack.includes(w)) || fuzzyMatch(words, haystack);
  });
  results.sort((a, b) => {
    const aExact = words.every((w) => a.title.toLowerCase().includes(w));
    const bExact = words.every((w) => b.title.toLowerCase().includes(w));
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  return NextResponse.json(results);
}
