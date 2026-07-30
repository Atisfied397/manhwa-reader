import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manhwa Reader - Read Comics, Manga, Manhua & Manhwa Online",
  description: "Immerse Yourself in Comics, Manga, Manhua, and Manhwa — Manhwa Reader: Where Stories Come to Life.",
  other: { "keywords": "manhwa, manga, webtoon, comics, novels, read online" },
  openGraph: {
    title: "Manhwa Reader - Read Comics, Manga, Manhua & Manhwa Online",
    description: "Immerse Yourself in Comics, Manga, Manhua, and Manhwa.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
        <body className="flex min-h-full flex-col">
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}