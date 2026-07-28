// POST /api/onboarding/upload — store a KYC document (gov ID, selfie, storefront, permit).
// multipart/form-data: { file, docType }. Stored in the private 'kyc' bucket via the
// service role (the app uses custom JWT auth, so uploads go server-side, not via RLS).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { uploadKycFile, addKycDocument } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const DOC_TYPES = ["gov_id", "selfie", "storefront", "permit"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/heic": "heic", "application/pdf": "pdf",
};
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "retailer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 }); }

  const file = form.get("file");
  const docType = String(form.get("docType") || "");
  if (!DOC_TYPES.includes(docType)) {
    return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, or PDF." }, { status: 415 });
  }

  if (!useSupabase) return NextResponse.json({ ok: true, demo: true, docType });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = await uploadKycFile(session.userId, docType, bytes, file.type, ext);
    await addKycDocument(session.userId, docType, path);
    return NextResponse.json({ ok: true, docType });
  } catch (err) {
    console.error("KYC upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
