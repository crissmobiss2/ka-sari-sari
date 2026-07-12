import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWalletBalance, getWalletTransactions } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (useSupabase) {
    try {
      const [balance, transactions] = await Promise.all([
        getWalletBalance(session.userId),
        getWalletTransactions(session.userId),
      ]);
      return NextResponse.json({ balance, transactions });
    } catch (err) {
      console.error("[user/wallet] Error:", err);
      return NextResponse.json({ balance: 0, transactions: [] });
    }
  }

  return NextResponse.json({ balance: 0, transactions: [] });
}
