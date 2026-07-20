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
        sendername: "KASARISARI",
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
  const { createHash } = await import("crypto");
  return createHash("sha256").update(code + process.env.OTP_SECRET).digest("hex");
}

export async function verifyOTPHash(code: string, hash: string): Promise<boolean> {
  return (await hashOTP(code)) === hash;
}
