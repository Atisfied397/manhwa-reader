import { NextResponse } from "next/server";
import { getCategoryGenreSeries } from "@/lib/categories";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ genre: string }> }
) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const { genre } = await params;

  const result = await getCategoryGenreSeries(genre, source, page);
  return NextResponse.json(result);
}
