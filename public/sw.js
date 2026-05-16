const CACHE_NAME = "verite-v2";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Handle share target POST
  if (url.pathname === "/share" && e.request.method === "POST") {
    e.respondWith(Response.redirect("/?shared=1", 303));
    e.waitUntil(
      (async () => {
        const data = await e.request.formData();
        const file = data.get("file");
        if (file) {
          // Read file as ArrayBuffer so client can handle both .txt and .zip
          const buffer = await file.arrayBuffer();
          const fileName = file.name || "chat.txt";
          // Wait for client to be ready
          setTimeout(async () => {
            const allClients = await self.clients.matchAll({ type: "window" });
            for (const client of allClients) {
              client.postMessage({ type: "shared-file", buffer, fileName });
            }
          }, 1500);
        }
      })()
    );
    return;
  }

  // Network first, fallback to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "Vérité";
  const options = {
    body: data.body || "Nouvelle mise à jour disponible !",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
