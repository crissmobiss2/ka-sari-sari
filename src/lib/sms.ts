// Semaphore SMS — PH-native SMS provider (Globe + Smart direct routing)
// Sign up at semaphore.co.ph — ₱0.50/SMS

const SEMAPHORE_API = "https://api.semaphore.co.ph/api/v4";

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] SEMAPHORE_API_KEY not set — SMS not sent");
    return false;
  }

  // Normalize PH phone: 09XX → +639XX
  const normalized = phone.startsWith("09")
    ? "+63" + phone.slice(1)
    : phone;

  try {
    const res = await fetch(`${SEMAPHORE_API}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        number: normalized,
        message,
        // Must match the sender name registered & approved with Semaphore.
        sendername: process.env.SEMAPHORE_SENDER_NAME || "KASARISARI",
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[SMS] Failed:", err);
    return false;
  }
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOTP(code: string): Promise<string> {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    // Without a real secret every OTP hash uses a known salt and is trivially
    // brute-forceable. Refuse to run in production; warn loudly in dev.
    if (process.env.NODE_ENV === "production") {
      throw new Error("OTP_SECRET environment variable is required in production");
    }
    console.warn("[SMS] OTP_SECRET not set — OTP hashing is insecure (dev only)");
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(code + (secret ?? "")).digest("hex");
}

export async function verifyOTPHash(code: string, hash: string): Promise<boolean> {
  return (await hashOTP(code)) === hash;
}
