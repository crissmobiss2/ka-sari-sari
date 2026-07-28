// GET  /api/admin/retailers/[id] — full onboarding profile + KYC docs (signed URLs)
// PATCH /api/admin/retailers/[id] — approve / reject a store owner
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  findUserById,
  getRetailerProfile,
  getKycDocuments,
  createSignedKycUrl,
  setVerificationStatus,
  createNotification,
} from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const [user, profile, docs] = await Promise.all([
    findUserById(id),
    getRetailerProfile(id),
    getKycDocuments(id),
  ]);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docsWithUrls = await Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      docType: d.docType,
      status: d.status,
      url: await createSignedKycUrl(d.storagePath),
    }))
  );

  return NextResponse.json({
    retailer: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      storeName: user.storeName,
      address: user.address,
      city: user.city,
      province: user.province,
      verificationStatus: user.verificationStatus,
      verificationNotes: user.verificationNotes,
      createdAt: user.createdAt,
    },
    profile,
    docs: docsWithUrls,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { action, notes } = await req.json();

  const user = await findUserById(id);
  if (!user || user.role !== "retailer") {
    return NextResponse.json({ error: "Retailer not found" }, { status: 404 });
  }

  if (action === "approve") {
    await setVerificationStatus(id, "approved", { verifiedBy: session.userId, notes });
    await createNotification(id, {
      title: "Store approved 🎉",
      body: "Your store has been verified. You can start ordering now!",
      type: "retailer_approved",
      data: {},
    });
    sendPushToUser(id, { title: "You're approved! 🎉", body: "Start ordering on Ka Sari-Sari.", url: "/dashboard" }).catch(() => {});
  } else if (action === "reject") {
    await setVerificationStatus(id, "rejected", { verifiedBy: session.userId, notes });
    await createNotification(id, {
      title: "Store application update",
      body: notes || "Your application needs attention. Please contact support.",
      type: "retailer_rejected",
      data: {},
    });
    sendPushToUser(id, { title: "Application update", body: notes || "Please review your application.", url: "/onboarding/status" }).catch(() => {});
  } else if (action === "reset") {
    // Send back to the queue (e.g. asked for re-upload).
    await setVerificationStatus(id, "under_review", { verifiedBy: session.userId, notes });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
