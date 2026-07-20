// GET /api/orders/[id]/receipt — returns a printable HTML Official Receipt
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrderById as sbGet } from "@/lib/supabase-db";
import { getOrderById as legacyGet } from "@/lib/db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderData(raw: unknown): Record<string, any> {
  return raw as Record<string, unknown> as Record<string, any>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: Record<string, any> | null = null;

  if (useSupabase) {
    const raw = await sbGet(id);
    if (!raw) return new NextResponse("Order not found", { status: 404 });
    const o = toOrderData(raw);
    const retailerId = o.retailerId ?? o.retailer_id;
    if (session.role === "retailer" && retailerId !== session.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    order = o;
  } else {
    const raw = legacyGet(id);
    if (!raw) return new NextResponse("Order not found", { status: 404 });
    const o = toOrderData(raw);
    const ownerId = o.retailerId ?? o.retailer_id ?? o.userId ?? o.user_id;
    if (session.role === "retailer" && ownerId !== session.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    order = o;
  }

  if (!order) return new NextResponse("Order not found", { status: 404 });

  const orderNum  = order.orderNumber ?? order.order_number ?? id;
  const rawDate   = order.createdAt ?? order.created_at ?? new Date().toISOString();
  const dateStr   = new Date(rawDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const timeStr   = new Date(rawDate).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const retailer  = order.retailer as Record<string, string> | null | undefined;
  const storeName = retailer?.storeName ?? retailer?.store_name ?? session.name;
  const address   = retailer?.address ?? order.deliveryAddress ?? order.delivery_address ?? "";
  const payMethod = order.paymentMethod ?? order.payment_method ?? "COD";
  const subtotal  = Number(order.total ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(order.items) ? order.items : [];

  const vatBase = +(subtotal / 1.12).toFixed(2);
  const vatAmt  = +(subtotal - vatBase).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Official Receipt — ${orderNum}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #111;
    background: #fff;
    max-width: 640px;
    margin: 32px auto;
    padding: 0 16px;
  }
  .receipt { border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f47028; padding-bottom: 20px; }
  .logo { font-size: 22px; font-weight: 700; color: #f47028; margin-bottom: 4px; }
  .biz-info { font-size: 11px; color: #64748b; line-height: 1.6; }
  .or-badge { display: inline-block; background: #f47028; color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 12px; border-radius: 99px; margin-bottom: 10px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-item label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px; }
  .meta-item span { font-size: 13px; font-weight: 600; color: #111; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 20px 0 8px; }
  .bill-to { background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
  .bill-to .name { font-weight: 700; font-size: 14px; color: #111; }
  .bill-to .detail { font-size: 12px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { border-bottom: 1px solid #e2e8f0; }
  thead th { text-align: left; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 4px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody td { padding: 10px 4px; font-size: 12px; color: #111; }
  tbody td:last-child { text-align: right; font-weight: 600; }
  .totals { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 4px; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #64748b; }
  .total-row.grand { font-size: 16px; font-weight: 700; color: #111; border-top: 2px solid #f47028; padding-top: 10px; margin-top: 8px; }
  .payment-badge { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-size: 11px; font-weight: 600; border-radius: 99px; padding: 4px 12px; margin-top: 16px; }
  .sig-section { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .sig-box { border-top: 1px solid #111; padding-top: 8px; font-size: 11px; color: #64748b; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.7; }
  .no-print { text-align: center; margin-top: 20px; padding-bottom: 32px; }
  .btn { font-weight: 600; font-size: 13px; border: none; border-radius: 10px; padding: 10px 24px; cursor: pointer; }
  .btn-primary { background: #f47028; color: #fff; margin-right: 8px; }
  .btn-secondary { background: #f1f5f9; color: #64748b; }
  @media print { .no-print { display: none !important; } body { margin: 0; max-width: none; } .receipt { border: none; padding: 0; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo">Ka Sari-Sari</div>
    <div class="biz-info">
      Ka Sari-Sari Wholesale Distribution, Inc.<br>
      NCR Hub, Valenzuela City, Metro Manila 1440<br>
      TIN: 000-000-000-000 &middot; VAT Registered
    </div>
  </div>

  <div style="text-align:center;margin-bottom:20px">
    <span class="or-badge">Official Receipt</span>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>OR Number</label><span>${orderNum}</span></div>
    <div class="meta-item"><label>Date &amp; Time</label><span>${dateStr} ${timeStr}</span></div>
  </div>

  <div class="section-title">Bill To</div>
  <div class="bill-to">
    <div class="name">${storeName}</div>
    ${retailer?.name && retailer.name !== storeName ? `<div class="detail">${retailer.name}</div>` : ""}
    ${address ? `<div class="detail">${address}</div>` : ""}
  </div>

  <div class="section-title">Items Ordered</div>
  <table>
    <thead>
      <tr>
        <th style="width:44%">Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0
        ? items.map((item) => {
            const name      = item.name ?? item.productName ?? (item.product?.name) ?? "Item";
            const qty       = Number(item.quantity ?? item.qty ?? 1);
            const unitPrice = Number(item.price ?? item.unitPrice ?? item.unit_price ?? 0);
            const lineTotal = unitPrice * qty;
            return `<tr>
              <td>${name}</td>
              <td style="text-align:center">${qty}</td>
              <td style="text-align:right">&#8369;${unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
              <td>&#8369;${lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
            </tr>`;
          }).join("")
        : `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:16px 0">Item details not available</td></tr>`
      }
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>VAT-exclusive base</span><span>&#8369;${vatBase.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
    <div class="total-row"><span>Output VAT (12%)</span><span>&#8369;${vatAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
    <div class="total-row grand"><span>Total Amount Due</span><span>&#8369;${subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div>
    <span class="payment-badge">&#10003; Paid via ${
      payMethod === "cod" ? "Cash on Delivery"
      : payMethod === "gcash" ? "GCash"
      : payMethod === "maya" ? "Maya"
      : String(payMethod)
    }</span>
  </div>

  <div class="sig-section">
    <div class="sig-box">Received by (Customer)</div>
    <div class="sig-box">Authorized Signatory</div>
  </div>

  <div class="footer">
    This document is an acknowledgement that the above goods were received in good condition.<br>
    This serves as an Official Receipt pursuant to BIR Revenue Regulations.<br>
    Series: OR-KSS-2025-001 &middot; Authority to Print: ATP-XXXXXXXX<br>
    Validity: January 2025 &ndash; December 2027
  </div>
</div>

<div class="no-print">
  <button class="btn btn-primary" onclick="window.print()">Print Receipt</button>
  <button class="btn btn-secondary" onclick="window.close()">Close</button>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
