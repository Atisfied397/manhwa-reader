import Link from "next/link";

export interface ComicCardData {
  title: string;
  slug: string;
  coverUrl: string;
  rating: number;
  type?: string;
  source?: string;
  sourceUrl?: string;
}

interface ComicCardProps {
  comic: ComicCardData;
  showRating?: boolean;
  showSource?: boolean;
  showType?: boolean;
  size?: "sm" | "md";
}

export default function ComicCard({
  comic,
  showRating = true,
  showSource = false,
  showType = false,
  size = "md",
}: ComicCardProps) {
  const href = `/series/${comic.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:scale-[1.02] hover:bg-card-hover"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {comic.coverUrl ? (
          <img
            src={comic.coverUrl}
            alt={comic.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
            📖
          </div>
        )}
        {showRating && comic.rating > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-star">
            <svg
              className="h-3 w-3 fill-current"
              viewBox="0 0 24 24"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {comic.rating}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <h3
          className={`line-clamp-2 font-medium leading-tight text-foreground group-hover:text-primary ${
            size === "sm" ? "text-xs" : "text-sm"
          }`}
        >
          {comic.title}
        </h3>
        {showType && comic.type && (
          <p className="text-[10px] uppercase text-muted-foreground">
            {comic.type}
          </p>
        )}
        {showSource && comic.source && (
          <p className="text-[10px] uppercase text-muted-foreground">
            {comic.source}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ComicGrid({
  comics,
  loading = false,
  showRating = true,
  showSource = false,
  showType = false,
  size = "md",
  columns = "2 sm:3 md:4 lg:5 xl:6",
  skeletonCount = 12,
}: {
  comics: ComicCardData[];
  loading?: boolean;
  showRating?: boolean;
  showSource?: boolean;
  showType?: boolean;
  size?: "sm" | "md";
  columns?: string;
  skeletonCount?: number;
}) {
  const gridClass = `grid-cols-${columns}`;

  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] rounded-lg bg-card" />
            <div className="mt-2 h-4 w-3/4 rounded bg-card" />
          </div>
        ))}
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <svg
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-sm text-muted-foreground">No results found.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {comics.map((comic) => (
        <ComicCard
          key={comic.slug}
          comic={comic}
          showRating={showRating}
          showSource={showSource}
          showType={showType}
          size={size}
        />
      ))}
    </div>
  );
}
