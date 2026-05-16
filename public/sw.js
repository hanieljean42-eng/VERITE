const CACHE_NAME = "verite-v1";
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
