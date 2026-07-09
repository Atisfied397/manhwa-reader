import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NyxReader - Read Comics, Manga, Manhua & Manhwa Online",
  description: "Immerse Yourself in Comics, Manga, Manhua, and Manhwa — NyxReader: Where Stories Come to Life.",
  other: { "keywords": "manhwa, manga, webtoon, comics, novels, read online" },
  openGraph: {
    title: "NyxReader - Read Comics, Manga, Manhua & Manhwa Online",
    description: "Immerse Yourself in Comics, Manga, Manhua, and Manhwa.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
        <body className="flex min-h-full flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}