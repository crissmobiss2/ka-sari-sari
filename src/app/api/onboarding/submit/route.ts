// POST /api/onboarding/submit — finalize onboarding and send the account to review.
// Requires the mandatory KYC docs + consent, then flips the retailer to
// 'under_review' and notifies admins.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  getRetailerProfile,
  getKycDocuments,
  setVerificationStatus,
  getUsersByRole,
  createNotification,
} from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const REQUIRED_DOCS = ["gov_id", "selfie", "storefront"];

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "retailer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!useSupabase) return NextResponse.json({ ok: true, demo: true, verificationStatus: "approved" });

  const [profile, docs] = await Promise.all([
    getRetailerProfile(session.userId),
    getKycDocuments(session.userId),
  ]);

  // Mandatory KYC documents (admin-review + required-for-everyone policy).
  const have = new Set(docs.map((d) => d.docType));
  const missingDocs = REQUIRED_DOCS.filter((t) => !have.has(t));
  if (missingDocs.length) {
    return NextResponse.json({ error: "Missing required documents", missingDocs }, { status: 400 });
  }

  // Required profile fields + consent.
  const missingFields: string[] = [];
  if (!profile?.ownerFullName) missingFields.push("ownerFullName");
  if (!profile?.idType || !profile?.idNumber) missingFields.push("id");
  if (!profile?.storeType) missingFields.push("storeType");
  if (!profile?.barangay) missingFields.push("barangay");
  if (!profile?.privacyConsent) missingFields.push("privacyConsent");
  if (!profile?.termsAccepted) missingFields.push("termsAccepted");
  if (missingFields.length) {
    return NextResponse.json({ error: "Incomplete onboarding", missingFields }, { status: 400 });
  }

  try {
    await setVerificationStatus(session.userId, "under_review");

    // Notify admins that a store is awaiting review.
    const admins = await getUsersByRole("admin");
    await Promise.all(
      admins.map((a) =>
        createNotification(a.id, {
          title: "New store awaiting review",
          body: `${profile?.ownerFullName ?? session.name} submitted onboarding for review.`,
          type: "retailer_review",
          data: { retailerId: session.userId },
        }).catch(() => {})
      )
    );

    return NextResponse.json({ ok: true, verificationStatus: "under_review" });
  } catch (err) {
    console.error("Onboarding submit error:", err);
    return NextResponse.json({ error: "Failed to submit for review" }, { status: 500 });
  }
}
