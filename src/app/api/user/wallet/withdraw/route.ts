// POST /api/user/wallet/withdraw — request a payout from the wallet balance.
// Debits the wallet and records the request; the actual disbursement to
// GCash/Maya is an operations step (or a future PayMongo payouts integration).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWalletBalance, debitWallet } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const MIN_WITHDRAWAL = 50;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount, method, accountNumber, accountName } = await req.json();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ₱${MIN_WITHDRAWAL}.` }, { status: 400 });
    }
    if (!method || !accountNumber) {
      return NextResponse.json({ error: "Payout method and account number are required." }, { status: 400 });
    }

    if (!useSupabase) {
      // Demo mode: the client-side wallet store reflects the balance.
      return NextResponse.json({ success: true });
    }

    const balance = await getWalletBalance(session.userId);
    if (amt > balance) {
      return NextResponse.json({ error: "Amount exceeds your available balance." }, { status: 400 });
    }

    const dest = accountName ? `${method} ${accountNumber} (${accountName})` : `${method} ${accountNumber}`;
    await debitWallet(session.userId, amt, `Withdrawal to ${dest}`);
    const newBalance = await getWalletBalance(session.userId);

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err) {
    console.error("wallet withdraw error:", err);
    return NextResponse.json({ error: "Withdrawal failed. Please try again." }, { status: 500 });
  }
}
