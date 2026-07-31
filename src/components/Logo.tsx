"use client";

import { useId } from "react";

export default function Logo({ className = "" }: { className?: string }) {
  const id = useId();
  const gradId = `${id}-grad`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Manhwa Reader logo"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="56" height="48" rx="8" fill={`url(#${gradId})`} />
      <rect x="31" y="8" width="2" height="48" rx="1" fill="rgba(255,255,255,0.15)" />
      <path
        d="M14 42V20l8 14 8-14"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M34 20l8 14 8-14v22"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
