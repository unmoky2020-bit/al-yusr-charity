/**
 * Web Push for the dashboard: notifications arrive even when the site is closed.
 * Flow: register /sw.js → ask permission → subscribe with the backend's VAPID public key →
 * POST the subscription to /push/subscriptions. The backend then pushes every new notification.
 */
import { apiFetch } from "@/data/laravelApi";

export type PushStatus = "unsupported" | "denied" | "off" | "on";

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

export async function enablePush(): Promise<PushStatus> {
  if (!supported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const { public_key } = await apiFetch<{ public_key?: string }>("/push/public-key", { useCache: false });
  if (!public_key) throw new Error("مفتاح الإشعارات مش متظبط على السيرفر");

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(public_key) }));

  const json = sub.toJSON();
  await apiFetch("/push/subscriptions", {
    method: "POST",
    body: { endpoint: json.endpoint, keys: json.keys, content_encoding: (PushManager as unknown as { supportedContentEncodings?: string[] }).supportedContentEncodings?.[0] ?? "aes128gcm" },
  });
  return "on";
}

export async function disablePush(): Promise<PushStatus> {
  if (!supported()) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiFetch("/push/subscriptions", { method: "DELETE", body: { endpoint: sub.endpoint } }).catch(() => undefined);
    await sub.unsubscribe();
  }
  return "off";
}

/** Re-sends an existing subscription after login (the browser keeps it, the user may have changed). */
export async function refreshPushSubscription(): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const json = sub.toJSON();
  await apiFetch("/push/subscriptions", { method: "POST", body: { endpoint: json.endpoint, keys: json.keys } }).catch(() => undefined);
}
