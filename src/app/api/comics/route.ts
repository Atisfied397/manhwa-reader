import { NextResponse } from "next/server";
import { getAllComics } from "@/lib/comics";

export async function GET() {
  const comics = await getAllComics();
  return NextResponse.json(comics);
}
