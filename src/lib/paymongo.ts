// PayMongo — BSP-licensed Philippine payment gateway
// Supports: GCash, Maya, QRPh, Visa/MC, all major PH banks
// Dashboard: dashboard.paymongo.com
// Docs: developers.paymongo.com

const PM_BASE = "https://api.paymongo.com/v1";

function pmHeaders() {
  const key = process.env.PAYMONGO_SECRET_KEY!;
  return {
    Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
    "Content-Type": "application/json",
  };
}

async function pmRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${PM_BASE}${path}`, {
    method,
    headers: pmHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.errors?.[0]?.detail ?? "PayMongo error");
  return json.data as T;
}

// ── Payment Intents ──────────────────────────────────────────────────────────

export type PMPaymentIntent = {
  id: string;
  attributes: {
    amount: number;
    status: string;
    client_key: string;
    payment_method_allowed: string[];
    last_payment_error?: { message: string };
  };
};

export async function createPaymentIntent(
  amountCentavos: number,
  currency = "PHP",
  description?: string,
  metadata?: Record<string, string>
): Promise<PMPaymentIntent> {
  return pmRequest<PMPaymentIntent>("POST", "/payment_intents", {
    data: {
      attributes: {
        amount: amountCentavos,
        currency,
        payment_method_allowed: ["gcash", "paymaya", "card", "dob", "billease", "qrph"],
        capture_type: "automatic",
        description,
        ...(metadata ? { metadata } : {}),
      },
    },
  });
}

export async function retrievePaymentIntent(id: string): Promise<PMPaymentIntent> {
  return pmRequest<PMPaymentIntent>("GET", `/payment_intents/${id}`);
}

// ── Payment Methods ──────────────────────────────────────────────────────────

export type PMPaymentMethod = {
  id: string;
  attributes: { type: string; billing?: unknown };
};

export async function createPaymentMethod(
  type: "gcash" | "paymaya" | "qrph",
  billing?: { name: string; email: string; phone: string }
): Promise<PMPaymentMethod> {
  return pmRequest<PMPaymentMethod>("POST", "/payment_methods", {
    data: {
      attributes: {
        type,
        billing: billing
          ? { name: billing.name, email: billing.email, phone: billing.phone }
          : undefined,
      },
    },
  });
}

// ── Attach Payment Method to Intent ─────────────────────────────────────────

export async function attachPaymentMethod(
  intentId: string,
  methodId: string,
  returnUrl: string
): Promise<PMPaymentIntent> {
  return pmRequest<PMPaymentIntent>("POST", `/payment_intents/${intentId}/attach`, {
    data: {
      attributes: {
        payment_method: methodId,
        return_url: returnUrl,
        client_key: undefined,
      },
    },
  });
}

// ── Sources (for redirect-based flows) ──────────────────────────────────────

export type PMSource = {
  id: string;
  attributes: {
    type: string;
    status: string;
    redirect: { checkout_url: string; success: string; failed: string };
  };
};

export async function createSource(
  type: "gcash" | "grab_pay",
  amountCentavos: number,
  successUrl: string,
  failedUrl: string,
  description?: string
): Promise<PMSource> {
  return pmRequest<PMSource>("POST", "/sources", {
    data: {
      attributes: {
        type,
        amount: amountCentavos,
        currency: "PHP",
        redirect: { success: successUrl, failed: failedUrl },
        description,
      },
    },
  });
}

// ── Webhook Signature Verification ──────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return false;
  const { createHmac } = require("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centavosToString(centavos: number): string {
  return "₱" + (centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}
