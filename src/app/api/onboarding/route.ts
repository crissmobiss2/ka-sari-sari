// GET/PATCH /api/onboarding — the signed-in retailer's onboarding profile.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  findUserById,
  getRetailerProfile,
  upsertRetailerProfile,
  updateUser,
  getKycDocuments,
  type RetailerProfile,
} from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!useSupabase) {
    return NextResponse.json({ verificationStatus: "approved", profile: null, docs: [] });
  }

  const [user, profile, docs] = await Promise.all([
    findUserById(session.userId),
    getRetailerProfile(session.userId),
    getKycDocuments(session.userId),
  ]);
  return NextResponse.json({
    verificationStatus: user?.verificationStatus ?? "pending",
    verificationNotes: user?.verificationNotes ?? null,
    profile,
    docs: docs.map((d) => ({ id: d.id, docType: d.docType, status: d.status })),
  });
}

// Fields the client may write. Everything else is ignored.
const ALLOWED: (keyof RetailerProfile)[] = [
  "ownerFullName", "birthdate", "idType", "idNumber",
  "storeType", "yearsOperating", "storeSize", "operatingHours",
  "barangay", "landmark", "latitude", "longitude",
  "dtiName", "permitNumber", "tin",
  "deliveryDays", "deliveryWindow", "altContactName", "altContactPhone",
  "estMonthlySales", "currentSuppliers",
  "privacyConsent", "termsAccepted", "marketingOptIn", "consentAt",
];

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "retailer") {
    return NextResponse.json({ error: "Only store owners have an onboarding profile" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const patch: Partial<RetailerProfile> = {};
  for (const key of ALLOWED) {
    if (body[key] !== undefined) (patch as Record<string, unknown>)[key] = body[key];
  }
  // Stamp consent time when either consent flag is set true.
  if ((patch.privacyConsent || patch.termsAccepted) && !patch.consentAt) {
    patch.consentAt = new Date().toISOString();
  }

  if (!useSupabase) return NextResponse.json({ ok: true, demo: true });

  // Some fields also live on the users row (used for deliveries + admin display).
  const userPatch: Record<string, string> = {};
  if (typeof body.storeName === "string" && body.storeName) userPatch.storeName = body.storeName;
  if (typeof body.city === "string" && body.city) userPatch.city = body.city;
  if (typeof body.province === "string" && body.province) userPatch.province = body.province;
  const addrParts = [body.barangay, body.city, body.province].filter(Boolean);
  if (body.barangay || body.city) userPatch.address = addrParts.join(", ");

  try {
    await upsertRetailerProfile(session.userId, patch);
    if (Object.keys(userPatch).length) await updateUser(session.userId, userPatch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Onboarding profile save error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
