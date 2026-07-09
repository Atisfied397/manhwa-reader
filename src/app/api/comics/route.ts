import { NextResponse } from "next/server";

const fallbackComics = [
  { title: "The Forgotten Field", slug: "the-forgotten-field", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cmjwxv33e000jnr1t5o8rlvxt/8e78f9f8-811e-4098-a5ee-ade8caf25f9a.jpg", rating: 9.53, type: "Manhwa" },
  { title: "Operation: True Love", slug: "operation-true-love", coverUrl: "https://media.nyxscans.com/upload/2025/01/12/b5196bdc-ede4-43c7-87cc-073710686042.webp", rating: 9.83, type: "Manhwa" },
  { title: "The Eldest Daughter of the Tang Clan of Sacheon Protects the Family", slug: "the-eldest-daughter-of-the-tang-clan-of-sacheon-protects-the-family", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm83hfh030029p601pryli9ph/97103106-d921-47d7-846a-31ac4eb11a8b.png", rating: 10, type: "Manhwa" },
  { title: "When My Pet Became the Villain", slug: "when-my-pet-became-the-villain", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cmjwxv33e000jnr1t5o8rlvxt/ad617335-c8b1-4944-9763-212ca4440441.png", rating: 10, type: "Manhwa" },
  { title: "Let's Raise the Villain Properly", slug: "let's-raise-the-villain-properly", coverUrl: "https://media.nyxscans.com/upload/2026/02/28/f75d2aac-6023-4d31-a612-654ec26992e2.webp", rating: 10, type: "Manhwa" },
  { title: "The Villainess Wants a Divorce!", slug: "the-villainess-wants-a-divorce", coverUrl: "https://media.nyxscans.com/upload/2026/01/15/0f5d0631-841c-4654-ae15-2dd9574789da.webp", rating: 4.88, type: "Manhwa" },
  { title: "Pure Delinquent", slug: "pure-delinquent", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm5rclv5t0000hv2awz8fnzy3/877be4c7-4bed-45d9-9f2b-c2ffb6ed09b4.jpg", rating: 10, type: "Manhwa" },
  { title: "The Villains Pure Love", slug: "the-villains-pure-love", coverUrl: "https://media.nyxscans.com/upload/2026/03/24/8b7b6709-1e51-4abc-9924-86ced6c27fb8.webp", rating: 10, type: "Manhwa" },
  { title: "Hate Girl", slug: "hate-girl", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm9yfqne4000do901q66k1txk/0c6e2dc4-1539-41ca-b203-41e284dfbebf.jpg", rating: 10, type: "Manhwa" },
  { title: "The Scandal Maker Has Returned", slug: "the-scandal-maker-has-returned", coverUrl: "https://media.nyxscans.com/upload/2026/03/24/99cbae85-2088-47c6-916e-fd0b64572af7.webp", rating: 9, type: "Manhwa" },
  { title: "Ex-Love Review", slug: "ex-love-review", coverUrl: "https://media.nyxscans.com/upload/2026/01/09/69371d2b-04ea-4474-8746-d4d29dd84291.webp", rating: 9.89, type: "Manhwa" },
  { title: "I Faked a Pregnancy, but My Husband Returned", slug: "i-faked-a-pregnancy-but-my-husband-returned", coverUrl: "https://media.nyxscans.com/upload/series/featured/cm5rclv5t0000hv2awz8fnzy3/a05af260-cb03-4991-9312-aae8cb32150c.png", rating: 10, type: "Manhwa" },
  { title: "Dépaysement", slug: "depaysement", coverUrl: "https://media.nyxscans.com/upload/series/featured/cmjwxv33e000jnr1t5o8rlvxt/f6550bde-1d97-4624-9b87-63ff961652d2.jpg", rating: 10, type: "Manhwa" },
  { title: "I'm a Sickly Mother, But I'll Raise My Villainous Son!", slug: "i'm-a-sickly-mother-but-i'll-raise-my-villainous-son!", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm5rclv5t0000hv2awz8fnzy3/be25ad4d-f218-4f75-9445-d63dc1bae355.jpg", rating: 10, type: "Manhwa" },
  { title: "The Mansion Awaits Spring", slug: "the-mansion-awaits-spring", coverUrl: "https://storage.nyxscans.com/public/upload/series/featured/cm83hfh030029p601pryli9ph/6c7128c4-0946-4f54-a472-91ecbbab3228.png", rating: 5, type: "Manhwa" },
  { title: "The crown I will take from you", slug: "the-crown-i-will-take-from-you", coverUrl: "https://media.nyxscans.com/upload/2026/01/09/c9b620c0-69ef-4474-81a5-0f25f2c504f7.webp", rating: 10, type: "Manhwa" },
];

export async function GET() {
  try {
    const { scrapeNyxComics } = await import("@/lib/scraper");
    const data = await scrapeNyxComics();
    return NextResponse.json(data.series.length > 0 ? data.series : fallbackComics);
  } catch {
    return NextResponse.json(fallbackComics);
  }
}
