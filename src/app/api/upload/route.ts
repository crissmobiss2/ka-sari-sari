// POST /api/upload — Vercel Blob image upload for products and POD photos
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { put } from "@vercel/blob";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 20 uploads per hour per user
  const rlKey = `upload:${session.userId ?? getClientIp(req)}`;
  const { allowed, retryAfterSecs } = await checkRateLimit(rlKey, 20, 60 * 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Upload limit exceeded. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Return a placeholder URL in dev mode
    return NextResponse.json({
      url: "/placeholder-image.jpg",
      pathname: "placeholder-image.jpg",
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ALLOWED_FOLDERS = ["uploads", "products", "pod", "receipts"];
    const rawFolder = (formData.get("folder") as string) ?? "uploads";
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "uploads";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate file type
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const filename = `${folder}/${session.userId}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
