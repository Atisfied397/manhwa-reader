import { NextResponse } from "next/server";

const popularSeries = [
  { id: 1, title: "Solo Leveling", slug: "solo-leveling", coverUrl: "", rating: 4.8, genres: ["Action", "Fantasy"], status: "completed" },
  { id: 2, title: "The Beginning After The End", slug: "the-beginning-after-the-end", coverUrl: "", rating: 4.7, genres: ["Action", "Fantasy", "Isekai"], status: "ongoing" },
  { id: 3, title: "Omniscient Reader's Viewpoint", slug: "omniscient-readers-viewpoint", coverUrl: "", rating: 4.6, genres: ["Action", "Fantasy", "Thriller"], status: "ongoing" },
  { id: 4, title: "Nano Machine", slug: "nano-machine", coverUrl: "", rating: 4.5, genres: ["Action", "Martial Arts"], status: "ongoing" },
  { id: 5, title: "Return of the Mount Hua Sect", slug: "return-of-the-mount-hua-sect", coverUrl: "", rating: 4.6, genres: ["Martial Arts", "Comedy"], status: "ongoing" },
  { id: 6, title: "The Max-Level Player's 100th Regression", slug: "max-level-player-100th-regression", coverUrl: "", rating: 4.4, genres: ["Action", "Fantasy"], status: "ongoing" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  if (!query) {
    return NextResponse.json(popularSeries);
  }

  const results = popularSeries.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.genres.some((g) => g.toLowerCase().includes(query))
  );

  return NextResponse.json(results);
}