// Credit application — POST to apply, GET for status, PATCH for admin review
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  applyForCredit,
  getCreditApplications,
  reviewCreditApplication,
  createNotification,
} from "@/lib/supabase-db";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPushToRole, sendPushToUser } from "@/lib/push";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ applications: [] });
  }

  if (session.role === "admin") {
    // Admin sees all applications, optionally filtered by status
    const status = new URL(req.url).searchParams.get("status") ?? undefined;
    const applications = await getCreditApplications(status);
    return NextResponse.json({ applications });
  }

  // Retailer sees their own applications
  const { data } = await supabaseAdmin
    .from("credit_applications")
    .select("*")
    .eq("retailer_id", session.userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ applications: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "retailer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { requestedLimit, requestedTerms = 7 } = await req.json();
    if (!requestedLimit || requestedLimit < 500) {
      return NextResponse.json({ error: "Minimum credit request is ₱500" }, { status: 400 });
    }

    const applicationId = await applyForCredit(session.userId, requestedLimit, requestedTerms);

    // Notify admins
    sendPushToRole("admin", {
      title: "New Credit Application",
      body: `${session.name} applied for ₱${requestedLimit.toLocaleString()} credit line.`,
      url: "/admin/credit",
    }).catch(() => {});

    return NextResponse.json({ applicationId });
  } catch (err) {
    console.error("Credit application error:", err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { applicationId, decision, approvedLimit, approvedTerms, notes, rejectionReason } = await req.json();
    if (!applicationId || !decision) {
      return NextResponse.json({ error: "applicationId and decision required" }, { status: 400 });
    }

    await reviewCreditApplication(
      applicationId,
      session.userId,
      decision as "approved" | "rejected",
      approvedLimit,
      approvedTerms,
      rejectionReason ?? notes
    );

    // Get retailer ID to notify
    const { data: app } = await supabaseAdmin
      .from("credit_applications")
      .select("retailer_id")
      .eq("id", applicationId)
      .single();

    if (app?.retailer_id) {
      const approved = decision === "approved";
      await createNotification(app.retailer_id, {
        title: approved ? "Credit Approved!" : "Credit Application Update",
        body: approved
          ? `Your credit line of ₱${approvedLimit?.toLocaleString()} has been approved.`
          : `Your credit application was not approved. ${rejectionReason ?? ""}`,
        type: approved ? "credit_approved" : "credit_rejected",
        data: { applicationId },
      });
      sendPushToUser(app.retailer_id, {
        title: approved ? "Credit Approved!" : "Credit Application Update",
        body: approved ? `₱${approvedLimit?.toLocaleString()} credit line activated.` : "See app for details.",
        url: "/wallet",
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Credit review error:", err);
    return NextResponse.json({ error: "Failed to review application" }, { status: 500 });
  }
}
