/*
 * Al-Yusr service worker — Web Push only (no offline caching).
 * Shows notifications sent by the backend (Laravel WebPushChannel) even when no tab of the site
 * is open, and opens the right dashboard page when one is clicked.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "مؤسسة اليسر", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "مؤسسة اليسر";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/favicon.png",
      badge: "/favicon.png",
      dir: "rtl",
      lang: "ar",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/admin/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/admin/notifications";
  // Only same-site paths are opened.
  const target = new URL(path.startsWith("/") ? path : "/admin/notifications", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.startsWith(self.location.origin) && "focus" in w) {
          w.navigate(target);
          return w.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
