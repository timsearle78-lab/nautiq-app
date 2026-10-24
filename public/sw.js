const CACHE = "nautiq-v6";
const SUPABASE_DATA_CACHE = "nautiq-data-v1";
const STATIC = ["/", "/offline"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== SUPABASE_DATA_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Supabase data reads: network-first, stale-while-revalidate, serve cached on offline
  // Only cache read queries (GET to /rest/v1/) — skip auth, realtime, storage
  if (
    request.method === "GET" &&
    url.hostname.includes("supabase.co") &&
    url.pathname.startsWith("/rest/v1/") &&
    !url.pathname.includes("/auth/")
  ) {
    e.respondWith(
      fetch(request.clone())
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SUPABASE_DATA_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Never intercept: auth, other API, non-Supabase external hosts, non-GET
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("groq.com") ||
    url.hostname.includes("anthropic.com")
  ) {
    return;
  }

  // Navigation requests: network-first, cache on success.
  // On failure: serve the cached version of the requested page if available,
  // then fall back to the cached app shell ("/") so the user stays in the app.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          // Nothing cached at all — return a minimal redirect so the
          // browser always gets a valid Response (avoids ERR_FAILED).
          return new Response(
            '<!doctype html><meta http-equiv="refresh" content="0;url=/"><title>NautIQ</title>',
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // Static assets (_next/static): cache-first, but only cache successful responses
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }
});
