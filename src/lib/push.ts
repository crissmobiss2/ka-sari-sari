// Web Push notifications via VAPID
// Generate keys once: npx web-push generate-vapid-keys
// Add to .env.local: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@domain.com)

import webpush from "web-push";
import { supabaseAdmin } from "./supabase";

function initWebPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@kasarisari.com";
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
  }
}

initWebPush();

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const notification = JSON.stringify({ ...payload, icon: "/icon-192.png", badge: "/icon-192.png" });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
          notification
        );
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Subscription expired — remove it
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

export async function sendPushToRole(role: string, payload: PushPayload): Promise<void> {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("role", role)
    .eq("status", "active");

  if (!users?.length) return;
  await Promise.allSettled(users.map((u) => sendPushToUser(u.id, payload)));
}
