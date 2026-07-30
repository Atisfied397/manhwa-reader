"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CategoryInfo {
  slug: string;
  name: string;
  count: number;
  sources: string[];
  sampleCovers: string[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Categories</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-card p-4">
              <div className="mb-2 h-4 w-3/4 rounded bg-card-hover" />
              <div className="h-3 w-1/2 rounded bg-card-hover" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">No categories found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:scale-[1.02] hover:bg-card-hover"
            >
              <div className="flex aspect-video items-center justify-center bg-muted p-4">
                {cat.sampleCovers.length > 0 ? (
                  <div className="grid h-full w-full grid-cols-2 gap-1">
                    {cat.sampleCovers.slice(0, 4).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-full w-full rounded object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <svg
                    className="h-10 w-10 text-muted-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cat.count} series
                  {cat.sources.length > 0 && ` · ${cat.sources.join(", ")}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
