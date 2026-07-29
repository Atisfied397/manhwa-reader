"use client";

import { useState, useEffect } from "react";
import { ComicGrid, type ComicCardData } from "@/components/ComicCard";

export default function NovelsPage() {
  const [novels, setNovels] = useState<ComicCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comics")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNovels(list.filter((s: ComicCardData) => s.type === "Novel"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Novels</h1>

      <ComicGrid
        comics={novels}
        loading={loading}
        showRating
        showType
        columns="2 sm:3 md:4 lg:5 xl:6"
      />
    </div>
  );
}
