import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpg, png, webp, gif" }, { status: 400 });
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dir = path.join(UPLOAD_DIR, safeFolder);
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop() || "webp";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(dir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${safeFolder}/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[api/admin/upload]", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
