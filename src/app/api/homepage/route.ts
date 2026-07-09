import { NextResponse } from "next/server";
import { scrapeNyxHomepage } from "@/lib/scraper";

const fallbackData = {
  featured: [
    { title: "The Forgotten Field", slug: "the-forgotten-field", rating: 9.53, description: "Born from an illicit affair, the ill-fated Imperial Princess Talia Roem Gwirta grows up warped in a world that denies her. With indifferent parents, hostile half-siblings, and servants who treat her with contempt, she survives by baring her thorns at anyone who dares approach.", genres: ["shoujo", "romance", "Slice of Life"], coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cmjwxv33e000jnr1t5o8rlvxt/8e78f9f8-811e-4098-a5ee-ade8caf25f9a.jpg" },
    { title: "Operation: True Love", slug: "operation-true-love", rating: 9.83, description: "It's hard dating someone who won't give you the time of day. Su-ae Shim knows that better than anyone, having dated her indifferent boyfriend, Minu Kang, for years.", genres: ["Webtoon"], coverUrl: "https://media.nyxscans.com/upload/2025/01/12/b5196bdc-ede4-43c7-87cc-073710686042.webp" },
    { title: "The Eldest Daughter of the Tang Clan of Sacheon Protects the Family", slug: "the-eldest-daughter-of-the-tang-clan-of-sacheon-protects-the-family", rating: 10, description: "Tang So-hwa, known throughout the world as the 'Master of Ten Thousand Poisons,' as there was no poison she did not know. She was given a second chance to protect the family that had been destroyed.", genres: ["Webtoon", "shoujo", "romance"], coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm83hfh030029p601pryli9ph/97103106-d921-47d7-846a-31ac4eb11a8b.png" },
  ],
  popular: [
    { title: "Pure Delinquent", slug: "pure-delinquent", rating: 10, coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm5rclv5t0000hv2awz8fnzy3/877be4c7-4bed-45d9-9f2b-c2ffb6ed09b4.jpg", type: "Manhwa" },
    { title: "The Villains Pure Love", slug: "the-villains-pure-love", rating: 10, coverUrl: "https://media.nyxscans.com/upload/2026/03/24/8b7b6709-1e51-4abc-9924-86ced6c27fb8.webp", type: "Manhwa" },
    { title: "Hate Girl", slug: "hate-girl", rating: 10, coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm9yfqne4000do901q66k1txk/0c6e2dc4-1539-41ca-b203-41e284dfbebf.jpg", type: "Manhwa" },
    { title: "The Scandal Maker Has Returned", slug: "the-scandal-maker-has-returned", rating: 9, coverUrl: "https://media.nyxscans.com/upload/2026/03/24/99cbae85-2088-47c6-916e-fd0b64572af7.webp", type: "Manhwa" },
    { title: "Ex-Love Review", slug: "ex-love-review", rating: 9.89, coverUrl: "https://media.nyxscans.com/upload/2026/01/09/69371d2b-04ea-4474-8746-d4d29dd84291.webp", type: "Manhwa" },
    { title: "I Faked a Pregnancy, but My Husband Returned", slug: "i-faked-a-pregnancy-but-my-husband-returned", rating: 10, coverUrl: "https://media.nyxscans.com/upload/series/featured/cm5rclv5t0000hv2awz8fnzy3/a05af260-cb03-4991-9312-aae8cb32150c.png", type: "Manhwa" },
  ],
  latestReleases: [
    { title: "The Scandal Maker Has Returned", slug: "the-scandal-maker-has-returned", rating: 9, coverUrl: "https://media.nyxscans.com/upload/2026/03/24/99cbae85-2088-47c6-916e-fd0b64572af7.webp", status: "Ongoing", type: "Manhwa", chapters: [{ number: "22", slug: "chapter-22", time: "New", isNew: true }, { number: "21", slug: "chapter-21", time: "8 days ago", isNew: false }, { number: "20", slug: "chapter-20", time: "15 days ago", isNew: false }] },
    { title: "I Only Need the Duke's Child", slug: "i-only-need-the-duke's-child", rating: 10, coverUrl: "https://media.nyxscans.com/upload/2026/03/27/64eccf19-5e50-4695-90d5-67f333b34707.webp", status: "Ongoing", type: "Manhwa", chapters: [{ number: "19", slug: "chapter-19", time: "New", isNew: true }, { number: "18", slug: "chapter-18", time: "9 days ago", isNew: false }, { number: "17", slug: "chapter-17", time: "16 days ago", isNew: false }] },
    { title: "Romance Starting with Parenting", slug: "romance-starting-with-parenting", rating: 10, coverUrl: "https://media.nyxscans.com/upload/2026/03/24/15bba1e2-5d9a-4d60-a9d7-d1708b698de2.webp", status: "Ongoing", type: "Manhwa", chapters: [{ number: "26", slug: "chapter-26", time: "New", isNew: true }, { number: "25", slug: "chapter-25", time: "9 days ago", isNew: false }, { number: "24", slug: "chapter-24", time: "16 days ago", isNew: false }] },
    { title: "The Forgotten Field", slug: "the-forgotten-field", rating: 9.53, coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cmjwxv33e000jnr1t5o8rlvxt/8e78f9f8-811e-4098-a5ee-ade8caf25f9a.jpg", status: "Ongoing", type: "Manhwa", chapters: [{ number: "27", slug: "chapter-27", time: "New", isNew: true }, { number: "26", slug: "chapter-26", time: "16 days ago", isNew: false }, { number: "25", slug: "chapter-25", time: "23 days ago", isNew: false }] },
    { title: "Duchess in Ruins", slug: "duchess-in-ruins", rating: 9.9, coverUrl: "https://media.nyxscans.com/upload/2026/01/09/6711e17c-c387-4120-8b2d-33b7bb710484.webp", status: "Ongoing", type: "Manhwa", chapters: [{ number: "73", slug: "chapter-73", time: "New", isNew: true }, { number: "72", slug: "chapter-72", time: "10 days ago", isNew: false }, { number: "71", slug: "chapter-71", time: "17 days ago", isNew: false }] },
    { title: "Ex-Love Review", slug: "ex-love-review", rating: 9.89, coverUrl: "https://media.nyxscans.com/upload/2026/01/09/69371d2b-04ea-4474-8746-d4d29dd84291.webp", status: "Ongoing", type: "Manhwa", chapters: [{ number: "77", slug: "chapter-77", time: "New", isNew: true }, { number: "76", slug: "chapter-76", time: "17 days ago", isNew: false }, { number: "75", slug: "chapter-75", time: "25 days ago", isNew: false }] },
  ],
};

export async function GET() {
  try {
    const data = await scrapeNyxHomepage();
    return NextResponse.json({
      ...data,
      popular: data.popular.length > 0 ? data.popular : fallbackData.popular,
      latestReleases: data.latestReleases.length > 0 ? data.latestReleases : fallbackData.latestReleases,
    });
  } catch {
    return NextResponse.json(fallbackData);
  }
}
