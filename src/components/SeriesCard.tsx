import Link from "next/link";
import type { SeriesData } from "@/lib/types";

interface SeriesCardProps {
  series: SeriesData;
  size?: "sm" | "md";
}

export default function SeriesCard({ series, size = "md" }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-card transition-all hover:bg-card-hover"
    >
      <div className={`relative overflow-hidden bg-muted ${size === "sm" ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        {series.coverUrl ? (
          <img
            src={series.coverUrl}
            alt={series.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">📖</div>
        )}
        {series.rating != null && series.rating > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-star">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            {series.rating}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
          {series.title}
        </h3>
        {series.status && (
          <p className="text-[11px] text-muted-foreground uppercase">{series.status}</p>
        )}
      </div>
    </Link>
  );
}
