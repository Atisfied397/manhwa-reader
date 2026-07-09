"use client";

interface AdBannerProps {
  format?: "banner" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdBanner({ format = "banner", className = "" }: AdBannerProps) {
  const sizeClasses = {
    banner: "h-[90px]",
    rectangle: "h-[250px]",
    leaderboard: "h-[90px]",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-border bg-card text-xs text-muted-foreground ${sizeClasses[format]} ${className}`}
    >
      <div className="text-center">
        <p className="mb-1 font-medium">Ad Space</p>
        <p>Replace with AdSense or Ezoic code</p>
      </div>
    </div>
  );
}